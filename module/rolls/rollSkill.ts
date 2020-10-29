import { BWActor, TracksTests } from "../bwactor.js";
import * as helpers from "../helpers.js";
import { Skill, PossessionRootData } from "../items/item.js";
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
} from "./rolls.js";
import { BWCharacter } from "module/character.js";

export async function handleSkillRollEvent({ target, sheet, dataPreset, extraInfo, onRollCallback }: SkillRollEventOptions ): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const skill = (sheet.actor.getOwnedItem(skillId) as Skill);
    const actor = sheet.actor as BWActor;
    return handleSkillRoll({ actor: (actor as BWActor & BWCharacter), skill, dataPreset, extraInfo, onRollCallback});
}

export async function handleSkillRoll({ actor, skill, dataPreset, extraInfo, onRollCallback }: SkillRollOptions): Promise<unknown> {
    const rollModifiers = actor.getRollModifiers(skill.name);

    const templateData = mergeDialogData({
        name: skill.data.name,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: skill.data.data,
        needsToolkit: skill.data.data.tools,
        toolkits: actor.data.toolkits,
        forkOptions: actor.getForkOptions(skill.data.name).sort(helpers.byName),
        wildForks: actor.getWildForks(skill.data.name).sort(helpers.byName),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    }, dataPreset);
    const html = await renderTemplate(templates.skillDialog, templateData);
    return new Promise(_resolve =>
        new Dialog({
            title: `${skill.data.name} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) => {
                        skillRollCallback(dialogHtml, skill, actor, extraInfo);
                        if (onRollCallback) {
                            onRollCallback();
                        }
                    }
                }
            }
        }).render(true)
    );
}

async function skillRollCallback(
    dialogHtml: JQuery, skill: Skill, actor: BWActor & BWCharacter, extraInfo?: string): Promise<unknown> {
    const { diceTotal, difficultyTotal, wildForks, difficultyDice, baseDifficulty, obSources, dieSources, splitPool } = extractRollData(dialogHtml);

    const dg = helpers.difficultyGroup(difficultyDice, difficultyTotal);

    const roll = await rollDice(diceTotal, skill.data.data.open, skill.data.data.shade);
    if (!roll) { return; }

    const wildForkDie = await rollWildFork(wildForks, skill.data.data.shade);
    const wildForkBonus = wildForkDie?.total || 0;
    const wildForkDice = wildForkDie?.results || [];
    
    let splitPoolString: string | undefined;
    let splitPoolRoll: Roll | undefined;
    if (splitPool) {
        splitPoolRoll = await getSplitPoolRoll(splitPool, skill.data.data.open, skill.data.data.shade);
        splitPoolString = getSplitPoolText(splitPoolRoll);
    }
    extraInfo = `${splitPoolString || ""} ${extraInfo || ""}`;

    if (skill.data.data.tools) {
        const toolkitId = extractSelectString(dialogHtml, "toolkitId") || '';
        const tools = actor.getOwnedItem(toolkitId);
        if (tools) {
            const { expended, text } = await maybeExpendTools(tools);
            extraInfo = extraInfo ? `${extraInfo}${text}` : text;
            if (expended) {
                tools.update({
                    "data.expended": true
                }, {});
            }
        }
    }

    const fateReroll = buildRerollData({ actor, roll, itemId: skill._id, splitPoolRoll });
    const callons: RerollData[] = actor.getCallons(skill.name).map(s => {
        return { label: s, ...buildRerollData({ actor, roll, itemId: skill._id, splitPoolRoll }) as RerollData };
    });
    const success = (parseInt(roll.result) + wildForkBonus) >= difficultyTotal;

    const data: RollChatMessageData = {
        name: `${skill.name}`,
        successes: '' + (parseInt(roll.result) + wildForkBonus),
        splitSuccesses: splitPoolRoll ? splitPoolRoll.result : undefined,
        difficulty: baseDifficulty,
        obstacleTotal: difficultyTotal,
        nameClass: getRollNameClass(skill.data.data.open, skill.data.data.shade),
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
    if (success || actor.data.successOnlyRolls.indexOf(skill.name.toLowerCase()) === -1) {
        await helpers.addTestToSkill(skill, dg);
        skill = actor.getOwnedItem(skill._id) as Skill; // update skill with new data
    }
    if (helpers.canAdvance(skill.data.data)) {
        Dialog.confirm({
            title: `Advance ${skill.name}?`,
            content: `<p>${skill.name} is ready to advance. Go ahead?</p>`,
            yes: () => helpers.advanceSkill(skill),
            // tslint:disable-next-line: no-empty
            no: () => { return; },
            defaultYes: true
        });
    }

    const messageHtml = await renderTemplate(templates.skillMessage, data);
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
    toolkits: PossessionRootData[];
}



export interface SkillRollEventOptions extends EventHandlerOptions {
    dataPreset?: Partial<SkillDialogData>;
    extraInfo?: string;
}

export interface SkillRollOptions extends RollOptions {
    skill: Skill,
    actor: BWActor & BWCharacter;
    dataPreset?: Partial<SkillDialogData>;
    extraInfo?: string;
}