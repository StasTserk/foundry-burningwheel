import { BWActor, TracksTests } from "../actor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import * as helpers from "../helpers.js";
import { Skill } from "../items/item.js";
import {
    buildDiceSourceObject,
    buildRerollData,
    extractBaseData,
    extractCheckboxValue,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates
} from "./rolls.js";

export async function handleSkillRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const skill = (sheet.actor.getOwnedItem(skillId) as Skill);
    const rollModifiers = sheet.actor.getRollModifiers(skill.name);
    const actor = sheet.actor as BWActor;
    const templateData: SkillDialogData = {
        name: skill.data.name,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: skill.data.data,
        forkOptions: actor.getForkOptions(skill.data.name),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    };
    const html = await renderTemplate(templates.skillDialog, templateData);
    return new Promise(_resolve =>
        new Dialog({
            title: `${skill.data.name} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        skillRollCallback(dialogHtml, skill, sheet)
                }
            }
        }).render(true)
    );
}

async function skillRollCallback(
    dialogHtml: JQuery, skill: Skill, sheet: BWActorSheet): Promise<unknown> {

    const forks = extractCheckboxValue(dialogHtml, "forkOptions");
    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = parseInt(skill.data.data.exp, 10);
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, forks, baseData.woundDice, 0);
    const dg = helpers.difficultyGroup(exp + baseData.bDice + forks - baseData.woundDice + baseData.miscDice.sum,
        baseData.obstacleTotal);

    const roll = await rollDice(
        exp + baseData.bDice + baseData.aDice + forks - baseData.woundDice + baseData.miscDice.sum,
        skill.data.data.open,
        skill.data.data.shade);
    if (!roll) { return; }
    const fateReroll = buildRerollData(sheet.actor, roll, undefined, skill._id);
    const callons: RerollData[] = sheet.actor.getCallons(skill.name).map(s => {
        return { label: s, ...buildRerollData(sheet.actor, roll, undefined, skill._id) as RerollData };
    });
    const success = parseInt(roll.result, 10) >= baseData.obstacleTotal;

    const data: RollChatMessageData = {
        name: `${skill.name}`,
        successes: roll.result,
        difficulty: baseData.diff,
        obstacleTotal: baseData.obstacleTotal,
        nameClass: getRollNameClass(skill.data.data.open, skill.data.data.shade),
        success,
        rolls: roll.dice[0].rolls,
        difficultyGroup: dg,
        penaltySources: baseData.penaltySources,
        dieSources: { ...dieSources, ...baseData.miscDice.entries },
        fateReroll,
        callons
    };
    if (success || sheet.actor.data.successOnlyRolls.indexOf(skill.name.toLowerCase()) === -1) {
        await helpers.addTestToSkill(skill, dg);
        skill = sheet.actor.getOwnedItem(skill._id) as Skill; // update skill with new data
    }
    if (helpers.canAdvance(skill.data.data)) {
        Dialog.confirm({
            title: `Advance ${skill.name}?`,
            content: `<p>${skill.name} is ready to advance. Go ahead?</p>`,
            yes: () => helpers.advanceSkill(skill),
            // tslint:disable-next-line: no-empty
            no: () => {},
            defaultYes: true
        });
    }

    const messageHtml = await renderTemplate(templates.skillMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

interface SkillDialogData extends RollDialogData {
    skill: TracksTests;
    forkOptions: { name: string, amount: number }[];
}