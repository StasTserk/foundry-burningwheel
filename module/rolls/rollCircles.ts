import { Ability, BWActor } from "module/actor.js";
import { BWActorSheet } from "module/bwactor-sheet.js";
import { Relationship } from "module/items/item.js";
import * as helpers from "../helpers.js";
import {
    AttributeDialogData,
    buildDiceSourceObject,
    buildRerollData,
    extractBaseData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    rollDice,
    templates
} from "./rolls.js";

export async function handleCirclesRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, "data.circles") as Ability;
    let circlesContact: Relationship | undefined;
    if (target.dataset.relationshipId) {
        circlesContact = sheet.actor.getOwnedItem(target.dataset.relationshipId) as Relationship;
    }
    const actor = sheet.actor as BWActor;
    const rollModifiers = sheet.actor.getRollModifiers("circles");
    const data: CirclesDialogData = {
        name: target.dataset.rollableName || "Circles Test",
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        circlesBonus: actor.data.circlesBonus,
        circlesMalus: actor.data.circlesMalus,
        circlesContact,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    };

    const html = await renderTemplate(templates.circlesDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `Circles Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        circlesRollCallback(dialogHtml, stat, sheet, circlesContact)
                }
            }
        }).render(true)
    );
}

async function circlesRollCallback(
        dialogHtml: JQuery,
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

    const roll = await rollDice(exp + baseData.bDice + baseData.aDice + bonusData.sum + baseData.miscDice.sum,
        stat.open,
        stat.shade);
    if (!roll) { return; }

    const fateReroll = buildRerollData(sheet.actor, roll, "data.circles");
    const callons: RerollData[] = sheet.actor.getCallons("circles").map(s => {
        return { label: s, ...buildRerollData(sheet.actor, roll, "data.circles") as RerollData };
    });

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
        fateReroll,
        callons
    };
    const messageHtml = await renderTemplate(templates.circlesMessage, data);

    // increment relationship tracking values...
    if (contact && contact.data.data.building) {
        const progress = (parseInt(contact.data.data.buildingProgress, 10) || 0) + 1;
        contact.update({"data.buildingProgress": progress }, null);
        if (progress >= (contact.data.data.aptitude || 10)) {
            Dialog.confirm({
                title: "Relationship Building Complete",
                content: `<p>Relationship with ${contact.name} has been built enough to advance. Do so?</p>`,
                yes: () => { contact.update({"data.building": false}, null); },
                no: () => { return; }
            });
        }
    }

    sheet.actor.addAttributeTest(stat, "Circles", "data.circles", dg, true);

    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

function extractCirclesBonuses(html: JQuery, name: string):
        { bonuses: {[name: string]: string }, sum: number} {
    const bonuses:{[name: string]: string } = {};
    let sum = 0;
    html.find(`input[name=\"${name}\"]:checked`).each((_i, v) => {
        sum += parseInt(v.getAttribute("value") || "", 10);
        bonuses[v.dataset.name || ""] = "+" + v.getAttribute("value");
    });
    return { bonuses, sum };
}

function extractCirclesPenalty(html: JQuery, name: string):
        { bonuses: {[name: string]: string }, sum: number} {
    return extractCirclesBonuses(html, name);
}

export interface CirclesDialogData extends AttributeDialogData {
    circlesBonus?: {name: string, amount: number}[];
    circlesMalus?: {name: string, amount: number}[];
    circlesContact?: Item;
}