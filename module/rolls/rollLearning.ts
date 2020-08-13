import { BWActor } from "../actor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import { Skill, SkillDataRoot, PossessionRootData } from "../items/item.js";
import * as helpers from "../helpers.js";
import {
    buildDiceSourceObject,
    buildRerollData,
    extractBaseData,
    getRollNameClass,
    getRootStatInfo,
    RerollData,
    RollChatMessageData,
    rollDice,
    templates,
    extractCheckboxValue,
    extractSelectString,
    maybeExpendTools,
    RollDialogData
} from "./rolls.js";

export async function handleLearningRoll(target: HTMLButtonElement, sheet: BWActorSheet, extraInfo?: string): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const skill = (sheet.actor.getOwnedItem(skillId) as Skill);
    const rollModifiers = sheet.actor.getRollModifiers(skill.name);
    const actor = sheet.actor as BWActor;
    const data: LearningDialogData = {
        name: `Beginner's Luck ${skill.name} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        toolkits: actor.data.toolkits,
        needsToolkit: skill.data.data.tools,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skill: { exp: 10 - (skill.data.data.aptitude || 1) } as any,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    };

    const html = await renderTemplate(templates.learnDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${skill.name}`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        learningRollCallback(dialogHtml, skill, sheet, extraInfo)
                }
            }
        }).render(true)
    );
}

async function learningRollCallback(
    dialogHtml: JQuery, skill: Skill, sheet: BWActorSheet, extraInfo?: string): Promise<unknown> {

    const baseData = extractBaseData(dialogHtml, sheet);
    let beginnerPenalty = baseData.diff;
    const exp = 10 - (skill.data.data.aptitude || 1);
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, 0);
    if (skill.data.data.tools) {
        if (extractCheckboxValue(dialogHtml, "toolPenalty")) {
            baseData.penaltySources["No Tools"] = `+${baseData.diff}`;
            baseData.obstacleTotal += baseData.diff;
            beginnerPenalty *= 2;
        }
        const toolkitId = extractSelectString(dialogHtml, "toolkitId") || '';
        const tools = sheet.actor.getOwnedItem(toolkitId);
        if (tools) {
            maybeExpendTools(tools);
        }
    }
    const dg = helpers.difficultyGroup(exp + baseData.bDice - baseData.woundDice + baseData.miscDice.sum,
        baseData.obstacleTotal);
    const rollSettings = getRootStatInfo(skill, sheet.actor);
    baseData.penaltySources["Beginner's Luck"] = `+${beginnerPenalty}`;
    baseData.obstacleTotal += beginnerPenalty;

    const roll = await rollDice(
        exp + baseData.bDice + baseData.aDice - baseData.woundDice + baseData.miscDice.sum,
        rollSettings.open,
        rollSettings.shade
    );
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result, 10) >= baseData.obstacleTotal;
    const fateReroll = buildRerollData(sheet.actor, roll, undefined, skill._id);
    if (fateReroll) { fateReroll.type = "learning"; }
    const callons: RerollData[] = sheet.actor.getCallons(skill.name).map(s => {
        return {
            label: s,
            type: "learning",
            ...buildRerollData(sheet.actor, roll, undefined, skill._id) as RerollData
        };
    });

    const sendChatMessage = async (fr?: RerollData) => {
        const data: RollChatMessageData = {
            name: `Beginner's Luck ${skill.data.name}`,
            successes: roll.result,
            difficulty: baseData.diff,
            obstacleTotal: baseData.obstacleTotal,
            nameClass: getRollNameClass(rollSettings.open, rollSettings.shade),
            success: isSuccessful,
            rolls: roll.dice[0].rolls,
            difficultyGroup: dg,
            penaltySources: baseData.penaltySources,
            dieSources: { ...dieSources, ...baseData.miscDice.entries },
            fateReroll: fr,
            callons,
            extraInfo
        };
        const messageHtml = await renderTemplate(templates.learnMessage, data);
        return ChatMessage.create({
            content: messageHtml,
            speaker: ChatMessage.getSpeaker({actor: sheet.actor})
        });
    };

    return advanceLearning(skill, sheet.actor, dg, isSuccessful, fateReroll, sendChatMessage);
}

async function advanceLearning(
        skill: Skill,
        owner: BWActor,
        difficultyGroup: helpers.TestString,
        isSuccessful: boolean,
        fr: RerollData | undefined,
        cb: (fr?: RerollData) => Promise<Entity>) {
    switch (difficultyGroup) {
        default:
            return advanceBaseStat(skill, owner, difficultyGroup, isSuccessful, fr, cb);
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
                        callback: async () => advanceBaseStat(skill, owner, "Difficult", isSuccessful, fr, cb)
                    }
                }
            });
            return dialog.render(true);
    }
}

async function advanceBaseStat(
        skill: Skill,
        owner: BWActor,
        difficultyGroup: helpers.TestString,
        isSuccessful: boolean,
        fr: RerollData | undefined,
        cb: (fr?: RerollData) => Promise<Entity>) {
    if (!skill.data.data.root2) {
        // we can immediately apply the test to the one root stat.
        const rootName = skill.data.data.root1;
        const accessor = `data.${rootName.toLowerCase()}`;
        const rootStat = getProperty(owner, `data.${accessor}`);
        await owner.addStatTest(rootStat, rootName, accessor, difficultyGroup, isSuccessful);
        if (fr) { fr.learningTarget = skill.data.data.root1; }
        return cb(fr);
    }

    // otherwise we have 2 roots and we let the player pick one.
    const choice = new Dialog({
        title: "Pick root stat to advance",
        content: `<p>This test can count towards advancing ${skill.data.data.root1} or ${skill.data.data.root2}</p><p>Which one to advance?</p>`,
        buttons: {
            stat1: {
                label: skill.data.data.root1,
                callback: async () => {
                    const rootName = skill.data.data.root1.titleCase();
                    const accessor = `data.${rootName.toLowerCase()}`;
                    const rootStat = getProperty(owner, `data.${accessor}`);
                    await owner.addStatTest(
                        rootStat, rootName, `${accessor}`, difficultyGroup, isSuccessful);
                    if (fr) { fr.learningTarget = skill.data.data.root1; }
                    return cb(fr);
                }
            },
            stat2: {
                label: skill.data.data.root2,
                callback: async () => {
                    const rootName = skill.data.data.root2.titleCase();
                    const accessor = `data.${rootName.toLowerCase()}`;
                    const rootStat = getProperty(owner, `data.${accessor}`);
                    await owner.addStatTest(
                        rootStat, rootName, `${accessor}`, difficultyGroup, isSuccessful);
                    if (fr) { fr.learningTarget = skill.data.data.root2; }
                    return cb(fr);
                }
            }
        }
    });
    return choice.render(true);
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
    skill: SkillDataRoot;
    needsToolkit: boolean;
    toolkits: PossessionRootData[];
}