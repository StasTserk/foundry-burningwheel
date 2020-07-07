import { BWActor, CharacterData, TracksTests } from "./actor.js";
import { BWActorSheet } from "./bwactor-sheet.js";
import { Skill, SkillDataRoot } from "./items/item.js";

export async function handleRollable(
    e: JQuery.ClickEvent<HTMLElement, null, HTMLElement, HTMLElement>, sheet: BWActorSheet): Promise<unknown> {
    const target = e.currentTarget as HTMLButtonElement;
    const rollType = target.dataset.rollType;

    switch(rollType) {
        case "skill":
            return handleSkillRoll(target, sheet);
        case "stat":
            return handleStatRoll(target, sheet);
        case "attribute": case "circles": case "resources":
            return handleAttrRoll(target, sheet);
        case "learning":
            return handleLearningRoll(target, sheet);
    }
}

async function handleAttrRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor) as TracksTests;
    const actor = sheet.actor as BWActor;
    const data = {
        name: target.dataset.rollableName,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat
    } as AttributeDialogData;

    const html = await renderTemplate(templates.attrDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${target.dataset.rollableName} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        attrRollCallback(dialogHtml, stat, sheet, 0, target.dataset.rollableName)
                }
            }
        }).render(true)
    );
}

async function attrRollCallback(
        dialogHtml: JQuery<HTMLElement>,
        stat: TracksTests,
        sheet: BWActorSheet,
        tax: number,
        name: string) { // todo add relationship forks here
    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = parseInt(stat.exp, 10);
    const roll = new Roll(`${exp + baseData.bDice + baseData.aDice - baseData.woundDice - tax}d6cs>3`).roll();
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, tax);
    const data = {
        name: `${name} Test`,
        successes: roll.result,
        difficulty: baseData.diff,
        obPenalty: baseData.obPenalty,
        success: parseInt(roll.result, 10) >= (baseData.diff + baseData.obPenalty),
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + baseData.bDice - tax - baseData.woundDice, baseData.diff),
        dieSources
    } as RollChatMessageData;
    const messageHtml = await renderTemplate(templates.attrMessage, data)
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

async function handleLearningRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const skillId = target.dataset.skillId
    const skillData = (sheet.actor.getOwnedItem(skillId) as Skill).data;
    const actor = sheet.actor as BWActor;
    const data = {
        name: `Beginner's Luck ${target.dataset.rollableName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: { exp: skillData.data.aptitude } as any
    } as LearningDialogData;

    const html = await renderTemplate(templates.learnDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${target.dataset.rollableName} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        learningRollCallback(dialogHtml, skillData, sheet)
                }
            }
        }).render(true)
    );
}

async function learningRollCallback(
    dialogHtml: JQuery<HTMLElement>, skillData: SkillDataRoot, sheet: BWActorSheet): Promise<unknown> {

    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = skillData.data.aptitude
    const roll = new Roll(`${exp + baseData.bDice + baseData.aDice - baseData.woundDice}d6cs>3`).roll();
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, 0);
    const data = {
        name: `Beginner's Luck ${skillData.name} Test`,
        successes: roll.result,
        difficulty: baseData.diff * 2,
        obPenalty: baseData.obPenalty,
        success: parseInt(roll.result, 10) >= (baseData.diff + baseData.diff + baseData.obPenalty),
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + baseData.bDice- baseData.woundDice, baseData.diff),
        dieSources
    } as RollChatMessageData;
    const messageHtml = await renderTemplate(templates.learnMessage, data)
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    })
}

async function handleStatRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor) as TracksTests;
    const actor = sheet.actor as BWActor;
    let tax = 0;
    if (target.dataset.rollableName.toLowerCase() === "will") {
        tax = parseInt(actor.data.data.willTax, 10);
    }
    const data = {
        name: target.dataset.rollableName,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        tax
    } as StatDialogData;

    const html = await renderTemplate(templates.statDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${target.dataset.rollableName} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        statRollCallback(dialogHtml, stat, sheet, tax, target.dataset.rollableName)
                }
            }
        }).render(true)
    );
}

async function statRollCallback(
        dialogHtml: JQuery<HTMLElement>,
        stat: TracksTests,
        sheet: BWActorSheet,
        tax: number,
        name: string) {
    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = parseInt(stat.exp, 10);
    const roll = new Roll(`${exp + baseData.bDice + baseData.aDice - baseData.woundDice - tax}d6cs>3`).roll();
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, tax);
    const data = {
        name: `${name} Test`,
        successes: roll.result,
        difficulty: baseData.diff,
        obPenalty: baseData.obPenalty,
        success: parseInt(roll.result, 10) >= (baseData.diff + baseData.obPenalty),
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + baseData.bDice - tax - baseData.woundDice, baseData.diff),
        dieSources
    } as RollChatMessageData;
    const messageHtml = await renderTemplate(templates.skillMessage, data)
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

async function handleSkillRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const skillId = target.dataset.skillId
    const skillData = (sheet.actor.getOwnedItem(skillId) as Skill).data;
    const actor = sheet.actor as BWActor;
    const templateData = {
        name: skillData.name,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: skillData.data,
        forkOptions: actor.getForkOptions(skillData.name)
    } as SkillDialogData;
    const html = await renderTemplate(templates.skillDialog, templateData);
    return new Promise(_resolve =>
        new Dialog({
            title: `${skillData.name} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        skillRollCallback(dialogHtml, skillData, sheet)
                }
            }
        }).render(true)
    );
}

async function skillRollCallback(
    dialogHtml: JQuery<HTMLElement>, skillData: SkillDataRoot, sheet: BWActorSheet): Promise<unknown> {

    const forks = extractForksValue(dialogHtml, "forkOptions");
    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = parseInt(skillData.data.exp, 10);
    const roll = new Roll(`${exp + baseData.bDice + baseData.aDice + forks - baseData.woundDice}d6cs>3`).roll();
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, forks, baseData.woundDice, 0);
    const data = {
        name: `${skillData.name} Test`,
        successes: roll.result,
        difficulty: baseData.diff,
        obPenalty: baseData.obPenalty,
        success: parseInt(roll.result, 10) >= (baseData.diff + baseData.obPenalty),
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + baseData.bDice + forks - baseData.woundDice, baseData.diff),
        dieSources
    } as RollChatMessageData;
    const messageHtml = await renderTemplate(templates.skillMessage, data)
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    })
}

function buildDiceSourceObject(
        exp: number,
        aDice: number,
        bDice: number,
        forks: number,
        woundDice: number,
        tax: number) {
    const dieSources = {
        "Exponent": `+${exp}`,
    } as { [i: string]: string };
    if (aDice) { dieSources.Artha = `+${aDice}`; }
    if (bDice) { dieSources.Bonus = `+${bDice}`; }
    if (forks) { dieSources.FoRKs = `+${forks}`; }
    if (woundDice) { dieSources["Wound Penalty"] = `-${woundDice}`; }
    if (tax) { dieSources.Tax = `-${tax}`}
    return dieSources;
}

/* ======== Helper functions ======================= */
function extractBaseData(html: JQuery<HTMLElement>, sheet: BWActorSheet ) {
    const actorData = sheet.actor.data as CharacterData;
    const woundDice = actorData.data.ptgs.woundDice || 0;
    const obPenalty = actorData.data.ptgs.obPenalty || 0;
    const diff = extractNumber(html, "difficulty");
    const aDice = extractNumber(html, "arthaDice");
    const bDice = extractNumber(html, "bonusDice");

    return { woundDice, obPenalty, diff, aDice, bDice };
}

function extractString(html: JQuery<HTMLElement>, name: string): string {
    return html.find(`input[name=\"${name}\"]`).val() as string;
}

function extractNumber(html: JQuery<HTMLElement>, name: string): number {
    return parseInt(extractString(html, name), 10);
}

function extractForksValue(html: JQuery<HTMLElement>, name: string): number {
    let sum: number = 0;
    html.find(`input[name=\"${name}\"]:checked`).each((_i, v) => {
        sum += parseInt(v.getAttribute("value"), 10);
    });
    return sum;
}

function difficultyGroup(dice: number, difficulty: number): string {
    if (difficulty > dice) {
        return "Challenging";
    }
    if (dice === 1) {
        return "Routine/Difficult";
    }
    if (dice === 2) {
        return difficulty === 2 ? "Difficult" : "Routine";
    }

    let spread = 1;
    if (dice > 6) {
        spread = 3;
    } else if (dice > 3) {
        spread = 2;
    }

     return (dice - spread >= difficulty) ? "Routine" : "Difficult";
}


/* ============ Constants =============== */
const templates = {
    attrDialog: "systems/burningwheel/templates/chat/roll-dialog.html",
    attrMessage: "systems/burningwheel/templates/chat/roll-message.html",
    learnDialog: "systems/burningwheel/templates/chat/roll-dialog.html",
    learnMessage: "systems/burningwheel/templates/chat/roll-message.html",
    skillDialog: "systems/burningwheel/templates/chat/skill-dialog.html",
    skillMessage: "systems/burningwheel/templates/chat/roll-message.html",
    statDialog: "systems/burningwheel/templates/chat/roll-dialog.html",
    statMessage: "systems/burningwheel/templates/chat/roll-message.html"
}


/* =============== Types ================= */
export interface LearningDialogData extends RollDialogData {
    skill: SkillDataRoot;
}

export interface AttributeDialogData extends RollDialogData {
    stat: TracksTests;
    tax?: number;
    forkOptions: Item[]
}

export interface StatDialogData extends RollDialogData {
    tax?: number;
    stat: TracksTests;
}

export interface SkillDialogData extends RollDialogData {
    skill: TracksTests;
    forkOptions: Item[];
}

interface RollDialogData {
    name: string;
    difficulty: number;
    arthaDice: number;
    bonusDice: number;
    woundDice: number;
    obPenalty: number;
}

export interface RollChatMessageData {
    name: string;
    successes: string,
    difficulty: number,
    obPenalty: number,
    success: boolean,
    rolls: {success: boolean, roll: number}[],
    difficultyGroup: string,

    dieSources?: { [i: string]: string }
}