import { BWActor, TracksTests, Ability, BWCharacter } from "../bwactor.js";
import { Skill, PossessionRootData } from "../items/item.js";
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
    EventHandlerOptions, RollOptions, mergeDialogData, getSplitPoolText, getSplitPoolRoll
} from "./rolls.js";

export async function handleLearningRollEvent(rollOptions: LearningRollEventOptions): Promise<unknown> {
    const actor = rollOptions.sheet.actor as BWActor & BWCharacter;
    const skillId = rollOptions.target.dataset.skillId || "";
    const skill = (rollOptions.sheet.actor.getOwnedItem(skillId) as Skill);
    return handleLearningRoll({ actor, skill, ...rollOptions});
}

export function handleLearningRoll({ actor, skill, extraInfo, dataPreset, onRollCallback}: LearningRollOptions): Promise<unknown> | Application {
    if (skill.data.data.root2) {
        return new Dialog({
            title: "Pick Root Stat",
            content: "<p>The skill being learned is derived from two roots. Pick one to use for the roll.</p>",
            buttons: {
                root1: {
                    label: skill.data.data.root1.titleCase(),
                    callback: () => {
                        return buildLearningDialog({ actor, skill, statName: skill.data.data.root1, extraInfo, dataPreset, onRollCallback });
                    }
                },
                root2: {
                    label: skill.data.data.root2.titleCase(),
                    callback: () => {
                        return buildLearningDialog({ actor, skill, statName: skill.data.data.root2, extraInfo, dataPreset, onRollCallback });
                    }
                }
            }
        }).render(true);
    }
    return buildLearningDialog({ actor, skill, statName: skill.data.data.root1, extraInfo, dataPreset, onRollCallback });

}

async function buildLearningDialog({ skill, statName, actor, extraInfo, dataPreset, onRollCallback }: LearningRollDialogSettings): Promise<unknown> {
    const rollModifiers = actor.getRollModifiers(skill.name);
    const stat = getProperty(actor.data.data, statName);

    let tax = 0;
    if (statName.toLowerCase() === "will") {
        tax = actor.data.data.willTax;
    } else if (statName.toLowerCase() === "forte") {
        tax = actor.data.data.forteTax;
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
        name: `Beginner's Luck ${skill.name} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        tax,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        toolkits: actor.data.toolkits,
        needsToolkit: skill.data.data.tools,
        learning: true,
        skill: stat,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty
            || !!actor.data.data.ptgs.obPenalty
            || (dataPreset && dataPreset.obModifiers && !!dataPreset.obModifiers.length || false)
    }, dataPreset);

    const html = await renderTemplate(templates.learnDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${skill.name}`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        learningRollCallback(dialogHtml, skill, statName, actor, extraInfo, onRollCallback)
                }
            }
        }).render(true)
    );
}

async function learningRollCallback(
    dialogHtml: JQuery, skill: Skill, statName: string, actor: BWActor, extraInfo?: string, onRollCallback?: () => Promise<unknown>): Promise<unknown> {
    
    const rollData = extractRollData(dialogHtml);
    const stat = getProperty(actor.data.data, statName) as Ability;

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result) >= rollData.difficultyTotal;

    let splitPoolString: string | undefined;
    let splitPoolRoll: Roll | undefined;
    if (rollData.splitPool) {
        splitPoolRoll = await getSplitPoolRoll(rollData.splitPool, skill.data.data.open, skill.data.data.shade);
        splitPoolString = getSplitPoolText(splitPoolRoll);
    }
    extraInfo = `${splitPoolString || ""} ${extraInfo || ""}`;

    const fateReroll = buildRerollData({ actor, roll, itemId: skill._id, splitPoolRoll });
    if (fateReroll) { fateReroll.type = "learning"; }
    const callons: RerollData[] = actor.getCallons(skill.name).map(s => {
        return {
            label: s,
            type: "learning",
            ...buildRerollData({ actor, roll, itemId: skill._id, splitPoolRoll }) as RerollData
        };
    });

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

    const sendChatMessage = async (fr?: RerollData) => {
        const data: RollChatMessageData = {
            name: `Beginner's Luck ${skill.data.name}`,
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
        const messageHtml = await renderTemplate(templates.learnMessage, data);
        if (onRollCallback) { onRollCallback(); }
        return ChatMessage.create({
            content: messageHtml,
            speaker: ChatMessage.getSpeaker({actor})
        });
    };
    if (!rollData.skipAdvancement) {
        return advanceLearning(skill, statName, actor, rollData.difficultyGroup, isSuccessful, fateReroll, sendChatMessage);
    } else {
        return sendChatMessage(fateReroll);
    }
}

async function advanceLearning(
        skill: Skill,
        statName: string,
        owner: BWActor,
        difficultyGroup: helpers.TestString,
        isSuccessful: boolean,
        fr: RerollData | undefined,
        cb: (fr?: RerollData) => Promise<Entity>) {
    switch (difficultyGroup) {
        default:
            return advanceBaseStat(skill, owner, statName, difficultyGroup, isSuccessful, fr, cb);
        case "Routine":
            return advanceLearningProgress(skill, fr, cb);
        case "Routine/Difficult":
            // we can either apply this to the base stat or to the learning
            const dialog = new Dialog({
                title: "Pick where to assign the test",
                content: "<p>This test can count as routine of difficult for the purposes of advancement</p><p>Pick which option you'd prefer.</p>",
                buttons: {
                    skill: {
                        label: "Apply as Routine",
                        callback: async () => advanceLearningProgress(skill, fr, cb)
                    },
                    stat: {
                        label: "Apply as Difficult",
                        callback: async () => advanceBaseStat(skill, owner, statName, "Difficult", isSuccessful, fr, cb)
                    }
                }
            });
            return dialog.render(true);
    }
}

async function advanceBaseStat(
        skill: Skill,
        owner: BWActor,
        statName: string,
        difficultyGroup: helpers.TestString,
        isSuccessful: boolean,
        fr: RerollData | undefined,
        cb: (fr?: RerollData) => Promise<Entity>) {

    const accessor = `data.${statName.toLowerCase()}`;
    const rootStat = getProperty(owner, `data.${accessor}`);
    await (owner as BWActor & BWCharacter).addStatTest(rootStat, statName, accessor, difficultyGroup, isSuccessful);
    if (fr) { fr.learningTarget = skill.data.data.root1; }
    return cb(fr);
}

async function advanceLearningProgress(
        skill: Skill,
        fr: RerollData | undefined,
        cb: (fr?: RerollData) => Promise<Entity>) {
    const progress = parseInt(skill.data.data.learningProgress, 10);
    let requiredTests = skill.data.data.aptitude || 10;
    let shade = getProperty(skill.actor || {}, `data.data.${skill.data.data.root1.toLowerCase()}`).shade;

    skill.update({"data.learningProgress": progress + 1 }, {});
    if (progress + 1 >= requiredTests) {
        if (skill.data.data.root2 && skill.actor) {
            const root2Shade = getProperty(skill.actor, `data.data.${skill.data.data.root2.toLowerCase()}`).shade;
            if (shade != root2Shade) {
                requiredTests -= 2;
            }
            shade = helpers.getWorstShadeString(shade, root2Shade);
        }

        Dialog.confirm({
            title: `Finish Training ${skill.name}?`,
            content: `<p>${skill.name} is ready to become a full skill. Go ahead?</p>`,
            yes: () => {
                const updateData = {};
                updateData["data.learning"] = false;
                updateData["data.learningProgress"] = 0;
                updateData["data.routine"] = 0;
                updateData["data.difficult"] = 0;
                updateData["data.challenging"] = 0;
                updateData["data.shade"] = shade;
                updateData["data.exp"] = Math.floor((10 - requiredTests) / 2);
                skill.update(updateData, {});
            },
            no: () => { return; },
            defaultYes: true
        });
    }
    if (fr) {
        fr.learningTarget = "skill";
    }
    return cb(fr);
}

export interface LearningDialogData extends RollDialogData {
    skill: TracksTests;
    needsToolkit: boolean;
    toolkits: PossessionRootData[];
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