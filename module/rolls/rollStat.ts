import { Ability, TracksTests, BWCharacter, BWActor } from "../bwactor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import * as helpers from "../helpers.js";
import {
    buildDiceSourceObject,
    buildRerollData,
    extractBaseData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    RollOptions
} from "./rolls.js";

export async function handleStatRoll({ target, sheet }: RollOptions): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor || "") as Ability;
    const actor = sheet.actor as BWActor & BWCharacter;
    const statName = target.dataset.rollableName || "Unknown Stat";
    const rollModifiers = sheet.actor.getRollModifiers(statName);
    let tax = 0;
    if (target.dataset.rollableName?.toLowerCase() === "will") {
        tax = actor.data.data.willTax;
    } else if (target.dataset.rollableName?.toLowerCase() === "forte") {
        tax = actor.data.data.forteTax;
    }
    const data: StatDialogData = {
        name: `${statName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        tax,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    };

    const html = await renderTemplate(templates.statDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${statName} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        statRollCallback(dialogHtml, stat, sheet, tax, statName, target.dataset.accessor || "")
                }
            }
        }).render(true)
    );
}

async function statRollCallback(
        dialogHtml: JQuery,
        stat: Ability,
        sheet: BWActorSheet,
        tax: number,
        name: string,
        accessor: string) {
    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = parseInt(stat.exp, 10);

    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, tax);
    const dg = helpers.difficultyGroup(exp + baseData.bDice - (tax || 0) - baseData.woundDice + baseData.miscDice.sum,
        baseData.obstacleTotal);

    const roll = await rollDice(
        exp + baseData.bDice + baseData.aDice - baseData.woundDice - (tax || 0) + baseData.miscDice.sum,
        stat.open,
        stat.shade);
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result, 10) >= baseData.obstacleTotal;

    const fateReroll = buildRerollData(sheet.actor, roll, accessor);
    const callons: RerollData[] = sheet.actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData(sheet.actor, roll, accessor) as RerollData };
    });

    const data: RollChatMessageData = {
        name: `${name}`,
        successes: roll.result,
        difficulty: baseData.diff + baseData.obPenalty,
        obstacleTotal: baseData.obstacleTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccessful,
        rolls: roll.dice[0].rolls,
        difficultyGroup: dg,
        penaltySources: baseData.penaltySources,
        dieSources: { ...dieSources, ...baseData.miscDice.entries },
        fateReroll,
        callons
    };
    if (sheet.actor.data.type === "character") {
        (sheet.actor as BWActor & BWCharacter).addStatTest(stat, name, accessor, dg, isSuccessful);
    }

    const messageHtml = await renderTemplate(templates.skillMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

interface StatDialogData extends RollDialogData {
    tax?: number;
    stat: TracksTests;
}