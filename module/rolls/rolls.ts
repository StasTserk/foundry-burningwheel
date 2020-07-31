import { Ability, BWActor, RollModifier, TracksTests } from "../actor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import * as helpers from "../helpers.js";
import { Skill, SkillDataRoot } from "../items/item.js";
import { handleAttrRoll } from "./rollAttribute.js";
import { handleCirclesRoll } from "./rollCircles.js";
import { handleLearningRoll } from "./rollLearning.js";
import { handleGritRoll, handleShrugRoll } from "./rollPtgs.js";
import { handleResourcesRoll } from "./rollResources.js";
import { handleSkillRoll } from "./rollSkill.js";
import { handleStatRoll } from "./rollStat.js";

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
        case "attribute":
            return handleAttrRoll(target, sheet);
        case "resources":
            return handleResourcesRoll(target, sheet);
        case "learning":
            return handleLearningRoll(target, sheet);
        case "shrug":
            if (sheet.actor.data.data.ptgs.shrugging) {
                return sheet.actor.update({ "data.ptgs.shrugging": false });
            }
            return handleShrugRoll(target, sheet);
        case "grit":
            if (sheet.actor.data.data.ptgs.gritting) {
                return sheet.actor.update({ "data.ptgs.gritting": false });
            }
            return handleGritRoll(target, sheet);
    }
}

/* ================================================= */
/*               Helper functions                    */
/* ================================================= */
export function buildDiceSourceObject(
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

export function buildRerollData(actor: BWActor, roll: Roll, accessor?: string, itemId?: string):
        RerollData | undefined {
    const coreData: RerollData = {
        dice: roll.dice[0].rolls.map(r => r.roll).join(","),
        actorId: actor._id,
    };
    if (accessor) {
        return {
            accessor,
            type: "stat",
            ...coreData
        };
    } else {
        return {
            itemId,
            type: "skill",
            ...coreData
        };
    }
}

export function extractBaseData(html: JQuery<HTMLElement>, sheet: BWActorSheet ) {
    const actorData = sheet.actor.data;
    const woundDice = extractNumber(html, "woundDice") || 0;
    const obPenalty = actorData.data.ptgs.obPenalty || 0;
    let penaltySources: { [i:string]: string} = obPenalty ? { "Wound Penalty": `+${obPenalty}` } : { };
    const miscDice = extractMiscDice(html);
    const miscObs = extractMiscObs(html);
    penaltySources = {...penaltySources, ...miscObs.entries};
    const diff = extractNumber(html, "difficulty");
    const aDice = extractNumber(html, "arthaDice");
    const bDice = extractNumber(html, "bonusDice");
    const obstacleTotal = diff + obPenalty + miscObs.sum;

    return { woundDice, obPenalty, diff, aDice, bDice, miscDice, penaltySources, obstacleTotal };
}

export function extractSelectString(html: JQuery<HTMLElement>, name: string): string | undefined {
    return html.find(`select[name=\"${name}\"]`).val() as string;
}

export function extractSelectNumber(html: JQuery<HTMLElement>, name: string): number {
    return parseInt(extractSelectString(html, name) || "0", 10) as number;
}

export function extractString(html: JQuery<HTMLElement>, name: string): string | undefined {
    return html.find(`input[name=\"${name}\"]`).val() as string;
}

export function extractNumber(html: JQuery<HTMLElement>, name: string): number {
    return parseInt(extractString(html, name) || "0", 10);
}

export function extractCheckboxValue(html: JQuery<HTMLElement>, name: string): number {
    let sum: number = 0;
    html.find(`input[name=\"${name}\"]:checked`).each((_i, v) => {
        sum += parseInt(v.getAttribute("value") || "", 10);
    });
    return sum;
}

export function extractMiscDice(html: JQuery<HTMLElement>): { sum: number, entries: {[i:string]: string} } {
    let sum = 0;
    const entries = {};
    html.find('input[name="miscDice"]:checked').each((_i, v) => {
        const mod = parseInt(v.getAttribute("value") || "", 10);
        sum += mod;
        entries[v.dataset.name || "Misc"] = mod >= 0 ? `+${mod}` : `${mod}`;
    });
    return { sum, entries };
}

export function extractMiscObs(html: JQuery<HTMLElement>): { sum: number, entries: {[i:string]: string} } {
    let sum = 0;
    const entries = {};
    html.find('input[name="miscObs"]:checked').each((_i, v) => {
        const mod = parseInt(v.getAttribute("value") || "", 10);
        sum += mod;
        entries[v.dataset.name || "Misc"] = mod >= 0 ? `+${mod}` : `${mod}`;
    });
    return { sum, entries };
}

export async function rollDice(numDice: number, open: boolean = false, shade: helpers.ShadeString = 'B'):
    Promise<Roll | undefined> {
    if (numDice <= 0) {
        getNoDiceErrorDialog(numDice);
        return;
    } else {
        const tgt = shade === 'B' ? '3' : (shade === 'G' ? '2' : '1');
        const roll = new Roll(`${numDice}d6${open?'x':''}cs>${tgt}`).roll();
        if (game.dice3d) {
            return game.dice3d.showForRoll(roll, game.user, true, null, false)
                .then(_ => helpers.sleep(1000))
                .then(_ => roll);
        }
        return new Promise(r => r(roll));
    }
}

export function getRootStatInfo(skill: Skill, actor: BWActor): { open: boolean, shade: helpers.ShadeString } {
    const root1 = getProperty(actor, `data.data.${skill.data.data.root1}`) as Ability;
    const root2 = skill.data.data.root2 ?
        getProperty(actor, `data.data.${skill.data.data.root2}`) as Ability : root1;

    let shade: helpers.ShadeString;
    if (root1.shade === root2.shade) {
        shade = root1.shade;
    } else if (root1.shade === "B" || root2.shade === "B") {
        shade = "B";
    } else {
        shade = "G";
    }
    return {
        open: root1.open && root2.open,
        shade
    };
}

export function getRollNameClass(open: boolean, shade: helpers.ShadeString): string {
    let css = "shade-black";
    if (shade === "G") {
        css = "shade-grey";
    } else if (shade === "W") {
        css = "shade-white";
    }

    if (open) {
        css += " open-roll";
    }
    return css;
}

export async function getNoDiceErrorDialog(numDice: number) {
    return new Dialog({
        title: "Too Few Dice",
        content: `<p>Too few dice to be rolled. Must roll a minimum of one. Currently, bonuses and penalties add up to ${numDice}</p>`,
        buttons: {
            ok: {
                label: "OK"
            }
        }
    }).render(true);
}

/* ============ Constants =============== */
export const templates = {
    attrDialog: "systems/burningwheel/templates/chat/roll-dialog.html",
    attrMessage: "systems/burningwheel/templates/chat/roll-message.html",
    circlesDialog: "systems/burningwheel/templates/chat/circles-dialog.html",
    circlesMessage: "systems/burningwheel/templates/chat/roll-message.html",
    learnDialog: "systems/burningwheel/templates/chat/roll-dialog.html",
    learnMessage: "systems/burningwheel/templates/chat/roll-message.html",
    skillDialog: "systems/burningwheel/templates/chat/skill-dialog.html",
    skillMessage: "systems/burningwheel/templates/chat/roll-message.html",
    statDialog: "systems/burningwheel/templates/chat/roll-dialog.html",
    statMessage: "systems/burningwheel/templates/chat/roll-message.html",
    rerollChatMessage: "systems/burningwheel/templates/chat/reroll-message.html",
    resourcesDialog: "systems/burningwheel/templates/chat/resources-dialog.html",
    resourcesMessage: "systems/burningwheel/templates/chat/roll-message.html"
};


/* =============== Types ================= */
export interface LearningDialogData extends RollDialogData {
    skill: SkillDataRoot;
}

export interface AttributeDialogData extends RollDialogData {
    stat: TracksTests;
    tax?: number;
}

export interface RollDialogData {
    name: string;
    difficulty: number;
    arthaDice: number;
    bonusDice: number;
    woundDice?: number;
    obPenalty?: number;
    diceModifiers?: RollModifier[];
    optionalDiceModifiers?: RollModifier[];
    optionalObModifiers?: RollModifier[];
}

export interface RollChatMessageData {
    name: string;
    successes: string;
    difficulty: number;
    specialPenalty?: { name: string, amount: number };
    success: boolean;
    rolls: {success: boolean, roll: number}[];
    difficultyGroup: string;
    nameClass: string;
    obstacleTotal: number;

    dieSources?: { [i: string]: string };
    penaltySources?: { [i: string]: string };
    fateReroll?: RerollData;
    callons: RerollData[];
}

export interface RerollData {
    dice: string;
    actorId: string;
    type?: "stat" | "skill" | "learning";
    learningTarget?: string; // for reroll, which attribute to apply the fate to.
    ptgsAction?: string;
    itemId?: string;
    accessor?: string;
    label?: string;
}

export interface RerollMessageData {
    title: string;
    rolls: { roll: number, success: boolean }[];
    rerolls: { roll: number, success: boolean }[];
    success: boolean;
    successes: number;
    newSuccesses: number;
    obstacleTotal: number;
}