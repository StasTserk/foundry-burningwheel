import { Ability, BWActor, TracksTests } from "../actors/BWActor";

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
    RollOptions,
    mergeDialogData,
    getSplitPoolText,
    getSplitPoolRoll,
    NpcEventHandlerOptions
} from "./rolls";
import { byName, notifyError } from "../helpers";
import { Npc } from "../actors/Npc";
import { handleNpcStatRoll, NpcStatName, NpcStatRollOptions } from "./npcStatRoll";
import { Skill } from "../items/skill";
import { MeleeWeapon } from "../items/meleeWeapon";
import { Possession } from "../items/possession";
import { RangedWeapon } from "../items/rangedWeapon";
import { Spell } from "../items/spell";
import { buildHelpDialog } from "../dialogs/buildHelpDialog";

export async function handleNpcWeaponRollEvent({ target, sheet, dataPreset }: NpcEventHandlerOptions): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const itemId = target.dataset.weaponId || "";
    if (!skillId) {
        return notifyError("No Weapon Skill", "No Weapon Skill Chosen. Set the sheet into edit mode and pick a Martial skill to use with this weapon.");
    }
    const skill = sheet.actor.items.get(skillId) as Skill;
    const weapon = sheet.actor.items.get(itemId) as MeleeWeapon | RangedWeapon;
    const attackIndex = parseInt(target.dataset.attackIndex as string);
    return handleNpcWeaponRoll({
        actor: sheet.actor as Npc,
        weapon,
        skill,
        attackIndex,
        dataPreset
    });
}

export async function handleNpcWeaponRoll({actor, weapon, skill, attackIndex, dataPreset}: NpcRollOptions): Promise<unknown> {
    if (!weapon) {
        return notifyError("Missing Weapon", "The weapon that is being cast appears to be missing from the character sheet.");
    }
    const extraInfo = weapon.type === "melee weapon" ? 
        await (weapon as MeleeWeapon).getWeaponMessageData(attackIndex || 0) :
        await (weapon as RangedWeapon).getWeaponMessageData();
    return handleNpcSkillRoll({actor, skill, extraInfo, dataPreset});
}

export async function handleNpcSpellRollEvent({ target, sheet, dataPreset }: NpcEventHandlerOptions): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const itemId = target.dataset.spellId || "";
    if (!skillId) {
        return notifyError("No Sorcerous Skill", "No Casting Skill Chosen. Set the sheet into edit mode and pick a Sorcerous skill to use with this weapon.");
    }
    const skill = sheet.actor.items.get(skillId) as Skill;
    const spell = sheet.actor.items.get(itemId) as Spell;
    return handleNpcSpellRoll({ actor: sheet.actor, spell, skill, dataPreset });
}

export async function handleNpcSpellRoll({ actor, spell, skill, dataPreset}: NpcRollOptions): Promise<unknown> {
    if (!spell) {
        return notifyError("Missing Spell", "The spell that is being cast appears to be missing from the character sheet.");
    }
    const obstacle = spell.system.variableObstacle ? 3 : spell.system.obstacle;
    if (dataPreset) {
        dataPreset.difficulty = obstacle;
    } else {
        dataPreset = { difficulty: obstacle };
    }
    dataPreset.useCustomDifficulty = dataPreset.showObstacles = dataPreset.showDifficulty = true;
    const extraInfo = await spell.getSpellMessageData();
    return handleNpcSkillRoll({actor, skill, extraInfo, dataPreset});
}

export async function handleNpcSkillRollEvent({ target, sheet, extraInfo, dataPreset }: NpcEventHandlerOptions): Promise<unknown> {
    const actor = sheet.actor;
    const skill = actor.items.get(target.dataset.skillId || "") as Skill;
    return handleNpcSkillRoll({actor, skill, extraInfo, dataPreset});
}

export async function handleNpcSkillRoll({ actor, skill, extraInfo, dataPreset}: NpcRollOptions): Promise<unknown>  {
    dataPreset = dataPreset || {};
    dataPreset.deedsPoint = actor.system.deeds !== 0;

    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: skill.system.exp,
            skillId: skill.id,
            actor,
            helpedWith: skill.name
        });
    }

    if (actor.system.persona) {
        dataPreset.personaOptions = Array.from(Array(Math.min(actor.system.persona, 3)).keys());
    }
    
    if (skill.system.learning) {
        const accessor = skill.system.root1;
        if (dataPreset) {
            dataPreset.learning = true;
        } else {
            dataPreset = { learning: true };
        }
        const stat = getProperty(actor.system, accessor) as Ability;
        const rollData: NpcStatRollOptions = {
            dice: stat.exp,
            shade: stat.shade,
            open: stat.open,
            statName: game.i18n.localize("BW."+skill.system.root1),
            accessor: skill.system.root1 as NpcStatName,
            actor,
            extraInfo,
            dataPreset
        };
        if (skill.system.root2) {
            // learning skill that requires a stat choice for rolling
            return new Dialog({
                title: "Pick which base stat to use",
                content: "<p>The listed skill uses one of two possible roots. Pick one to roll.</p>",
                buttons: {
                    root1: {
                        label: skill.system.root1.titleCase(),
                        callback: () => handleNpcStatRoll(rollData)
                    },
                    root2: {
                        label: skill.system.root2.titleCase(),
                        callback: () => {
                            const stat2 = getProperty(actor.system, `${skill.system.root2}`) as Ability;
                            rollData.dice = stat2.exp;
                            rollData.shade = stat2.shade;
                            rollData.open = stat2.open;
                            rollData.statName = game.i18n.localize("BW."+skill.system.root2);
                            rollData.accessor = skill.system.root2 as NpcStatName;
                            return handleNpcStatRoll(rollData);
                        }
                    }
                },
                default: "root1"
            }).render(true);
        }
        return handleNpcStatRoll(rollData);
    }

    const rollModifiers = actor.getRollModifiers(skill.name);

    const data: NpcSkillDialogData = mergeDialogData<NpcSkillDialogData>({
        name: game.i18n.format("BW.xTest", { name: skill.name }),
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.system.ptgs.woundDice,
        obPenalty: actor.system.ptgs.obPenalty,
        skill: skill.system,
        needsToolkit: skill.system.tools,
        toolkits: actor.toolkits,
        forkOptions: actor.getForkOptions(skill.name).sort(byName),
        wildForks: actor.getWildForks(skill.name).sort(byName),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty
            || !!actor.system.ptgs.obPenalty
            || ((dataPreset && dataPreset.obModifiers && !!dataPreset.obModifiers.length) || false)
    }, dataPreset);

    const html = await renderTemplate(templates.npcRollDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: data.name,
            content: html,
            buttons: {
                roll: {
                    label: game.i18n.localize("BW.roll.roll"),
                    callback: async (dialogHtml: JQuery) =>
                        skillRollCallback(dialogHtml, actor, skill, extraInfo)
                }
            },
            default: "roll"
        }).render(true)
    );
}

async function skillRollCallback(
        dialogHtml: JQuery,
        actor: Npc,
        skill: Skill,
        extraInfo?: string) {
    const rollData = extractRollData(dialogHtml);
    const dg = rollData.difficultyGroup;

    const roll = await rollDice(rollData.diceTotal, skill.system.open, skill.system.shade);
    if (!roll) { return; }

    const wildForkDie = await rollWildFork(rollData.wildForks, skill.system.shade);
    const wildForkBonus = wildForkDie?.total || 0;
    const wildForkDice = wildForkDie?.results || [];

    const isSuccessful = parseInt(roll.result) + wildForkBonus >= rollData.difficultyTotal;

    let splitPoolString: string | undefined;
    let splitPoolRoll: Roll | undefined;
    if (rollData.splitPool) {
        splitPoolRoll = await getSplitPoolRoll(rollData.splitPool, skill.system.open, skill.system.shade);
        splitPoolString = getSplitPoolText(splitPoolRoll);
    }
    extraInfo = `${splitPoolString || ""} ${extraInfo || ""}`;

    const fateReroll = buildRerollData({ actor, roll, itemId: skill.id, splitPoolRoll });
    const callons: RerollData[] = actor.getCallons(skill.name).map(s => {
        return { label: s, ...buildRerollData({ actor, roll, splitPoolRoll, itemId: skill.id }) as RerollData };
    });

    // because artha isn't tracked individually, it doesn't matter what gets updated.
    // both cases here end up just subtracting the artha spent.
    actor.updateArthaForStat("", rollData.persona, rollData.deeds);
    
    if (rollData.addHelp) {
        game.burningwheel.modifiers.grantTests(rollData.difficultyTestTotal, isSuccessful);
    }

    const data: RollChatMessageData = {
        name: game.i18n.format("BW.xTest", { name: skill.name }),
        successes: '' + (parseInt(roll.result) + wildForkBonus),
        splitSuccesses: splitPoolRoll ? splitPoolRoll.result : undefined,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(skill.system.open, skill.system.shade),
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
    toolkits: Possession[];
    forkOptions: {name: string; amount: number}[];
    wildForks: {name: string; amount: number}[];
}

interface NpcRollOptions extends RollOptions {
    actor: Npc & BWActor;
    skill: Skill;
    spell?: Spell;
    weapon?: MeleeWeapon | RangedWeapon;
    attackIndex?: number;
}