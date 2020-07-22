import { BWActor } from "module/actor.js";
import { BWActorSheet } from "module/bwactor-sheet.js";
import { Skill } from "module/items/item.js";
import * as helpers from "../helpers.js";
import {
    buildDiceSourceObject,
    buildFateRerollData,
    extractBaseData,
    FateRerollData,
    getRollNameClass,
    getRootStatInfo,
    LearningDialogData,
    RollChatMessageData,
    rollDice,
    templates
} from "../rolls.js";

export async function handleLearningRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const skill = (sheet.actor.getOwnedItem(skillId) as Skill);
    const actor = sheet.actor as BWActor;
    const data: LearningDialogData = {
        name: `Beginner's Luck ${target.dataset.rollableName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: { exp: 10 - (skill.data.data.aptitude || 1) } as any
    };

    const html = await renderTemplate(templates.learnDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${target.dataset.rollableName}`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        learningRollCallback(dialogHtml, skill, sheet)
                }
            }
        }).render(true)
    );
}

async function learningRollCallback(
    dialogHtml: JQuery<HTMLElement>, skill: Skill, sheet: BWActorSheet): Promise<unknown> {

    const baseData = extractBaseData(dialogHtml, sheet);
    baseData.obstacleTotal += baseData.diff;
    baseData.penaltySources["Beginner's Luck"] = `+${baseData.diff}`;
    const exp = 10 - (skill.data.data.aptitude || 1);
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, 0);
    const dg = helpers.difficultyGroup(exp + baseData.bDice- baseData.woundDice, baseData.diff);
    const rollSettings = getRootStatInfo(skill, sheet.actor);

    const roll = rollDice(
        exp + baseData.bDice + baseData.aDice - baseData.woundDice,
        rollSettings.open,
        rollSettings.shade
    );
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result, 10) >= baseData.obstacleTotal;
    const fateReroll = buildFateRerollData(sheet.actor, roll, undefined, skill._id);
    if (fateReroll) { fateReroll!.type = "learning"; }

    const sendChatMessage = async (fr?: FateRerollData) => {
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
            dieSources,
            fateReroll: fr
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
        fr: FateRerollData | undefined,
        cb: (fr?: FateRerollData) => Promise<Entity>) {
    switch (difficultyGroup) {
        default:
            return advanceBaseStat(skill, owner, difficultyGroup, isSuccessful, fr, cb);
        case "Routine":
            return advanceLearningProgress(skill, fr, cb);
        case "Routine/Difficult":
            // we can either apply this to the base stat or to the learning
            const dialog = new Dialog({
                title: "Pick where to assing the test",
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
        fr: FateRerollData | undefined,
        cb: (fr?: FateRerollData) => Promise<Entity>) {
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
        fr: FateRerollData | undefined,
        cb: (fr?: FateRerollData) => Promise<Entity>) {
    const progress = parseInt(skill.data.data.learningProgress, 10);
    const requiredTests = skill.data.data.aptitude || 10;

    skill.update({"data.learningProgress": progress + 1 }, {});
    if (progress + 1 >= requiredTests) {
        Dialog.confirm({
            title: `Finish Training ${skill.name}?`,
            content: `<p>${skill.name} is ready to become a full skill. Go ahead?</p>`,
            yes: () => {
                const updateData = {};
                updateData["data.learning"] = false;
                updateData["data.exp"] = Math.floor((10 - requiredTests) / 2);
                skill.update(updateData, {});
            },
            // tslint:disable-next-line: no-empty
            no: () => {},
            defaultYes: true
        });
    }
    if (fr) {
        fr.learningTarget = "skill";
    }
    return cb(fr);
}