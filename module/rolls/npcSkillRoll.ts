import { BWActor, TracksTests } from "../bwactor.js";

import {
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    extractRollData,
    rollWildFork,
    EventHandlerOptions,
    RollOptions,
    mergeDialogData, getSplitPoolText
} from "./rolls.js";
import { NpcSheet } from "../npc-sheet.js";
import { Skill, MeleeWeapon, RangedWeapon, Spell, PossessionRootData } from "../items/item.js";
import { byName, notifyError } from "../helpers.js";
import { Npc } from "../npc.js";

export async function handleNpcWeaponRollEvent({ target, sheet }: NpcRollEventOptions): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const itemId = target.dataset.weaponId || "";
    if (!skillId) {
        return notifyError("No Weapon Skill", "No Weapon Skill Chosen. Set the sheet into edit mode and pick a Martial skill to use with this weapon.");
    }
    const skill = sheet.actor.getOwnedItem(skillId) as Skill;
    const weapon = sheet.actor.getOwnedItem(itemId) as MeleeWeapon | RangedWeapon;
    const attackIndex = parseInt(target.dataset.attackIndex as string);
    return handleNpcWeaponRoll({
        actor: sheet.actor as BWActor & Npc,
        weapon,
        skill,
        attackIndex
    });

}

export async function handleNpcWeaponRoll({actor, weapon, skill, attackIndex, dataPreset}: NpcRollOptions): Promise<unknown> {
    if (!weapon) {
        return notifyError("Missing Weapon", "The weapon that is being cast appears to be missing from the character sheet.");
    }
    const extraInfo = weapon.type === "melee weapon" ? 
        MeleeWeapon.GetWeaponMessageData(weapon as MeleeWeapon, attackIndex || 0) :
        RangedWeapon.GetWeaponMessageData(weapon as RangedWeapon);
    return handleNpcSkillRoll({actor, skill, extraInfo, dataPreset});
}

export async function handleNpcSpellRollEvent({ target, sheet }: NpcRollEventOptions): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const itemId = target.dataset.spellId || "";
    if (!skillId) {
        return notifyError("No Sorcerous Skill", "No Casting Skill Chosen. Set the sheet into edit mode and pick a Sorcerous skill to use with this weapon.");
    }
    const skill = sheet.actor.getOwnedItem(skillId) as Skill;
    const spell = sheet.actor.getOwnedItem(itemId) as Spell;
    return handleNpcSpellRoll({ actor: sheet.actor, spell, skill });
}

export async function handleNpcSpellRoll({ actor, spell, skill, dataPreset}: NpcRollOptions): Promise<unknown> {
    if (!spell) {
        return notifyError("Missing Spell", "The spell that is being cast appears to be missing from the character sheet.");
    }
    const obstacle = spell.data.data.variableObstacle ? 3 : spell.data.data.obstacle;
    if (dataPreset) {
        dataPreset.difficulty = obstacle;
    } else {
        dataPreset = { difficulty: obstacle };
    }
    const extraInfo = Spell.GetSpellMessageData(spell);
    return handleNpcSkillRoll({actor, skill, extraInfo, dataPreset});
}

export async function handleNpcSkillRollEvent({ target, sheet, extraInfo, dataPreset }: NpcRollEventOptions): Promise<unknown> {
    const actor = sheet.actor;
    const skill = actor.getOwnedItem(target.dataset.skillId || "") as Skill;
    return handleNpcSkillRoll({actor, skill, extraInfo, dataPreset});
}

export async function handleNpcSkillRoll({ actor, skill, extraInfo, dataPreset}: NpcRollOptions): Promise<unknown>  {
    
    const rollModifiers = actor.getRollModifiers(skill.name);

    const data: NpcSkillDialogData = mergeDialogData<NpcSkillDialogData>({
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
        wildForks: actor.getWildForks(skill.data.name).sort(byName),
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
                        skillRollCallback(dialogHtml, actor, skill, extraInfo)
                }
            }
        }).render(true)
    );
}

async function skillRollCallback(
        dialogHtml: JQuery,
        actor: BWActor & Npc,
        skill: Skill,
        extraInfo?: string) {
    const rollData = extractRollData(dialogHtml);
    const dg = rollData.difficultyGroup;

    const roll = await rollDice(rollData.diceTotal, skill.data.data.open, skill.data.data.shade);
    if (!roll) { return; }

    const wildForkDie = await rollWildFork(rollData.wildForks, skill.data.data.shade);
    const wildForkBonus = wildForkDie?.total || 0;
    const wildForkDice = wildForkDie?.results || [];

    const isSuccessful = parseInt(roll.result) + wildForkBonus >= rollData.difficultyTotal;

    const fateReroll = buildRerollData({ actor, roll, itemId: skill.id });
    const callons: RerollData[] = actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData({ actor, roll, itemId: skill._id }) as RerollData };
    });

    let splitPoolString: string | undefined;
    if (rollData.splitPool) {
        splitPoolString = await getSplitPoolText(rollData.splitPool, skill.data.data.open, skill.data.data.shade);
    }
    extraInfo = `${splitPoolString || ""} ${extraInfo || ""}`;
    
    const data: RollChatMessageData = {
        name: `${skill.name}`,
        successes: '' + (parseInt(roll.result) + wildForkBonus),
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(skill.data.data.open, skill.data.data.shade),
        success: isSuccessful,
        rolls: roll.dice[0].results,
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
        speaker: ChatMessage.getSpeaker({ actor })
    });
}

interface NpcSkillDialogData extends RollDialogData {
    skill: TracksTests;
    needsToolkit: boolean;
    toolkits: PossessionRootData[];
    forkOptions: {name: string; amount: number}[];
    wildForks: {name: string; amount: number}[];
}

interface NpcRollEventOptions extends EventHandlerOptions {
    sheet: NpcSheet;
}

interface NpcRollOptions extends RollOptions {
    actor: Npc & BWActor;
    skill: Skill;
    spell?: Spell;
    weapon?: MeleeWeapon | RangedWeapon;
    attackIndex?: number;
}