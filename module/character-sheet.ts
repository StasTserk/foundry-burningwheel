import { TracksTests } from "./actor.js";
import { BWActorSheet } from "./bwactor-sheet.js";
import * as constants from "./constants.js";
import {
    Armor,
    ArmorRootData,
    Belief,
    Instinct,
    MeleeWeapon,
    MeleeWeaponData,
    RangedWeapon,
    Relationship,
    Skill,
    Trait
} from "./items/item.js";
import { handleRollable } from "./rolls.js";

export class BWCharacterSheet extends BWActorSheet {
    getData(): CharacterSheetData {
        const data = super.getData() as CharacterSheetData;
        const beliefs = [];
        const instincts = [];
        const traits: Trait[] = [];
        const items = data.items;
        const skills: Skill[] = [];
        const training: Skill[] = [];
        const relationships: Relationship[] = [];
        const equipment: Item[] = [];
        const melee: MeleeWeapon[] = [];
        const ranged: RangedWeapon[] = [];
        const armor: Armor[] = [];
        let addFist = true; // do we need to add a fist weapon?
        for (const i of items) {
            switch(i.type) {
                case "belief": beliefs.push(i as Belief); break;
                case "instinct": instincts.push(i as Instinct); break;
                case "trait": traits.push(i as Trait); break;
                case "skill": (i as any).data.learning ? training.push(i) : skills.push(i); break;
                case "relationship": relationships.push(i as Relationship); break;
                case "melee weapon":
                    if (addFist && i.name === "Bare Fist") {
                        addFist = false; // only add one fist weapon if none present
                    } else {
                        equipment.push(i); // don't count fists as equipment
                    }
                    melee.push(i);
                    break;
                case "ranged weapon":
                    equipment.push(i)
                    ranged.push(i);
                    break;
                case "armor":
                    equipment.push(i);
                    armor.push(i);
                    break;
                default:
                    equipment.push(i);
            }
        }

        if (beliefs.length === 0 && instincts.length === 0) {
            console.log("adding default beliefs");
            this.addDefaultItems();
        }

        if (addFist) {
            // we need to add the default fist weapon to weapons list
            this.actor.createOwnedItem(constants.bareFistData).then(i => data.melee.push(i));
        }

        data.beliefs = beliefs;
        data.instincts = instincts;
        data.skills = skills.sort(byName);
        data.training = training.sort(byName);
        data.relationships = relationships.sort(byName);
        data.equipment = equipment.sort(equipmentCompare);
        data.melee = melee.sort(weaponCompare);
        data.armor = this.getArmorDictionary(armor);
        data.ranged = ranged.sort(weaponCompare);

        const traitLists = { character: [], die: [], callon: [] } as CharacterSheetTraits;

        if (traits.length !== 0) {
            traits.forEach((trait) => {
                switch (trait.data.traittype) {
                    case "character": traitLists.character.push(trait); break;
                    case "die": traitLists.die.push(trait); break;
                    default: traitLists.callon.push(trait); break;
                }
            });
        }
        data.traits = traitLists;
        return data;
    }

    getArmorDictionary(armorItems: Item[]): { [key: string]: Item; } {
        const armorLocs: { [key: string]: Armor; } = {};
        constants.armorLocations.forEach(al => armorLocs[al] = null); // initialize locations
        armorItems.forEach(i => armorLocs[(i as any as ArmorRootData).data.location] = i);
        return armorLocs;
    }

    activateListeners(html: JQuery) {
        // add/delete buttons

        const selectors = [
            ".trait-category i",
            ".rollable > .collapsing-section > i",
            ".learning > i",
            ".relationships > h2 > i",
            ".relationship > i",
            ".gear > div > i"
        ];
        html.find(selectors.join(", ")).click(e => this._manageItems(e));

        // roll macros
        html.find("button.rollable").click(e => this._handleRollable(e));
        super.activateListeners(html);
    }

    private async _handleRollable(e: JQuery.ClickEvent<HTMLElement, null, HTMLElement, HTMLElement>): Promise<unknown> {
        const target = e.currentTarget as HTMLButtonElement;

        if (target.dataset.rollType === "skill") {
            return handleRollable(e, this);
        }
        let skill: TracksTests;
        if (target.dataset.accessor) {
            skill = getProperty(this.actor.data, target.dataset.accessor);
        } else {
            skill = (this.actor.getOwnedItem(target.dataset.skillId) as Skill).data.data;
        }
        const template = "systems/burningwheel/templates/chat/roll-dialog.html";
        const templateData = {
            name: target.dataset.rollableName,
            difficulty: 3,
            bonusDice: 0,
            arthaDice: 0,
            woundDice: this.actor.data.data.ptgs.woundDice,
            obPenalty: this.actor.data.data.ptgs.obPenalty,
            skill
        };
        const html = await renderTemplate(template, templateData);
        const speaker = ChatMessage.getSpeaker({actor: this.actor})
        return new Promise(_resolve =>
            new Dialog({
                title: "Roll Test",
                content: html,
                buttons: {
                    roll: {
                        label: "Roll",
                        callback: async (dialogHtml: JQuery<HTMLElement>) =>
                            rollCallback(
                                dialogHtml,
                                skill,
                                templateData.name,
                                templateData.woundDice,
                                templateData.obPenalty,
                                speaker)
                    }
                }
            }).render(true)
        );
    }

    private async _manageItems(e: JQuery.ClickEvent) {
        e.preventDefault();
        const t = event.currentTarget;
        const action = $(t).data("action");
        const id = $(t).data("id") as string;
        let options = {};
        switch (action) {
            case "addRelationship":
                options = { name: "New Relationship", type: "relationship", data: { building: true }};
                return this.actor.createOwnedItem(options).then(i => this.actor.getOwnedItem(i._id).sheet.render(true));
            case "addTrait":
                options = { name: `New ${id.titleCase()} Trait`, type: "trait", data: { traittype: id }};
                return this.actor.createOwnedItem(options).then(i => this.actor.getOwnedItem(i._id).sheet.render(true));
            case "delItem":
                return this.actor.deleteOwnedItem(id);
            case "editItem":
                return this.actor.getOwnedItem(id).sheet.render(true);
        }
        return null;
    }

    async addDefaultItems() {
        return this.actor.createOwnedItem({ name: "Instinct 1", type: "instinct", data: {}})
            .then(() => this.actor.createOwnedItem({ name: "Instinct 2", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Instinct 3", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Instinct Speceial", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 1", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 2", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 3", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief Special", type: "belief", data: {}}))
    }
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

async function rollCallback(
    dialogHtml: JQuery<HTMLElement>,
    rollableData: TracksTests,
    rollName: string,
    woundDice: number,
    obPenalty: number,
    speaker: unknown) {

    const diff = parseInt(dialogHtml.find("input[name=\"difficulty\"]").val() as string, 10);
    const bDice = parseInt(dialogHtml.find("input[name=\"bonusDice\"]").val() as string, 10);
    const aDice = parseInt(dialogHtml.find("input[name=\"arthaDice\"]").val() as string, 10);
    const exp = parseInt(rollableData.exp, 10);
    const mTemplate = "systems/burningwheel/templates/chat/roll-message.html";
    const roll = new Roll(`${exp+bDice+aDice-woundDice}d6cs>3`).roll();
    const data = {
        name: rollName,
        successes: roll.result,
        difficulty: diff,
        obPenalty,
        success: parseInt(roll.result, 10) >= (diff + obPenalty),
        rolls: roll.dice[0].rolls,
        difficultyGroup: difficultyGroup(exp + bDice - woundDice, diff)
    }

    const messageHtml = await renderTemplate(mTemplate, data)
    return ChatMessage.create({
        content: messageHtml,
        speaker
    });
}

function equipmentCompare(a: Item, b: Item): number {
    if (constants.equipmentSheetOrder[a.type] !== constants.equipmentSheetOrder[b.type]) {
        return constants.equipmentSheetOrder[a.type] > constants.equipmentSheetOrder[b.type] ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
}

function weaponCompare(a: Item, b: Item): number {
    if (a.name === "Bare Fist") {
        return -1;
    }
    if (b.name === "Bare Fist") {
        return 1;
    }
    return a.name.localeCompare(b.name);
}

const byName = (a: Item, b: Item) => a.name.localeCompare(b.name);

interface CharacterSheetData extends ActorSheetData {
    equipment: Item[];
    melee: MeleeWeapon[];
    fistStats: MeleeWeaponData;
    armor: { [key: string]: Item }; // armor/location dictionary
    ranged: RangedWeapon[];
    relationships: Relationship[];
    beliefs: Belief[];
    instincts: Instinct[];
    skills: Skill[];
    training: Skill[];
    traits: CharacterSheetTraits;
}

interface CharacterSheetTraits {
    character: Trait[];
    die: Trait[];
    callon: Trait[];
}