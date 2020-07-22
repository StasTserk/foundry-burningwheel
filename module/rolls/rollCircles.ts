import { Ability, BWActor } from "module/actor.js";
import { BWActorSheet } from "module/bwactor-sheet.js";
import { Relationship } from "module/items/item.js";
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

export async function handleCirclesRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, "data.circles") as Ability;
    let circlesContact: Relationship | undefined;
    if (target.dataset.relationshipId) {
        circlesContact = sheet.actor.getOwnedItem(target.dataset.relationshipId) as Relationship;
    }
    const actor = sheet.actor as BWActor;
    const data: CirclesDialogData = {
        name: target.dataset.rollableName || "Circles Test",
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        circlesBonus: actor.data.circlesBonus,
        circlesMalus: actor.data.circlesMalus,
        circlesContact
    };

    const html = await renderTemplate(templates.circlesDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `Circles Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        circlesRollCallback(dialogHtml, stat, sheet, circlesContact)
                }
            }
        }).render(true)
    );
}

async function circlesRollCallback(
        dialogHtml: JQuery<HTMLElement>,
        stat: Ability,
        sheet: BWActorSheet,
        contact?: Relationship) {
    const baseData = extractBaseData(dialogHtml, sheet);
    const bonusData = extractCirclesBonuses(dialogHtml, "circlesBonus");
    const penaltyData = extractCirclesPenalty(dialogHtml, "circlesMalus");
    const exp = parseInt(stat.exp, 10);
    const dieSources = {
        ...buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, 0, 0),
        ...bonusData.bonuses
    };
    const dg = helpers.difficultyGroup(
        exp + baseData.bDice,
        baseData.diff + baseData.obPenalty + penaltyData.sum);

    if (contact) {
        dieSources["Named Contact"] = "+1";
        baseData.bDice ++;
    }

    const roll = rollDice(exp + baseData.bDice + baseData.aDice + bonusData.sum, stat.open, stat.shade);
    if (!roll) { return; }

    const fateReroll = buildFateRerollData(sheet.actor, roll, "data.circles");

    baseData.obstacleTotal += penaltyData.sum;
    const data: RollChatMessageData = {
        name: `Circles`,
        successes: roll.result,
        difficulty: baseData.diff,
        obstacleTotal: baseData.obstacleTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: parseInt(roll.result, 10) >= baseData.obstacleTotal,
        rolls: roll.dice[0].rolls,
        difficultyGroup: dg,
        dieSources,
        penaltySources: { ...baseData.penaltySources, ...penaltyData.bonuses },
        fateReroll
    };
    const messageHtml = await renderTemplate(templates.circlesMessage, data);

    // incremet relationship tracking values...
    if (contact && contact.data.data.building) {
        contact.update({"data.buildingProgress": parseInt(contact.data.data.buildingProgress, 10) + 1 }, null);
    }

    sheet.actor.addAttributeTest(stat, "Circles", "data.circles", dg, true);

    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

function extractCirclesBonuses(html: JQuery<HTMLElement>, name: string):
        { bonuses: {[name: string]: string }, sum: number} {
    const bonuses:{[name: string]: string } = {};
    let sum = 0;
    html.find(`input[name=\"${name}\"]:checked`).each((_i, v) => {
        sum += parseInt(v.getAttribute("value") || "", 10);
        bonuses[v.dataset.name || ""] = "+" + v.getAttribute("value");
    });
    return { bonuses, sum };
}

function extractCirclesPenalty(html: JQuery<HTMLElement>, name: string):
        { bonuses: {[name: string]: string }, sum: number} {
    return extractCirclesBonuses(html, name);
}

export interface CirclesDialogData extends AttributeDialogData {
    circlesBonus?: {name: string, amount: number}[];
    circlesMalus?: {name: string, amount: number}[];
    circlesContact?: Item;
}