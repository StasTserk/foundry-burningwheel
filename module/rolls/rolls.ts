import { BWActor, RollModifier, TracksTests } from "../bwactor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import * as helpers from "../helpers.js";
import { Possession } from "../items/item.js";
import { handleAttrRollEvent } from "./rollAttribute.js";
import { handleCirclesRollEvent } from "./rollCircles.js";
import { handleLearningRollEvent } from "./rollLearning.js";
import { handleGritRollEvent, handleShrugRollEvent } from "./rollPtgs.js";
import { handleResourcesRollEvent } from "./rollResources.js";
import { handleSkillRollEvent } from "./rollSkill.js";
import { handleStatRollEvent } from "./rollStat.js";
import { handleArmorRollEvent } from "./rollArmor.js";
import { handleWeaponRollEvent } from "./rollWeapon.js";
import { handleSpellRollEvent } from "./rollSpell.js";
import { handleSpellTaxRoll } from "./rollSpellTax.js";
import { BWCharacterSheet } from "../character-sheet.js";

export async function handleRollable(
    e: JQuery.ClickEvent<unknown, undefined>, sheet: BWActorSheet): Promise<unknown> {
    const target = e.currentTarget as HTMLButtonElement;
    const rollType = target.dataset.rollType;

    switch(rollType) {
        case "skill":
            return handleSkillRollEvent({ target, sheet });
        case "stat":
            return handleStatRollEvent({ target, sheet });
        case "circles":
            return handleCirclesRollEvent({ target, sheet });
        case "attribute":
            return handleAttrRollEvent({ target, sheet });
        case "resources":
            return handleResourcesRollEvent({ target, sheet });
        case "learning":
            return handleLearningRollEvent({ target, sheet });
        case "shrug":
            if ((sheet as BWCharacterSheet).actor.data.data.ptgs.shrugging) {
                return sheet.actor.update({ "data.ptgs.shrugging": false });
            }
            return handleShrugRollEvent({ target, sheet });
        case "grit":
            if ((sheet as BWCharacterSheet).actor.data.data.ptgs.gritting) {
                return sheet.actor.update({ "data.ptgs.gritting": false });
            }
            return handleGritRollEvent({ target, sheet });
        case "weapon":
            return handleWeaponRollEvent({ target, sheet });
        case "spell":
            return handleSpellRollEvent({ target, sheet });
        case "armor":
            return handleArmorRollEvent({ target, sheet });
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
        dice: roll.dice[0].results.map(r => r.result).join(","),
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
        const roll = new Roll(`${numDice}d6${open?'x6':''}cs>${tgt}`).roll();
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

export async function maybeExpendTools(tools: Possession): Promise<{ expended: boolean, text: string }> {
    const roll = await rollDice(1, false, "B");
    const result = roll?.dice[0].rolls[0].roll;
    if (roll && result === 1) {
        return  {
            expended: true,
            text: `<p>The die of fate result for toolkit used (${tools.name}) was a <label class="roll-die" data-success="false">${result}</label> and thus the kit is expended.</p>`
        };
    }
    return {
        expended: false,
        text: `<p>The die of fate result for the toolkit used (${tools.name}) was a <label class="roll-die" data-success="true">${result}</label></p>`
    };
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

export function extractRollData(html: JQuery): RollData {
    const exponent = extractNumber(html, "stat.exp") + extractNumber(html, "skill.exp");
    const diff = extractNumber(html, "difficulty");
    const aDice = extractNumber(html, "arthaDice");
    const bDice = extractNumber(html, "bonusDice");
    const woundDice = extractNumber(html, "woundDice") || 0;
    const obPenalty = extractNumber(html, "obPenalty") || 0;
    const cashDice = extractSelectNumber(html, "cashDice") || 0;
    const fundDice = extractSelectNumber(html, "fundDice") || 0;
    const splitPool = extractNumber(html, "splitPool");
    
    const miscDice = extractMiscDice(html);
    const miscObs = extractMiscObs(html);

    const circlesBonus = extractSourcedValue(html, "circlesBonus");
    const circlesMalus = extractSourcedValue(html, "circlesMalus");

    let penaltySources: { [i:string]: string} = obPenalty ? { "Wound Penalty": `+${obPenalty}` } : { };

    const toolkitPenalty = extractCheckboxValue(html, "toolPenalty") ? diff : 0;
    if (toolkitPenalty) { penaltySources["No Toolkit"] = `+${toolkitPenalty}`; }
    const learningPenalty = extractNumber(html, "learning") ? diff + toolkitPenalty : 0;
    if (learningPenalty) { penaltySources["Beginner's Luck"] = `+${learningPenalty}`; }
    

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
    if (wildForks) { dieSources["Wild FoRKs"] = `+${wildForks}`; }
    if (circlesBonus.sum) { dieSources = { ...dieSources, ...circlesBonus.entries}; }
    if (tax) { dieSources.Tax = `-${tax}`; }
    if (cashDice) { dieSources.Cash = `+${cashDice}`; }
    if (fundDice) { dieSources.Funds = `+${fundDice}`; }
    if (miscDice) { dieSources = { ...dieSources, ...miscDice.entries }; }
    if (splitPool) { dieSources["Secondary Pool"] = `-${splitPool}`; }

    const diceTotal = aDice + bDice + miscDice.sum + exponent - woundDice + forks - tax + circlesBonus.sum + cashDice + fundDice - splitPool;
    const difficultyDice = bDice + miscDice.sum + exponent + wildForks + forks - woundDice - tax + circlesBonus.sum + cashDice + fundDice - splitPool;

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
        difficultyGroup: helpers.difficultyGroup(difficultyDice, obstacleTotal),
        cashDice,
        fundDice,
        splitPool
    };
}

export async function rollWildFork(numDice: number, shade: helpers.ShadeString = 'B'): Promise<Die | undefined> {
    if (numDice <= 0) {
        return;
    }
    const tgt = shade === 'B' ? 3 : (shade === 'G' ? 2 : 1);
    const die = new AstrologyDie({ diceNumber: numDice, target: tgt });
    die.evaluate();
    // die.explode([6,1]);
    // die.countSuccess(tgt, ">");
    if (game.dice3d) {
        game.dice3d.show({
            throws: {
                dice: die.results.map(r => {
                    return {
                        result: r.result,
                        resultLabel: r.result,
                        type: "d6",
                        vectors: [],
                        options: {}
                    };
                })
            }
        });
    }
    return new Promise(r => r(die));
}

export async function getSplitPoolText(numDice: number, open: boolean, shade: helpers.ShadeString): Promise<string> {
    if (numDice <= 0 ) return "";
    
    const roll = await rollDice(numDice, open, shade);
    if (roll) {
        const parentDiv = document.createElement('div');

        const textDiv = helpers.DivOfText("Secondary Successes", );
        const resultDiv = helpers.DivOfText(`${roll.result}`, "secondary-pool");
        const diceDiv = document.createElement('div');
        diceDiv.className = "secondary-dice";
        roll.dice[0].results.forEach(r => {
            const diceResult = helpers.DivOfText(r.result, "roll-die");
            diceResult.dataset.success = r.success? "true" : "false";
            diceDiv.appendChild(diceResult);
        });
        parentDiv.appendChild(textDiv);
        parentDiv.appendChild(resultDiv);
        parentDiv.appendChild(diceDiv);
        return parentDiv.innerHTML; 
    }
    return "";
}

export function mergeDialogData<T extends RollDialogData>(target: T, source?: Partial<T>): T {
    if (!source) {
        return target;
    }
    if (source.optionalDiceModifiers) {
        source.optionalDiceModifiers.concat(...target.optionalDiceModifiers || []);
    }
    if (source.optionalObModifiers) {
        source.optionalObModifiers.concat(...target.optionalObModifiers || []);
    }
    if (source.diceModifiers) {
        source.diceModifiers.concat(...target.diceModifiers || []);
    }
    if (source.obModifiers) {
        source.obModifiers.concat(...target.obModifiers || []);
    }
    return Object.assign(target, source);
}

export function mergePartials<T extends RollDialogData>(target: Partial<T>, source?: Partial<T>): Partial<T> {
    if (!source) {
        return target;
    }
    if (source.optionalDiceModifiers && target.optionalDiceModifiers) {
        source.optionalDiceModifiers.concat(...target.optionalDiceModifiers as RollModifier[]);
    }
    if (source.optionalObModifiers && target.optionalDiceModifiers) {
        source.optionalObModifiers.concat(...target.optionalObModifiers as RollModifier[]);
    }
    if (source.diceModifiers && target.diceModifiers) {
        source.diceModifiers.concat(...target.diceModifiers as RollModifier[]);
    }
    if (source.obModifiers && target.obModifiers) {
        source.obModifiers.concat(...target.obModifiers as RollModifier[]);
    }

    return Object.assign(target, source);
}

export class AstrologyDie extends Die {
    constructor({ diceNumber, target }: { diceNumber: number, target: number}) {
        super({ 
            number: diceNumber,
            faces: 6,
            modifiers: [
                "x",
                `cs>=${target}`,
                "df"
            ],
            options: {}
        });
    }
    explode(_modifier: string): void {
        let checked = 0;
        while ( checked < this.results.length ) {
            const r = this.results[checked];
            checked++;
            if (!r.active) continue;
      
            if (r.result === 1 || r.result === 6) {
                r.exploded = true;
                this.roll();
            }
        }
    }
}

export interface RollData {
    /** Difficulty of test before modifiers */
    baseDifficulty: number;
    /** Total number of dice rolled normally. Includes artha, not wild forks. */
    diceTotal: number;
    /** Total number of dice that count for test difficulty. Includes wild forks, not artha */
    difficultyDice: number;
    /** Total modified test obstacle */
    difficultyTotal: number;
    /** Obstacle counted towards test difficulty */
    difficultyTestTotal: number;
    /** Number of wild forks used in test */
    wildForks: number;
    /** Collection of sources of die number modifiers */
    dieSources: { [s:string]: string };
    /** Collection of sources of obstacle modifiers */
    obSources: { [s:string]: string };
    /** String representing difficulty class of the test */
    difficultyGroup: helpers.TestString;
    /** Number of cash dice spent for test */
    cashDice: number;
    /** Number of fund dice spent for test */
    fundDice: number;
    /** Number of dice split to a secondary pool */
    splitPool: number;
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
    obModifiers?: RollModifier[];
    optionalDiceModifiers?: RollModifier[];
    optionalObModifiers?: RollModifier[];
    offerSplitPool?: boolean;
}

export interface RollChatMessageData {
    name: string;
    successes: string;
    difficulty: number;
    specialPenalty?: { name: string, amount: number };
    success: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rolls: any[]; //{success: boolean, roll: number}[];
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

export interface EventHandlerOptions {
    target: HTMLElement;
    sheet: BWActorSheet;
    extraInfo?: string;
    dataPreset?: Partial<RollDialogData>;
    onRollCallback?: () => Promise<unknown>;
}

export interface RollOptions {
    extraInfo?: string;
    dataPreset?: Partial<RollDialogData>;
    onRollCallback?: () => Promise<unknown>;
}