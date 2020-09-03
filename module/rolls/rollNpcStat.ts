import { TracksTests } from "../bwactor.js";

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
import { NpcSheet } from "module/npc-sheet.js";

export async function handleNpcStatRoll({ target, sheet }: NpcRollOptions): Promise<unknown> {
    const actor = sheet.actor;

    const dice = getProperty(actor.data, target.dataset.stat || "") as number;
    const shade = getProperty(actor.data, target.dataset.shade || "") as helpers.ShadeString;
    const open = target.dataset.action === "rollStatOpen";
    
    const statName = target.dataset.rollableName || "Unknown Stat";
    const rollModifiers = sheet.actor.getRollModifiers(statName);

    const data: StatDialogData = {
        name: `${statName.titleCase()} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat: { exp: dice.toString()} as TracksTests,
        tax: 0,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    };

    const html = await renderTemplate(templates.statDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${statName.titleCase()} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        statRollCallback(dialogHtml, sheet, statName, shade, open)
                }
            }
        }).render(true)
    );
}

async function statRollCallback(
        dialogHtml: JQuery,
        sheet: NpcSheet,
        name: string,
        shade: helpers.ShadeString,
        open: boolean) {
    const baseData = extractBaseData(dialogHtml, sheet);
    const accessor = `data.${name}`;

    const dieSources = buildDiceSourceObject(baseData.exponent, baseData.aDice, baseData.bDice, 0, baseData.woundDice, 0);
    const dg = helpers.difficultyGroup(baseData.exponent + baseData.bDice - baseData.woundDice + baseData.miscDice.sum,
        baseData.obstacleTotal);

    const roll = await rollDice(
        baseData.exponent + baseData.bDice + baseData.aDice - baseData.woundDice + baseData.miscDice.sum,
        open,
        shade);
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result, 10) >= baseData.obstacleTotal;

    const fateReroll = buildRerollData(sheet.actor, roll, accessor);
    const callons: RerollData[] = sheet.actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData(sheet.actor, roll, accessor) as RerollData };
    });

    const data: RollChatMessageData = {
        name: `${name.titleCase()}`,
        successes: roll.result,
        difficulty: baseData.diff + baseData.obPenalty,
        obstacleTotal: baseData.obstacleTotal,
        nameClass: getRollNameClass(open, shade),
        success: isSuccessful,
        rolls: roll.dice[0].rolls,
        difficultyGroup: dg,
        penaltySources: baseData.penaltySources,
        dieSources: { ...dieSources, ...baseData.miscDice.entries },
        fateReroll,
        callons
    };

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

interface NpcRollOptions extends RollOptions {
    sheet: NpcSheet;
}