import { BWActor, RollModifier, TracksTests } from "../bwactor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import * as helpers from "../helpers.js";
import { Possession } from "../items/item.js";
import { handleAttrRoll } from "./rollAttribute.js";
import { handleCirclesRoll } from "./rollCircles.js";
import { handleLearningRoll } from "./rollLearning.js";
import { handleGritRoll, handleShrugRoll } from "./rollPtgs.js";
import { handleResourcesRoll } from "./rollResources.js";
import { handleSkillRoll } from "./rollSkill.js";
import { handleStatRoll } from "./rollStat.js";
import { handleArmorRoll } from "./rollArmor.js";
import { handleWeaponRoll } from "./rollWeapon.js";
import { handleSpellRoll } from "./rollSpell.js";
import { handleSpellTaxRoll } from "./rollSpellTax.js";
import { BWCharacterSheet } from "module/character-sheet.js";

export async function handleRollable(
    e: JQuery.ClickEvent<unknown, undefined>, sheet: BWActorSheet): Promise<unknown> {
    const target = e.currentTarget as HTMLButtonElement;
    const rollType = target.dataset.rollType;

    switch(rollType) {
        case "skill":
            return handleSkillRoll({ target, sheet });
        case "stat":
            return handleStatRoll({ target, sheet });
        case "circles":
            return handleCirclesRoll({ target, sheet });
        case "attribute":
            return handleAttrRoll({ target, sheet });
        case "resources":
            return handleResourcesRoll({ target, sheet });
        case "learning":
            return handleLearningRoll({ target, sheet });
        case "shrug":
            if ((sheet as BWCharacterSheet).actor.data.data.ptgs.shrugging) {
                return sheet.actor.update({ "data.ptgs.shrugging": false });
            }
            return handleShrugRoll({ target, sheet });
        case "grit":
            if ((sheet as BWCharacterSheet).actor.data.data.ptgs.gritting) {
                return sheet.actor.update({ "data.ptgs.gritting": false });
            }
            return handleGritRoll({ target, sheet });
        case "weapon":
            return handleWeaponRoll({ target, sheet });
        case "spell":
            return handleSpellRoll({ target, sheet });
        case "armor":
            return handleArmorRoll({ target, sheet });
        case "spellTax":
            return handleSpellTaxRoll(target, sheet);
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
        tax: number): helpers.StringIndexedObject<string> {
    const dieSources: { [i: string]: string } = {};
    if (exp) { dieSources.Exponent = `+${exp}`; }
    if (aDice) { dieSources.Artha = `+${aDice}`; }
    if (bDice) { dieSources.Bonus = `+${bDice}`; }
    if (forks) { dieSources.FoRKs = `+${forks}`; }
    if (woundDice) { dieSources["Wound Penalty"] = `-${woundDice}`; }
    if (tax) { dieSources.Tax = `-${tax}`; }
    return dieSources;
}

export function buildRerollData(actor: BWActor, roll: Roll, accessor?: string, itemId?: string):
        RerollData {
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

export function extractBaseData(html: JQuery, sheet: BWActorSheet ): BaseDataObject {
    const exponent = extractNumber(html, "stat.exp");
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

    return { exponent, woundDice, obPenalty, diff, aDice, bDice, miscDice, penaltySources, obstacleTotal };
}

export function extractSelectString(html: JQuery, name: string): string | undefined {
    return html.find(`select[name="${name}"]`).val() as string;
}

export function extractSelectNumber(html: JQuery, name: string): number {
    return parseInt(extractSelectString(html, name) || "0", 10) as number;
}

export function extractString(html: JQuery, name: string): string | undefined {
    return html.find(`input[name="${name}"]`).val() as string;
}

export function extractNumber(html: JQuery, name: string): number {
    return parseInt(extractString(html, name) || "0", 10);
}

export function extractCheckboxValue(html: JQuery, name: string): number {
    let sum = 0;
    html.find(`input[name="${name}"]:checked`).each((_i, v) => {
        sum += parseInt(v.getAttribute("value") || "", 10);
    });
    return sum;
}

export function extractMiscDice(html: JQuery): { sum: number, entries: {[i:string]: string} } {
    let sum = 0;
    const entries = {};
    html.find('input[name="miscDice"]:checked').each((_i, v) => {
        const mod = parseInt(v.getAttribute("value") || "", 10);
        sum += mod;
        entries[v.dataset.name || "Misc"] = mod >= 0 ? `+${mod}` : `${mod}`;
    });
    return { sum, entries };
}

export function extractMiscObs(html: JQuery): { sum: number, entries: {[i:string]: string} } {
    let sum = 0;
    const entries = {};
    html.find('input[name="miscObs"]:checked').each((_i, v) => {
        const mod = parseInt(v.getAttribute("value") || "", 10);
        sum += mod;
        entries[v.dataset.name || "Misc"] = mod >= 0 ? `+${mod}` : `${mod}`;
    });
    return { sum, entries };
}

export async function rollDice(numDice: number, open = false, shade: helpers.ShadeString = 'B'):
    Promise<Roll | undefined> {
    if (numDice <= 0) {
        getNoDiceErrorDialog(numDice);
        return;
    } else {
        const tgt = shade === 'B' ? '3' : (shade === 'G' ? '2' : '1');
        const roll = new Roll(`${numDice}d6${open?'x':''}cs>${tgt}`).roll();
        if (game.dice3d) {
            return game.dice3d.showForRoll(roll, game.user, true, null, false)
                .then(_ => helpers.sleep(500))
                .then(_ => roll);
        }
        return new Promise(r => r(roll));
    }
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

export async function getNoDiceErrorDialog(numDice: number): Promise<Application> {
    return helpers.notifyError("Too Few Dice",
        `Too few dice to be rolled. Must roll a minimum of one. Currently, bonuses and penalties add up to ${numDice}`);
}

export async function maybeExpendTools(tools: Possession): Promise<unknown> {
    const roll = await rollDice(1, false, "B");
    if (roll && roll.dice[0].rolls[0].roll === 1) {
        return Dialog.confirm({
            title: "Expend toolkit",
            content: `<p>The die of fate result was a 1 and thus the toolkit used (${tools.name}) is expended.</p><hr><p>Update the toolkit?</p>`,
            yes: () => { tools.update({"data.isExpended": true}, null); },
            no: () => { return; }
        });
    }
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


export function extractNpcRollData(html: JQuery): RollData {
    const exponent = extractNumber(html, "stat.exp") + extractNumber(html, "skill.exp");
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
    const wildForks = extractCheckboxValue(html, "wildForks");

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

export async function rollWildFork(numDice: number, shade: helpers.ShadeString = 'B'): Promise<Die | undefined> {
    if (numDice <= 0) {
        return;
    }
    const tgt = shade === 'B' ? 3 : (shade === 'G' ? 2 : 1);
    const die = new AstrologyDie(6);
    die.roll(numDice);
    die.explode([6,1]);
    die.countSuccess(tgt, ">");
    if (game.dice3d) {
        game.dice3d.show({
            formula: `${die.results.length}d6`,
            results: die.rolls.map(r => r.roll),
            whisper: null,
            blind: false});
    }
    return new Promise(r => r(die));
}

export class AstrologyDie extends Die {
    get results(): number[] {
        return this.rolls.filter(r => !r.rerolled && !r.discarded).map(r => {
            if ( r.success === true ) return 1;
            else if (r.roll === 1) return -1;
            else return 0;
          });
    }
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

/* ============ Constants =============== */
export const templates = {
    armorDialog: "systems/burningwheel/templates/chat/armor-dialog.hbs",
    armorMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    attrDialog: "systems/burningwheel/templates/chat/roll-dialog.hbs",
    attrMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    circlesDialog: "systems/burningwheel/templates/chat/circles-dialog.hbs",
    circlesMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    learnDialog: "systems/burningwheel/templates/chat/roll-dialog.hbs",
    learnMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    skillDialog: "systems/burningwheel/templates/chat/skill-dialog.hbs",
    skillMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    statDialog: "systems/burningwheel/templates/chat/roll-dialog.hbs",
    statMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    rerollChatMessage: "systems/burningwheel/templates/chat/reroll-message.hbs",
    resourcesDialog: "systems/burningwheel/templates/chat/resources-dialog.hbs",
    resourcesMessage: "systems/burningwheel/templates/chat/roll-message.hbs",
    npcRollDialog: "systems/burningwheel/templates/dialogs/npc-roll-dialog.hbs",
    npcMessage: "systems/burningwheel/templates/chat/roll-message.hbs"
};


/* =============== Types ================= */
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

    wildRolls?: {success: boolean, roll: number}[];
    dieSources?: { [i: string]: string };
    penaltySources?: { [i: string]: string };
    fateReroll?: RerollData;
    callons: RerollData[];
    extraInfo?: string | HTMLElement;
}

export interface RerollData {
    dice: string;
    actorId: string;
    type?: "stat" | "skill" | "learning" | "armor";
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

interface BaseDataObject {
    exponent: number,
    woundDice: number,
    obPenalty: number,
    diff: number,
    aDice: number,
    bDice: number,
    miscDice: {
        sum: number,
        entries: helpers.StringIndexedObject<string>
    },
    penaltySources: helpers.StringIndexedObject<string>,
    obstacleTotal: number
}

export interface RollOptions {
    target: HTMLElement;
    sheet: BWActorSheet;
    extraInfo?: string;
    dataPreset?: Partial<RollDialogData>;
    onRollCallback?: () => Promise<unknown>;
}