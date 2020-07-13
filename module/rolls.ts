import { BWActor, CharacterData, TracksTests } from "./actor.js";
import { BWActorSheet } from "./bwactor-sheet.js";
import { Relationship, Skill, SkillDataRoot } from "./items/item.js";

export async function handleRollable(
    e: JQuery.ClickEvent<HTMLElement, null, HTMLElement, HTMLElement>, sheet: BWActorSheet): Promise<unknown> {
    const target = e.currentTarget as HTMLButtonElement;
    const rollType = target.dataset.rollType;

    switch(rollType) {
        case "skill":
            return handleSkillRoll(target, sheet);
        case "stat":
            return handleStatRoll(target, sheet);
        case "circles":
            return handleCirclesRoll(target, sheet);
        case "attribute": case "resources":
            return handleAttrRoll(target, sheet);
        case "learning":
            return handleLearningRoll(target, sheet);
    }
}

async function handleAttrRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor || "") as TracksTests;
    const actor = sheet.actor as BWActor;
    const data: AttributeDialogData = {
        name: target.dataset.rollableName || "Unknown Attribute",
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat
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
                        attrRollCallback(dialogHtml, stat, sheet, 0, target.dataset.rollableName || "Unknown Attribute")
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

    const data: RollChatMessageData = {
        name: `${name} Test`,
        successes: roll.result,
        difficulty: baseData.diff,
        obstacleTotal: baseData.obstacleTotal,
        success: parseInt(roll.result, 10) >= (baseData.diff + baseData.obPenalty),
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + baseData.bDice - tax - baseData.woundDice, baseData.diff),
        penaltySources: baseData.penaltySources,
        dieSources
    };
    const messageHtml = await renderTemplate(templates.attrMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

async function handleCirclesRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, "data.circles") as TracksTests;
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
        woundDice: actor.data.data.ptgs.woundDice,
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
        stat: TracksTests,
        sheet: BWActorSheet,
        contact?: Relationship) {
    const baseData = extractBaseData(dialogHtml, sheet);
    const bonusData = extractCirclesBonuses(dialogHtml, "circlesBonus");
    const penaltyData = extractCirclesPenalty(dialogHtml, "circlesMalus");
    const exp = parseInt(stat.exp, 10);
    const dieSources = {
        ...buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, 0),
        ...bonusData.bonuses
    };
    if (contact) {
        dieSources["Named Contact"] = "+1";
        baseData.bDice ++;
    }
    const roll = new Roll(`${exp + baseData.bDice + baseData.aDice + bonusData.sum - baseData.woundDice}d6cs>3`)
        .roll();
    baseData.obstacleTotal += penaltyData.sum;
    const data: RollChatMessageData = {
        name: `Circles Test`,
        successes: roll.result,
        difficulty: baseData.diff,
        obstacleTotal: baseData.obstacleTotal,
        success: parseInt(roll.result, 10) >= baseData.obstacleTotal,
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(
            exp + baseData.bDice - baseData.woundDice,
            baseData.diff + baseData.obPenalty + penaltyData.sum),
        dieSources,
        penaltySources: { ...baseData.penaltySources, ...penaltyData.bonuses }
    };
    const messageHtml = await renderTemplate(templates.circlesMessage, data);

    // incremet relationship tracking values...
    if (contact && contact.data.data.building) {
        contact.update({"data.buildingProgress": parseInt(contact.data.data.buildingProgress, 10) + 1 }, null);
    }

    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

async function handleLearningRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const skillData = (sheet.actor.getOwnedItem(skillId) as Skill).data;
    const actor = sheet.actor as BWActor;
    const data: LearningDialogData = {
        name: `Beginner's Luck ${target.dataset.rollableName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: { exp: 10 - (skillData.data.aptitude || 1) } as any
    };

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
    baseData.obstacleTotal += baseData.diff;
    const exp = 10 - (skillData.data.aptitude || 1);
    const roll = new Roll(`${exp + baseData.bDice + baseData.aDice - baseData.woundDice}d6cs>3`).roll();
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, baseData.woundDice, 0);
    const data: RollChatMessageData = {
        name: `Beginner's Luck ${skillData.name} Test`,
        successes: roll.result,
        difficulty: baseData.diff * 2,
        obstacleTotal: baseData.obstacleTotal,
        success: parseInt(roll.result, 10) >= baseData.obstacleTotal,
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + baseData.bDice- baseData.woundDice, baseData.diff),
        penaltySources: baseData.penaltySources,
        dieSources,
    };
    const messageHtml = await renderTemplate(templates.learnMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

async function handleStatRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor || "") as TracksTests;
    const actor = sheet.actor as BWActor;
    let tax = 0;
    if (target.dataset.rollableName!.toLowerCase() === "will") {
        tax = parseInt(actor.data.data.willTax, 10);
    }
    const data: StatDialogData = {
        name: target.dataset.rollableName || "Unknown Stat",
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        tax
    };

    const html = await renderTemplate(templates.statDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${target.dataset.rollableName} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        statRollCallback(dialogHtml, stat, sheet, tax, target.dataset.rollableName || "Unknown Stat")
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

    const data: RollChatMessageData = {
        name: `${name} Test`,
        successes: roll.result,
        difficulty: baseData.diff + baseData.obPenalty,
        obstacleTotal: baseData.obstacleTotal,
        success: parseInt(roll.result, 10) >= baseData.obstacleTotal,
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + baseData.bDice - tax - baseData.woundDice, baseData.diff),
        penaltySources: baseData.penaltySources,
        dieSources,
    };
    const messageHtml = await renderTemplate(templates.skillMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

async function handleSkillRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const skillData = (sheet.actor.getOwnedItem(skillId) as Skill).data;
    const actor = sheet.actor as BWActor;
    const templateData: SkillDialogData = {
        name: skillData.name,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: skillData.data,
        forkOptions: actor.getForkOptions(skillData.name)
    };
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
    const data: RollChatMessageData = {
        name: `${skillData.name} Test`,
        successes: roll.result,
        difficulty: baseData.diff,
        obstacleTotal: baseData.obstacleTotal,
        success: parseInt(roll.result, 10) >= baseData.obstacleTotal,
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + baseData.bDice + forks - baseData.woundDice, baseData.diff),
        penaltySources: baseData.penaltySources,
        dieSources,
    };
    const messageHtml = await renderTemplate(templates.skillMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

function buildDiceSourceObject(
        exp: number,
        aDice: number,
        bDice: number,
        forks: number,
        woundDice: number,
        tax: number) {
    const dieSources: { [i: string]: string } = {
        "Exponent": `+${exp}`,
    };
    if (aDice) { dieSources.Artha = `+${aDice}`; }
    if (bDice) { dieSources.Bonus = `+${bDice}`; }
    if (forks) { dieSources.FoRKs = `+${forks}`; }
    if (woundDice) { dieSources["Wound Penalty"] = `-${woundDice}`; }
    if (tax) { dieSources.Tax = `-${tax}`; }
    return dieSources;
}

/* ======== Helper functions ======================= */
function extractBaseData(html: JQuery<HTMLElement>, sheet: BWActorSheet ) {
    const actorData = sheet.actor.data as CharacterData;
    const woundDice = actorData.data.ptgs.woundDice || 0;
    const obPenalty = actorData.data.ptgs.obPenalty || 0;
    const penaltySources: { [i:string]: string} = obPenalty ? { "Wound Penalty": `+${obPenalty}` } : { };
    const diff = extractNumber(html, "difficulty");
    const aDice = extractNumber(html, "arthaDice");
    const bDice = extractNumber(html, "bonusDice");
    const obstacleTotal = diff + obPenalty;

    return { woundDice, obPenalty, diff, aDice, bDice, penaltySources, obstacleTotal };
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
        sum += parseInt(v.getAttribute("value") || "", 10);
    });
    return sum;
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
    circlesDialog: "systems/burningwheel/templates/chat/circles-dialog.html",
    circlesMessage: "systems/burningwheel/templates/chat/roll-message.html",
    learnDialog: "systems/burningwheel/templates/chat/roll-dialog.html",
    learnMessage: "systems/burningwheel/templates/chat/roll-message.html",
    skillDialog: "systems/burningwheel/templates/chat/skill-dialog.html",
    skillMessage: "systems/burningwheel/templates/chat/roll-message.html",
    statDialog: "systems/burningwheel/templates/chat/roll-dialog.html",
    statMessage: "systems/burningwheel/templates/chat/roll-message.html"
};


/* =============== Types ================= */
export interface LearningDialogData extends RollDialogData {
    skill: SkillDataRoot;
}

export interface CirclesDialogData extends AttributeDialogData {
    circlesBonus?: {name: string, amount: number}[];
    circlesMalus?: {name: string, amount: number}[];
    circlesContact?: Item;
}

export interface AttributeDialogData extends RollDialogData {
    stat: TracksTests;
    tax?: number;
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
    woundDice?: number;
    obPenalty?: number;
}

export interface RollChatMessageData {
    name: string;
    successes: string;
    difficulty: number;
    specialPenalty?: { name: string, amount: number };
    success: boolean;
    rolls: {success: boolean, roll: number}[];
    difficultyGroup: string;
    obstacleTotal: number;

    dieSources?: { [i: string]: string };
    penaltySources?: { [i: string]: string };
}