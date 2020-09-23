import { TracksTests } from "../bwactor.js";

import {
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    RollOptions,
    extractRollData,
    rollWildFork
} from "./rolls.js";
import { NpcSheet } from "../npc-sheet.js";
import { Skill, MeleeWeapon, RangedWeapon, Spell, PossessionRootData } from "../items/item.js";
import { byName, notifyError } from "../helpers.js";

export async function handleNpcWeaponRoll({ target, sheet }: NpcRollOptions): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const itemId = target.dataset.weaponId || "";
    if (!skillId) {
        return notifyError("No Weapon Skill", "No Weapon Skill Chosen. Set the sheet into edit mode and pick a Martial skill to use with this weapon.");
    }
    const weapon = sheet.actor.getOwnedItem(itemId) as MeleeWeapon | RangedWeapon;
    const extraInfo = weapon.type === "melee weapon" ? 
        MeleeWeapon.GetWeaponMessageData(weapon as MeleeWeapon, parseInt(target.dataset.attackIndex as string)) :
        RangedWeapon.GetWeaponMessageData(weapon as RangedWeapon);
    return handleNpcSkillRoll({target, sheet, extraInfo});
}

export async function handleNpcSpellRoll({ target, sheet }: NpcRollOptions): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const itemId = target.dataset.spellId || "";
    if (!skillId) {
        return notifyError("No Sorcerous Skill", "No Casting Skill Chosen. Set the sheet into edit mode and pick a Sorcerous skill to use with this weapon.");
    }
    const spell = sheet.actor.getOwnedItem(itemId) as Spell;
    const dataPreset = spell.data.data.variableObstacle ? { difficulty: 3 } : { difficulty: spell.data.data.obstacle };
    const extraInfo = Spell.GetSpellMessageData(spell);
    return handleNpcSkillRoll({target, sheet, extraInfo, dataPreset});
}

export async function handleNpcSkillRoll({ target, sheet, extraInfo, dataPreset }: NpcRollOptions): Promise<unknown> {
    const actor = sheet.actor;
    const skill = actor.getOwnedItem(target.dataset.skillId || "") as Skill;
    
    const rollModifiers = sheet.actor.getRollModifiers(skill.name);

    const data: NpcSkillDialogData = Object.assign({
        name: `${skill.name} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: skill.data.data,
        needsToolkit: skill.data.data.tools,
        toolkits: actor.data.toolkits,
        forkOptions: actor.getForkOptions(skill.data.name).sort(byName),
        wildForks: actor.getWildForks(skill.data.name),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    }, dataPreset);

    const html = await renderTemplate(templates.npcRollDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${skill.name} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        skillRollCallback(dialogHtml, sheet, skill, extraInfo)
                }
            }
        }).render(true)
    );
}

async function skillRollCallback(
        dialogHtml: JQuery,
        sheet: NpcSheet,
        skill: Skill,
        extraInfo?: string) {
    const rollData = extractRollData(dialogHtml);
    const dg = rollData.difficultyGroup;
    const accessor = `data.${name}`;

    const roll = await rollDice(rollData.diceTotal, skill.data.data.open, skill.data.data.shade);
    if (!roll) { return; }

    const wildForkDie = await rollWildFork(rollData.wildForks, skill.data.data.shade);
    const wildForkBonus = wildForkDie?.total || 0;
    const wildForkDice = wildForkDie?.rolls || [];

    const isSuccessful = parseInt(roll.result) + wildForkBonus >= rollData.difficultyTotal;

    const fateReroll = buildRerollData(sheet.actor, roll, accessor);
    const callons: RerollData[] = sheet.actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData(sheet.actor, roll, undefined, skill._id) as RerollData };
    });
    
    const data: RollChatMessageData = {
        name: `${skill.name}`,
        successes: '' + (parseInt(roll.result) + wildForkBonus),
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(skill.data.data.open, skill.data.data.shade),
        success: isSuccessful,
        rolls: roll.dice[0].rolls,
        wildRolls: wildForkDice,
        difficultyGroup: dg,
        penaltySources: rollData.obSources,
        dieSources: rollData.dieSources,
        fateReroll,
        callons,
        extraInfo
    };

    const messageHtml = await renderTemplate(templates.npcMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

interface NpcSkillDialogData extends RollDialogData {
    skill: TracksTests;
    needsToolkit: boolean;
    toolkits: PossessionRootData[];
    forkOptions: {name: string; amount: number}[];
    wildForks: {name: string; amount: number}[];
}

interface NpcRollOptions extends RollOptions {
    sheet: NpcSheet;
}