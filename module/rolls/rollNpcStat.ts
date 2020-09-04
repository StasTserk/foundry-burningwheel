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
    extractNumber,
    extractMiscDice,
    extractMiscObs,
    extractCheckboxValue
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
    const rollData = extractNpcRollData(dialogHtml);
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

function extractSourcedValue(html: JQuery, name: string):
        { sum: number, entries: {[i:string]: string} } {
    let sum = 0;
    const entries = {};
    html.find(`input[name="${name}"]:checked`).each((_i, v) => {
        const mod = parseInt(v.getAttribute("value") || "", 10);
        sum += mod;
        entries[v.dataset.name || "Misc"] = mod >= 0 ? `+${mod}` : `${mod}`;
    });
    return { sum, entries };
}


function extractNpcRollData(html: JQuery): RollData {
    const exponent = extractNumber(html, "stat.exp");
    const diff = extractNumber(html, "difficulty");
    const aDice = extractNumber(html, "arthaDice");
    const bDice = extractNumber(html, "bonusDice");
    const woundDice = extractNumber(html, "woundDice") || 0;
    const obPenalty = extractNumber(html, "obPenalty") || 0;
    
    const miscDice = extractMiscDice(html);
    const miscObs = extractMiscObs(html);

    const circlesBonus = extractSourcedValue(html, "circlesBonus");
    const circlesMalus = extractSourcedValue(html, "circlesMalus");

    let penaltySources: { [i:string]: string} = obPenalty ? { "Wound Penalty": `+${obPenalty}` } : { };

    const toolkitPenalty = extractNumber(html, "toolPenalty") ? diff : 0;
    if (toolkitPenalty) { penaltySources["No Toolkit"] = `+${toolkitPenalty}`; }
    const learningPenalty = extractNumber(html, "learning") ? diff + toolkitPenalty : 0;
    if (learningPenalty) { penaltySources["No Toolkit"] = `+${learningPenalty}`; }

    penaltySources = {...penaltySources, ...miscObs.entries, ...circlesMalus.entries};

    const obstacleTotal = diff + obPenalty + miscObs.sum + toolkitPenalty + circlesMalus.sum;
    const tax = extractNumber(html, "tax");
    const forks = extractCheckboxValue(html, "forkOptions");
    const wildForks = extractCheckboxValue(html, "forkOptions");

    let dieSources: { [s:string]: string } = {
        "Exponent": `+${exponent}`
    };
    if (woundDice) { dieSources["Wound Penalty"] = `-${woundDice}`; }
    if (aDice) { dieSources.Artha = `+${aDice}`; }
    if (bDice) { dieSources.Bonus = `+${bDice}`; }
    if (forks) { dieSources.FoRKs = `+${forks}`; }
    if (circlesBonus.sum) { dieSources = { ...dieSources, ...circlesBonus.entries}; }
    if (tax) { dieSources.Tax = `-${tax}`; }

    const diceTotal = aDice + bDice + miscDice.sum + exponent - woundDice + forks - tax + circlesBonus.sum;
    const difficultyDice = bDice + miscDice.sum + exponent + wildForks + forks - woundDice - tax + circlesBonus.sum;

    return { 
        baseDifficulty: diff,
        diceTotal,
        difficultyDice,
        difficultyTestTotal: obstacleTotal,
        difficultyTotal: obstacleTotal + learningPenalty,
        dieSources,
        obSources: {
            ...penaltySources
        },
        wildForks: wildForks,
        difficultyGroup: helpers.difficultyGroup(difficultyDice, obstacleTotal)
    };
}

export interface RollData {
    baseDifficulty: number;
    diceTotal: number;
    difficultyDice: number;
    difficultyTotal: number;
    difficultyTestTotal: number;
    wildForks: number;
    dieSources: { [s:string]: string };
    obSources: { [s:string]: string };
    difficultyGroup: helpers.TestString;
}