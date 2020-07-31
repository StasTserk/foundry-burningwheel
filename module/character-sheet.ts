import { BWActor, NewItemData } from "./actor.js";
import { BWActorSheet } from "./bwactor-sheet.js";
import * as constants from "./constants.js";
import * as helpers from "./helpers.js";
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
    SkillDataRoot,
    Trait,
    TraitDataRoot,
} from "./items/item.js";
import { handleRollable } from "./rolls/rolls.js";

export class BWCharacterSheet extends BWActorSheet {
    getData(): CharacterSheetData {
        const data = super.getData() as CharacterSheetData;
        const woundDice = this.actor.data.data.ptgs.woundDice;
        const beliefs: Belief[] = [];
        const instincts: Instinct[] = [];
        const traits: Trait[] = [];
        const items = data.items;
        const skills: Skill[] = [];
        const training: Skill[] = [];
        const learning: Skill[] = [];
        const relationships: Relationship[] = [];
        const equipment: Item[] = [];
        const melee: MeleeWeapon[] = [];
        const ranged: RangedWeapon[] = [];
        const armor: Armor[] = [];
        const reps: Item[] = [];
        const affs: Item[] = [];
        let addFist = true; // do we need to add a fist weapon?
        for (const i of items) {
            switch(i.type) {
                case "reputation": reps.push(i); break;
                case "affiliation": affs.push(i); break;
                case "belief": beliefs.push(i as Belief); break;
                case "instinct": instincts.push(i as Instinct); break;
                case "trait": traits.push(i as Trait); break;
                case "skill":
                    (i as any).data.learning ? learning.push(i as Skill) : (
                        (i as any).data.training ? training.push(i as Skill) : skills.push(i as Skill));
                    Skill.disableIfWounded.bind(i)(woundDice);
                    break;
                case "relationship": relationships.push(i as Relationship); break;
                case "melee weapon":
                    if (addFist && i.name === "Bare Fist") {
                        addFist = false; // only add one fist weapon if none present
                    } else {
                        equipment.push(i); // don't count fists as equipment
                    }
                    melee.push(i as MeleeWeapon);
                    break;
                case "ranged weapon":
                    equipment.push(i);
                    ranged.push(i as RangedWeapon);
                    break;
                case "armor":
                    equipment.push(i);
                    armor.push(i);
                    break;
                default:
                    equipment.push(i);
            }
        }

        this._maybeInitializeActor();

        data.beliefs = beliefs;
        data.instincts = instincts;
        data.skills = skills.sort(byName);
        data.learning = learning.sort(byName);
        data.training = training.sort(byName);
        data.relationships = relationships.sort(byName);
        data.equipment = equipment.sort(equipmentCompare);
        data.melee = melee.sort(weaponCompare);
        data.armor = this.getArmorDictionary(armor);
        data.ranged = ranged.sort(weaponCompare);
        data.reputations = reps;
        data.affiliations = affs;

        const traitLists: CharacterSheetTraits = { character: [], die: [], callon: [] };

        if (traits.length !== 0) {
            traits.forEach((trait) => {
                switch ((trait as unknown as TraitDataRoot).data.traittype) {
                    case "character": traitLists.character.push(trait); break;
                    case "die": traitLists.die.push(trait); break;
                    default: traitLists.callon.push(trait); break;
                }
            });
        }
        data.traits = traitLists;
        data.systemVersion = game.system.data.version;
        return data;
    }

    async _maybeInitializeActor() {
        const initialized = await this.actor.getFlag("burningwheel", "initialized") as boolean;
        if (initialized) {
            return;
        }
        await this.actor.setFlag("burningwheel", "initialized", true);
        await this.addDefaultItems();
        return this.actor.createOwnedItem(constants.bareFistData);
    }

    getArmorDictionary(armorItems: Item[]): { [key: string]: Item | null; } {
        let armorLocs: { [key: string]: Armor | null; } = {};
        constants.armorLocations.forEach(al => armorLocs[al] = null); // initialize locations
        armorItems.forEach(i =>
            armorLocs = { ...armorLocs, ...helpers.getArmorLocationDatafromItem(i as unknown as ArmorRootData)} as any
        );
        return armorLocs;
    }

    activateListeners(html: JQuery) {
        // add/delete buttons

        const selectors = [
            ".trait-category i",
            ".rollable > .collapsing-section > i",
            ".learning > i",
            ".relationship-section h2 > i",
            ".relationship > i",
            ".reputation > i",
            ".affiliation > i",
            ".gear > div > i",
            ".training-skill > div > i",
            ".setting-item-row > div > i"
        ];
        html.find(selectors.join(", ")).click(e => this._manageItems(e));

        // roll macros
        html.find("button.rollable").click(e => handleRollable(e, this));
        html.find("i[data-action=\"refresh-ptgs\"]").click(e => this.actor.updatePtgs());
        html.find('*[data-action="learn-skill"]').click(e => this.learnNewSkill(e, this.actor));
        super.activateListeners(html);
    }

    async learnNewSkill(e: JQuery.ClickEvent, actor: BWActor) {
        e.preventDefault();

        const loadExistingCallback = async (_html) => {
            const skills = (await helpers.getItemsOfType("skill"))
                .sort((a, b) => a.name < b.name ? -1 : (a.name === b.name ? 0 : 1));

            // cache the current list of skills since it'll be used after for the actual skill data
            (game as any).burningwheel.skills = skills;
            console.log(skills);
            const html = await renderTemplate("systems/burningwheel/templates/chat/new-skill-dialog.html", { skills });
            const dialog = new Dialog({
                title: "Pick a new skill to learn",
                content: html,
                buttons: {
                    add: {
                        label: "Add",
                        callback: (dialogHtml: JQuery) => {
                            const skillData: SkillDataRoot[] = [];
                            dialogHtml.find('input:checked')
                                .each((_, element: HTMLInputElement) => {
                                    const skillRoot: SkillDataRoot = (game as any).burningwheel.skills
                                        .find((s: Skill) => s._id === element.value).data;
                                    skillRoot.data.learning = true;
                                    skillData.push(skillRoot);
                                    actor.createOwnedItem(skillRoot, {});
                                });
                        }
                    },
                    cancel: {
                        label: "Cancel"
                    }
                }
            });
            dialog.render(true);
        };

        return new Dialog({
            title: "Learn new Skill",
            buttons: {
                makeNew: {
                    label: "Make new skill",
                    callback: async () => {
                        const i = await actor.createOwnedItem({
                            name: "New Skill",
                            type: "skill",
                            data: {
                                learning: true,
                                root1: "perception",
                                skilltype: "special"
                            }
                        });
                        return this.actor.getOwnedItem(i._id)!.sheet.render(true);
                    }
                },
                loadExisting: {
                    label: "Load existing skill",
                    callback: (html) => loadExistingCallback(html)
                }
            }
        }).render(true);
    }

    private async _manageItems(e: JQuery.ClickEvent) {
        e.preventDefault();
        const t = event!.currentTarget as EventTarget;
        const action = $(t).data("action");
        const id = $(t).data("id") as string;
        let options: NewItemData;
        switch (action) {
            case "addRelationship":
                options = { name: "New Relationship", type: "relationship", data: { building: true }};
                return this.actor.createOwnedItem(options).then(i =>
                    this.actor.getOwnedItem(i._id)!.sheet.render(true));
            case "addReputation":
                options = { name: "New Reputation", type: "reputation", data: {}};
                return this.actor.createOwnedItem(options).then(i =>
                    this.actor.getOwnedItem(i._id)!.sheet.render(true));
            case "addAffiliation":
                options = { name: "New Affiliation", type: "affiliation", data: {}};
                return this.actor.createOwnedItem(options).then(i =>
                    this.actor.getOwnedItem(i._id)!.sheet.render(true));
            case "addTrait":
                options = { name: `New ${id.titleCase()} Trait`, type: "trait", data: { traittype: id }};
                return this.actor.createOwnedItem(options).then(i =>
                    this.actor.getOwnedItem(i._id)!.sheet.render(true));
            case "delItem":
                return this.actor.deleteOwnedItem(id);
            case "editItem":
                return this.actor.getOwnedItem(id)!.sheet.render(true);
        }
        return null;
    }

    async addDefaultItems() {
        return this.actor.createOwnedItem({ name: "Instinct 1", type: "instinct", data: {}})
            .then(() => this.actor.createOwnedItem({ name: "Instinct 2", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Instinct 3", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Instinct Special", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 1", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 2", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 3", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief Special", type: "belief", data: {}}));
    }
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
    reputations: Item[];
    affiliations: Item[];
    equipment: Item[];
    melee: MeleeWeapon[];
    fistStats: MeleeWeaponData;
    armor: { [key: string]: Item | null}; // armor/location dictionary
    ranged: RangedWeapon[];
    relationships: Relationship[];
    beliefs: Belief[];
    instincts: Instinct[];
    skills: Skill[];
    learning: Skill[];
    training: Skill[];
    traits: CharacterSheetTraits;
    systemVersion: string;
}

interface CharacterSheetTraits {
    character: Trait[];
    die: Trait[];
    callon: Trait[];
}