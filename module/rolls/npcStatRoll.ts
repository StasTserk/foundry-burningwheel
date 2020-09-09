import { TracksTests } from "../bwactor.js";

import * as helpers from "../helpers.js";
import {
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    RollOptions,
    extractRollData
} from "./rolls.js";
import { NpcSheet } from "module/npc-sheet.js";

export async function handleNpcStatRoll({ target, sheet }: NpcRollOptions): Promise<unknown> {
    const actor = sheet.actor;

    const dice = getProperty(actor.data, target.dataset.stat || "") as number;
    const shade = getProperty(actor.data, target.dataset.shade || "") as helpers.ShadeString;
    const open = target.dataset.action === "rollStatOpen";
    
    const statName = target.dataset.rollableName || "Unknown Stat";
    const rollModifiers = sheet.actor.getRollModifiers(statName);

    const data: NpcStatDialogData = {
        name: `${statName.titleCase()} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: ["circles", "resources", "health"].indexOf(statName) === -1 ? actor.data.data.ptgs.woundDice : 0,
        obPenalty: ["circles", "resources", "health"].indexOf(statName) === -1 ? actor.data.data.ptgs.obPenalty : 0,
        circlesBonus: statName === "circles" ? actor.data.circlesBonus : undefined,
        circlesMalus: statName === "circles" ? actor.data.circlesMalus : undefined,
        stat: { exp: dice.toString() } as TracksTests,
        tax: 0,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    };

    const html = await renderTemplate(templates.npcRollDialog, data);
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
    const rollData = extractRollData(dialogHtml);
    const dg = rollData.difficultyGroup;
    const accessor = `data.${name}`;

    const roll = await rollDice(rollData.diceTotal, open, shade);
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result, 10) >= rollData.difficultyTotal;

    const fateReroll = buildRerollData(sheet.actor, roll, accessor);
    const callons: RerollData[] = sheet.actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData(sheet.actor, roll, accessor) as RerollData };
    });
    
    const data: RollChatMessageData = {
        name: `${name.titleCase()}`,
        successes: roll.result,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(open, shade),
        success: isSuccessful,
        rolls: roll.dice[0].rolls,
        difficultyGroup: dg,
        penaltySources: rollData.obSources,
        dieSources: rollData.dieSources,
        fateReroll,
        callons
    };

    const messageHtml = await renderTemplate(templates.npcMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

interface NpcStatDialogData extends RollDialogData {
    tax?: number;
    stat: TracksTests;
    circlesBonus?: {name: string, amount: number}[];
    circlesMalus?: {name: string, amount: number}[];
}

interface NpcRollOptions extends RollOptions {
    sheet: NpcSheet;
}