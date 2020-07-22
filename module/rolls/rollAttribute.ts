import { Ability, BWActor } from "module/actor.js";
import { BWActorSheet } from "module/bwactor-sheet.js";
import * as helpers from "../helpers.js";
import {
    AttributeDialogData,
    buildDiceSourceObject,
    buildFateRerollData,
    extractBaseData,
    getRollNameClass,
    RollChatMessageData,
    rollDice,
    templates
} from "../rolls.js";

export async function handleAttrRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor || "") as Ability;
    const actor = sheet.actor as BWActor;
    const attrName = target.dataset.rollableName || "Unknown Attribute";
    let tax = 0;
    if (attrName === "Resources") {
        tax = parseInt(actor.data.data.resourcesTax, 10);
    }
    const data: AttributeDialogData = {
        name: `${attrName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: attrName === "Steel" ? actor.data.data.ptgs.woundDice : undefined,
        obPenalty: actor.data.data.ptgs.obPenalty,
        tax,
        stat,
    };

    const html = await renderTemplate(templates.attrDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${target.dataset.rollableName} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        attrRollCallback(dialogHtml, stat, sheet, tax, attrName, target.dataset.accessor || "")
                }
            }
        }).render(true)
    );
}

async function attrRollCallback(
        dialogHtml: JQuery<HTMLElement>,
        stat: Ability,
        sheet: BWActorSheet,
        tax: number,
        name: string,
        accessor: string) {
    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = parseInt(stat.exp, 10);
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, tax);
    const dg = helpers.difficultyGroup(exp + baseData.bDice - tax - baseData.woundDice, baseData.diff);

    const numDice = exp + baseData.bDice + baseData.aDice - baseData.woundDice - tax;
    const roll = rollDice(numDice, stat.open, stat.shade);
    if (!roll) { return; }

    const isSuccessful = parseInt(roll.result, 10) >= (baseData.diff + baseData.obPenalty);

    const fateReroll = buildFateRerollData(sheet.actor, roll, accessor);
    const data: RollChatMessageData = {
        name: `${name}`,
        successes: roll.result,
        difficulty: baseData.diff,
        obstacleTotal: baseData.obstacleTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccessful,
        rolls: roll.dice[0].rolls,
        difficultyGroup: dg,
        penaltySources: baseData.penaltySources,
        dieSources,
        fateReroll
    };

    sheet.actor.addAttributeTest(stat, name, accessor, dg, isSuccessful);
    const messageHtml = await renderTemplate(templates.attrMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}