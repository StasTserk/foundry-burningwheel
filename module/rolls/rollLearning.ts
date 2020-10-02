import { BWActor, TracksTests, Ability, BWCharacter } from "../bwactor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
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
    EventHandlerOptions
} from "./rolls.js";

export async function handleLearningRollEvent(rollOptions: LearningRollOptions): Promise<unknown> {
    const skillId = rollOptions.target.dataset.skillId || "";
    const skill = (rollOptions.sheet.actor.getOwnedItem(skillId) as Skill);
    if (skill.data.data.root2) {
        return new Dialog({
            title: "Pick Root Stat",
            content: "<p>The skill being learned is derived from two roots. Pick one to use for the roll.</p>",
            buttons: {
                root1: {
                    label: skill.data.data.root1.titleCase(),
                    callback: () => {
                        return buildLearningDialog({ skill, statName: skill.data.data.root1, ...rollOptions });
                    }
                },
                root2: {
                    label: skill.data.data.root2.titleCase(),
                    callback: () => {
                        return buildLearningDialog({ skill, statName: skill.data.data.root2,  ...rollOptions });
                    }
                }
            }
        }).render(true);
    }
    return buildLearningDialog({ skill, statName: skill.data.data.root1,...rollOptions });

}

async function buildLearningDialog({ skill, statName, sheet, extraInfo, dataPreset, onRollCallback }: LearningRollDialogSettings) {
    const rollModifiers = sheet.actor.getRollModifiers(skill.name);
    const actor = sheet.actor as BWActor;
    const stat = getProperty(actor.data.data, statName);

    let tax = 0;
    if (statName.toLowerCase() === "will") {
        tax = sheet.actor.data.data.willTax;
    } else if (statName.toLowerCase() === "forte") {
        tax = sheet.actor.data.data.forteTax;
    }

    if (dataPreset) {
        if (dataPreset.optionalDiceModifiers) {
            dataPreset.optionalDiceModifiers.concat(...rollModifiers.filter(r => r.optional && r.dice));
        }
        if (dataPreset.optionalObModifiers) {
            dataPreset.optionalObModifiers.concat(...rollModifiers.filter(r => r.optional && r.obstacle));
        }
    }

    const data: LearningDialogData = Object.assign({
        name: `Beginner's Luck ${skill.name} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        tax,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        toolkits: actor.data.toolkits,
        needsToolkit: skill.data.data.tools,
        learning: 1,
        skill: stat,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
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
                        learningRollCallback(dialogHtml, skill, statName, sheet, extraInfo, onRollCallback)
                }
            }
        }).render(true)
    );
}

async function learningRollCallback(
    dialogHtml: JQuery, skill: Skill, statName: string, sheet: BWActorSheet, extraInfo?: string, onRollCallback?: () => Promise<unknown>): Promise<unknown> {
    
    const rollData = extractRollData(dialogHtml);
    const stat = getProperty(sheet.actor.data.data, statName) as Ability;

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result) >= rollData.difficultyTotal;
    const fateReroll = buildRerollData(sheet.actor, roll, undefined, skill._id);
    if (fateReroll) { fateReroll.type = "learning"; }
    const callons: RerollData[] = sheet.actor.getCallons(skill.name).map(s => {
        return {
            label: s,
            type: "learning",
            ...buildRerollData(sheet.actor, roll, undefined, skill._id) as RerollData
        };
    });

    if (skill.data.data.tools) {
        const toolkitId = extractSelectString(dialogHtml, "toolkitId") || '';
        const tools = sheet.actor.getOwnedItem(toolkitId);
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
            difficulty: rollData.baseDifficulty,
            obstacleTotal: rollData.difficultyTotal,
            nameClass: getRollNameClass(stat.open, stat.shade),
            success: isSuccessful,
            rolls: roll.dice[0].rolls,
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
            speaker: ChatMessage.getSpeaker({actor: sheet.actor})
        });
    };

    return advanceLearning(skill, statName, sheet.actor, rollData.difficultyGroup, isSuccessful, fateReroll, sendChatMessage);
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
}

export interface LearningRollOptions extends EventHandlerOptions {
    dataPreset?: Partial<LearningDialogData>
}

interface LearningRollDialogSettings extends EventHandlerOptions {
    skill: Skill;
    statName: string;
}