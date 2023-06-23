import { TracksTests } from "../actors/BWActor";
import * as helpers from "../helpers";
import {
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    extractSelectString,
    maybeExpendTools,
    rollWildFork,
    extractRollData,
    EventHandlerOptions,
    RollOptions,
    mergeDialogData, getSplitPoolText, getSplitPoolRoll
} from "./rolls";
import { BWCharacter } from "../actors/BWCharacter";
import { Skill } from "../items/skill";
import { Possession } from "../items/possession";
import { buildHelpDialog } from "../dialogs/buildHelpDialog";

export async function handleSkillRollEvent({ target, sheet, dataPreset, extraInfo, onRollCallback }: SkillRollEventOptions ): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const skill = (sheet.actor.items.get(skillId) as Skill);
    const actor = sheet.actor as BWCharacter;
    return handleSkillRoll({ actor, skill, dataPreset, extraInfo, onRollCallback});
}

export async function handleSkillRoll({ actor, skill, dataPreset, extraInfo, onRollCallback }: SkillRollOptions): Promise<unknown> {
    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: skill.system.exp,
            skillId: skill.id,
            actor,
            helpedWith: skill.name
        });
    }
    const rollModifiers = actor.getRollModifiers(skill.name);

    const templateData = mergeDialogData({
        name: game.i18n.format('BW.xTest', { name: skill.name}),
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.system.ptgs.woundDice,
        obPenalty: actor.system.ptgs.obPenalty,
        skill: skill.system,
        needsToolkit: skill.system.tools,
        toolkits: actor.toolkits,
        forkOptions: actor.getForkOptions(skill.name).sort(helpers.byName),
        wildForks: actor.getWildForks(skill.name).sort(helpers.byName),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty
            || !!actor.system.ptgs.obPenalty
            || (dataPreset && dataPreset.obModifiers && !!dataPreset.obModifiers.length || false)
    }, dataPreset);
    const html = await renderTemplate(templates.pcRollDialog, templateData);
    return new Promise(_resolve =>
        new Dialog({
            title: templateData.name,
            content: html,
            buttons: {
                roll: {
                    label: game.i18n.localize("BW.roll.roll"),
                    callback: async (dialogHtml: JQuery) => {
                        skillRollCallback(dialogHtml, skill, actor, extraInfo);
                        if (onRollCallback) {
                            onRollCallback();
                        }
                    }
                }
            },
            default: "roll"
        }).render(true)
    );
}

async function skillRollCallback(
    dialogHtml: JQuery, skill: Skill, actor: BWCharacter, extraInfo?: string): Promise<unknown> {
    const { diceTotal, difficultyTotal, wildForks, difficultyDice, baseDifficulty, obSources, dieSources, splitPool, persona, deeds, addHelp, difficultyTestTotal } = extractRollData(dialogHtml);

    const dg = helpers.difficultyGroup(difficultyDice, difficultyTotal);

    const roll = await rollDice(diceTotal, skill.system.open, skill.system.shade);
    if (!roll) { return; }

    const wildForkDie = await rollWildFork(wildForks, skill.system.shade);
    const wildForkBonus = wildForkDie?.total || 0;
    const wildForkDice = wildForkDie?.results || [];
    
    let splitPoolString: string | undefined;
    let splitPoolRoll: Roll | undefined;
    if (splitPool) {
        splitPoolRoll = await getSplitPoolRoll(splitPool, skill.system.open, skill.system.shade);
        splitPoolString = getSplitPoolText(splitPoolRoll);
    }
    extraInfo = `${splitPoolString || ""} ${extraInfo || ""}`;

    if (skill.system.tools) {
        const toolkitId = extractSelectString(dialogHtml, "toolkitId") || '';
        const tools = actor.items.get<Possession>(toolkitId);
        if (tools) {
            const { expended, text } = await maybeExpendTools(tools);
            extraInfo = extraInfo ? `${extraInfo}${text}` : text;
            if (expended) {
                tools.update({
                    "data.isExpended": true
                }, {});
            }
        }
    }

    const fateReroll = buildRerollData({ actor, roll, itemId: skill.id, splitPoolRoll });
    const callons: RerollData[] = actor.getCallons(skill.name).map(s => {
        return { label: s, ...buildRerollData({ actor, roll, itemId: skill.id, splitPoolRoll }) as RerollData };
    });
    const success = (parseInt(roll.result) + wildForkBonus) >= difficultyTotal;
    if (success || actor.successOnlyRolls.indexOf(skill.name.toLowerCase()) === -1) {
        await skill.addTest(dg);
    }

    if (addHelp) {
        game.burningwheel.modifiers.grantTests(difficultyTestTotal, success);
    }

    actor.updateArthaForSkill(skill.id, persona, deeds);

    const data: RollChatMessageData = {
        name: game.i18n.format('BW.xTest', { name: skill.name}),
        successes: '' + (parseInt(roll.result) + wildForkBonus),
        splitSuccesses: splitPoolRoll ? splitPoolRoll.result : undefined,
        difficulty: baseDifficulty,
        obstacleTotal: difficultyTotal,
        nameClass: getRollNameClass(skill.system.open, skill.system.shade),
        success,
        rolls: roll.dice[0].results,
        wildRolls: wildForkDice,
        difficultyGroup: dg,
        penaltySources: obSources,
        dieSources,
        fateReroll,
        callons,
        extraInfo
    };

    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor})
    });
}

interface SkillDialogData extends RollDialogData {
    skill: TracksTests;
    forkOptions: { name: string, amount: number }[];
    wildForks: { name: string, amount: number }[];
    needsToolkit: boolean;
    toolkits: Possession[];
}



export interface SkillRollEventOptions extends EventHandlerOptions {
    dataPreset?: Partial<SkillDialogData>;
    extraInfo?: string;
}

export interface SkillRollOptions extends RollOptions {
    skill: Skill,
    actor: BWCharacter;
    dataPreset?: Partial<SkillDialogData>;
    extraInfo?: string;
}