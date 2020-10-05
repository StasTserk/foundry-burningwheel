import { BWActor, TracksTests } from "../bwactor.js";

import * as helpers from "../helpers.js";
import {
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    extractRollData,
    EventHandlerOptions, RollOptions, mergeDialogData, getSplitPoolText
} from "./rolls.js";
import { NpcSheet } from "../npc-sheet.js";
import { Npc } from "module/npc.js";

export async function handleNpcStatRollEvent({ target, sheet }: NpcRollEventOptions): Promise<unknown> {
    const actor = sheet.actor;

    const dice = getProperty(actor.data, target.dataset.stat || "") as number;
    const shade = getProperty(actor.data, target.dataset.shade || "") as helpers.ShadeString;
    const open = target.dataset.action === "rollStatOpen";
    
    const statName = target.dataset.rollableName || "Unknown Stat";
    return handleNpcStatRoll({ dice, shade, open, statName, actor });
}

export async function handleNpcStatRoll({ dice, shade, open, statName, extraInfo, dataPreset, actor }: NpcStatRollOptions): Promise<unknown> {
    const rollModifiers = actor.getRollModifiers(statName);

    const data = mergeDialogData<NpcStatDialogData>({
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
    }, dataPreset);

    const html = await renderTemplate(templates.npcRollDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${statName.titleCase()} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        statRollCallback(dialogHtml, actor, statName, shade, open, extraInfo)
                }
            }
        }).render(true)
    );
}

async function statRollCallback(
        dialogHtml: JQuery,
        actor: BWActor & Npc,
        name: string,
        shade: helpers.ShadeString,
        open: boolean,
        extraInfo?: string) {
    const rollData = extractRollData(dialogHtml);
    const dg = rollData.difficultyGroup;
    const accessor = `data.${name}`;

    const roll = await rollDice(rollData.diceTotal, open, shade);
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result, 10) >= rollData.difficultyTotal;

    const fateReroll = buildRerollData(actor, roll, accessor);
    const callons: RerollData[] = actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData(actor, roll, accessor) as RerollData };
    });

    let splitPoolString: string | undefined;
    if (rollData.splitPool) {
        splitPoolString = await getSplitPoolText(rollData.splitPool, open, shade);
    }
    extraInfo = splitPoolString ? splitPoolString + extraInfo : extraInfo;
    
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
        callons,
        extraInfo
    };

    const messageHtml = await renderTemplate(templates.npcMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor})
    });
}

interface NpcStatDialogData extends RollDialogData {
    tax?: number;
    stat: TracksTests;
    circlesBonus?: {name: string, amount: number}[];
    circlesMalus?: {name: string, amount: number}[];
}

interface NpcRollEventOptions extends EventHandlerOptions {
    sheet: NpcSheet;
}

interface NpcStatRollOptions extends RollOptions {
    actor: BWActor & Npc;
    dice: number;
    shade: helpers.ShadeString;
    open: boolean;
    statName: string;
}