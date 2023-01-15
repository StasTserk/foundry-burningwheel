import { BWActor, TracksTests, Ability} from "../actors/BWActor.js";
import * as helpers from "../helpers.js";
import {
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    rollDice,
    templates,
    extractSelectString,
    maybeExpendTools,
    RollDialogData,
    extractRollData,
    EventHandlerOptions,
    RollOptions,
    mergeDialogData,
    getSplitPoolText,
    getSplitPoolRoll
} from "./rolls.js";
import { BWCharacter } from "../actors/BWCharacter.js";
import { Skill } from "../items/skill.js";
import { Possession } from "../items/possession.js";
import { buildHelpDialog } from "../dialogs/buildHelpDialog.js";

export async function handleLearningRollEvent(rollOptions: LearningRollEventOptions): Promise<unknown> {
    const actor = rollOptions.sheet.actor;
    const skillId = rollOptions.target.dataset.skillId || "";
    const skill = (rollOptions.sheet.actor.items.get(skillId) as Skill);
    return handleLearningRoll({ actor, skill, ...rollOptions});
}

export function handleLearningRoll({ actor, skill, extraInfo, dataPreset, onRollCallback}: LearningRollOptions): unknown {
    if (skill.system.root2) {
        return new Dialog({
            title: "Pick Root Stat",
            content: "<p>The skill being learned is derived from two roots. Pick one to use for the roll.</p>",
            buttons: {
                root1: {
                    label: skill.system.root1.titleCase(),
                    callback: () => {
                        return buildLearningDialog({ actor, skill, statName: skill.system.root1, extraInfo, dataPreset, onRollCallback });
                    }
                },
                root2: {
                    label: skill.system.root2.titleCase(),
                    callback: () => {
                        return buildLearningDialog({ actor, skill, statName: skill.system.root2, extraInfo, dataPreset, onRollCallback });
                    }
                }
            },
            default: "root1"
        }).render(true);
    }
    return buildLearningDialog({ actor, skill, statName: skill.system.root1, extraInfo, dataPreset, onRollCallback });

}

async function buildLearningDialog({ skill, statName, actor, extraInfo, dataPreset, onRollCallback }: LearningRollDialogSettings): Promise<unknown> {

    const rollModifiers = actor.getRollModifiers(skill.name).concat(actor.getRollModifiers(statName));
    const stat = getProperty(actor.system, statName);

    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: stat.exp,
            path: `system.${statName}`,
            actor,
            helpedWith: statName
        });
    }

    let tax = 0;
    if (statName.toLowerCase() === "will") {
        tax = actor.system.willTax;
    } else if (statName.toLowerCase() === "forte") {
        tax = actor.system.forteTax;
    }

    if (dataPreset) {
        if (dataPreset.optionalDiceModifiers) {
            dataPreset.optionalDiceModifiers.concat(...rollModifiers.filter(r => r.optional && r.dice));
        }
        if (dataPreset.optionalObModifiers) {
            dataPreset.optionalObModifiers.concat(...rollModifiers.filter(r => r.optional && r.obstacle));
        }
    }

    const data: LearningDialogData = mergeDialogData<LearningDialogData>({
        name: `${game.i18n.localize('BW.roll.beginnersLuck')} ${skill.name} ${game.i18n.localize('BW.test')}`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        tax,
        woundDice: actor.system.ptgs.woundDice,
        obPenalty: actor.system.ptgs.obPenalty,
        toolkits: actor.toolkits,
        needsToolkit: skill.system.tools,
        learning: true,
        skill: stat,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty
            || !!actor.system.ptgs.obPenalty
            || (dataPreset && dataPreset.obModifiers && !!dataPreset.obModifiers.length || false)
    }, dataPreset);

    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${skill.name}`,
            content: html,
            buttons: {
                roll: {
                    label: game.i18n.localize("BW.roll.roll"),
                    callback: async (dialogHtml: JQuery) =>
                        learningRollCallback(dialogHtml, skill, statName, actor, extraInfo, onRollCallback)
                }
            },
            default: "roll"
        }).render(true)
    );
}

async function learningRollCallback(
    dialogHtml: JQuery, skill: Skill, statName: string, actor: BWCharacter, extraInfo?: string, onRollCallback?: () => Promise<unknown>): Promise<unknown> {
    
    const rollData = extractRollData(dialogHtml);
    const stat = getProperty(actor.system, statName) as Ability;

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result) >= rollData.difficultyTotal;

    let splitPoolString: string | undefined;
    let splitPoolRoll: Roll | undefined;
    if (rollData.splitPool) {
        splitPoolRoll = await getSplitPoolRoll(rollData.splitPool, skill.system.open, skill.system.shade);
        splitPoolString = getSplitPoolText(splitPoolRoll);
    }
    extraInfo = `${splitPoolString || ""} ${extraInfo || ""}`;

    const fateReroll = buildRerollData({ actor, roll, accessor: `system.${statName}`, splitPoolRoll });
    
    if (fateReroll) {
        fateReroll.type = "learning";
        fateReroll.learningTarget = statName;
    }
    const callons: RerollData[] = actor.getCallons(skill.name).map(s => {
        return {
            label: s,
            type: "learning",
            learningTarget: statName,
            ...buildRerollData({ actor, roll, accessor: `system.${statName}`, splitPoolRoll }) as RerollData
        };
    });

    if (skill.system.tools) {
        const toolkitId = extractSelectString(dialogHtml, "toolkitId") || '';
        const tools = actor.items.get(toolkitId) as Possession;
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

    actor.updateArthaForStat(statName, rollData.persona, rollData.deeds);

    const afterLearningTest = async (fr?: RerollData) => {
        if (rollData.addHelp) {
            game.burningwheel.modifiers.grantTests(rollData.difficultyTestTotal, isSuccessful);
        }

        const data: RollChatMessageData = {
            name: `${game.i18n.localize('BW.roll.beginnersLuck')} ${skill.name}`,
            successes: roll.result,
            splitSuccesses: splitPoolRoll ? splitPoolRoll.result : undefined,
            difficulty: rollData.baseDifficulty,
            obstacleTotal: rollData.difficultyTotal,
            nameClass: getRollNameClass(stat.open, stat.shade),
            success: isSuccessful,
            rolls: roll.dice[0].results,
            difficultyGroup: rollData.difficultyGroup,
            penaltySources: rollData.obSources,
            dieSources: rollData.dieSources,
            fateReroll: fr,
            callons,
            extraInfo
        };
        const messageHtml = await renderTemplate(templates.pcRollMessage, data);
        if (onRollCallback) { onRollCallback(); }
        return ChatMessage.create({
            content: messageHtml,
            speaker: ChatMessage.getSpeaker({actor})
        });
    };

    return advanceLearning(skill, statName, actor, rollData.difficultyGroup, isSuccessful, fateReroll, afterLearningTest);
}

async function advanceLearning(
        skill: Skill,
        statName: string,
        owner: BWCharacter,
        difficultyGroup: helpers.TestString,
        isSuccessful: boolean,
        fr: RerollData | undefined,
        cb: (fr?: RerollData) => Promise<ChatMessage | null>) {
    switch (difficultyGroup) {
        default:
            return advanceBaseStat(skill, owner, statName, difficultyGroup, isSuccessful, fr, cb);
        case "Routine":
            return advanceLearningProgress(skill, fr, cb);
        case "Routine/Difficult":
            // we can either apply this to the base stat or to the learning
            const dialog = new Dialog({
                title: game.i18n.localize('BW.roll.learningAssignment'),
                content: `<p>${game.i18n.localize('BW.roll.learningAssignmentBody1')}</p><p>${game.i18n.localize('BW.roll.learningAssignmentBody2')}</p>`,
                buttons: {
                    skill: {
                        label: game.i18n.localize('BW.roll.learningApplyRoutine'),
                        callback: async () => advanceLearningProgress(skill, fr, cb)
                    },
                    stat: {
                        label: game.i18n.localize('BW.roll.learningApplyDifficult'),
                        callback: async () => advanceBaseStat(skill, owner, statName, "Difficult", isSuccessful, fr, cb)
                    }
                },
                default: "skill"
            });
            return dialog.render(true);
    }
}

async function advanceBaseStat(
        _skill: Skill,
        owner: BWCharacter,
        statName: string,
        difficultyGroup: helpers.TestString,
        isSuccessful: boolean,
        fr: RerollData | undefined,
        cb: (fr?: RerollData) => Promise<ChatMessage | null>) {

    const accessor = statName.toLowerCase();
    const rootStat = getProperty(owner, `system.${accessor}`);
    if (statName === "custom1" || statName === "custom2") {
        statName = owner.system[statName].name.titleCase();
        await owner.addAttributeTest(rootStat, statName, accessor, difficultyGroup, isSuccessful);
    } else {
        await owner.addStatTest(rootStat, statName, accessor, difficultyGroup, isSuccessful);
    }
    
    return cb(fr);
}

async function advanceLearningProgress(
        skill: Skill,
        fr: RerollData | undefined,
        cb: (fr?: RerollData) => Promise<ChatMessage | null>) {
    skill.addTest("Routine");
    return cb(fr);
}

export interface LearningDialogData extends RollDialogData {
    skill: TracksTests;
    needsToolkit: boolean;
    toolkits: Possession[];
    tax?: number;
    learning: boolean;
}

export interface LearningRollEventOptions extends EventHandlerOptions {
    dataPreset?: Partial<LearningDialogData>
}

interface LearningRollOptions extends RollOptions {
    actor: BWCharacter & BWActor;
    skill: Skill;
}

interface LearningRollDialogSettings extends RollOptions {
    actor: BWCharacter & BWActor;
    skill: Skill;
    statName: string;
}