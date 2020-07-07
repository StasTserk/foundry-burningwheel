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
    }
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
    const actorData = sheet.actor.data as CharacterData;
    const woundDice = actorData.data.ptgs.woundDice || 0;
    const obPenalty = actorData.data.ptgs.obPenalty || 0;
    const diff = extractNumber(dialogHtml, "difficulty");
    const aDice = extractNumber(dialogHtml, "arthaDice");
    const bDice = extractNumber(dialogHtml, "bonusDice");
    const exp = parseInt(skillData.data.exp, 10);
    const roll = new Roll(`${exp + bDice + aDice + forks - woundDice}d6cs>3`).roll();
    const dieSources = {
        "Exponent": `+${exp}`,
    } as { [i: string]: string };
    if (aDice) { dieSources.Artha = `+${aDice}`; }
    if (bDice) { dieSources.Bonus = `+${bDice}`; }
    if (forks) { dieSources.FoRKs = `+${forks}`; }
    if (woundDice) { dieSources["Wound Penalty"] = `-${woundDice}`; }

    const data = {
        name: `${skillData.name} Test`,
        successes: roll.result,
        difficulty: diff,
        obPenalty,
        success: parseInt(roll.result, 10) >= (diff + obPenalty),
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + bDice + forks - woundDice, diff),
        dieSources
    } as RollChatMessageData;
    const messageHtml = await renderTemplate(templates.skillMessage, data)
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    })
}

const templates = {
    skillDialog: "systems/burningwheel/templates/chat/skill-dialog.html",
    skillMessage: "systems/burningwheel/templates/chat/roll-message.html"
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

export interface SkillDialogData {
    name: string;
    difficulty: number;
    arthaDice: number;
    bonusDice: number;
    woundDice: number;
    obPenalty: number;
    skill: TracksTests
    forkOptions: Item[];
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