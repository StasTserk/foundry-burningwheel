import { BWActor, NewItemData } from "./bwactor.js";
import { BWActorSheet } from "./bwactor-sheet.js";
import * as constants from "./constants.js";
import * as helpers from "./helpers.js";
import {
    ArmorRootData,
    MeleeWeaponData,
    Skill,
    SkillDataRoot,
    TraitDataRoot,
    ReputationDataRoot,
    RelationshipData,
    MeleeWeaponRootData,
    RangedWeaponRootData,
    SpellDataRoot,
    Trait,
} from "./items/item.js";
import { handleRollable } from "./rolls/rolls.js";
import { CharacterBurnerDialog } from "./dialogs/character-burner.js";
import { addNewItem } from "./dialogs/importItemDialog.js";
import { BWCharacter } from "./character.js";

export class BWCharacterSheet extends BWActorSheet {
    actor: BWActor & BWCharacter;
    
    getData(): CharacterSheetData {
        const data = super.getData() as CharacterSheetData;
        const woundDice = this.actor.data.data.ptgs.woundDice;
        const items = Array.from(data.items.values()) as unknown as ItemData[];

        const beliefs: ItemData[] = [];
        const instincts: ItemData[] = [];
        const traits: ItemData[] = [];
        const skills: SkillDataRoot[] = [];
        const training: SkillDataRoot[] = [];
        const learning: SkillDataRoot[] = [];
        const relationships: ItemData<RelationshipData>[] = [];
        const equipment: ItemData[] = [];
        const melee: MeleeWeaponRootData[] = [];
        const ranged: RangedWeaponRootData[] = [];
        const armor: ArmorRootData[] = [];
        const reps: ReputationDataRoot[] = [];
        const affs: ItemData[] = [];
        const spells: SpellDataRoot[] = [];

        let addFist = true; // do we need to add a fist weapon?
        for (const i of items) {
            switch(i.type) {
                case "reputation": reps.push(i); break;
                case "affiliation": affs.push(i); break;
                case "belief": beliefs.push(i); break;
                case "instinct": instincts.push(i); break;
                case "trait": traits.push(i); break;
                case "skill":
                    (i as SkillDataRoot).data.learning ? learning.push(i as SkillDataRoot) : (
                        (i as SkillDataRoot).data.training ? training.push(i as SkillDataRoot) : skills.push(i as SkillDataRoot));
                    Skill.disableIfWounded.call(i, woundDice);
                    break;
                case "relationship": relationships.push(i as ItemData<RelationshipData>); break;
                case "melee weapon":
                    if (addFist && i.name === "Bare Fist") {
                        addFist = false; // only add one fist weapon if none present
                    } else {
                        equipment.push(i); // don't count fists as equipment
                    }
                    melee.push(i as MeleeWeaponRootData);
                    break;
                case "ranged weapon":
                    equipment.push(i);
                    ranged.push(i as RangedWeaponRootData);
                    break;
                case "armor":
                    equipment.push(i);
                    armor.push(i);
                    break;
                case "spell":
                    spells.push(i as SpellDataRoot);
                    break;
                default:
                    equipment.push(i);
            }
        }

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
        data.spells = spells;

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

    getArmorDictionary(armorItems: ItemData[]): { [key: string]: ItemData | null; } {
        let armorLocs: { [key: string]: ArmorRootData | null; } = {};
        constants.armorLocations.forEach(al => armorLocs[al] = null); // initialize locations
        armorItems.forEach(i =>
            armorLocs = { ...armorLocs, ...helpers.getArmorLocationDataFromItem(i as ArmorRootData)}
        );
        return armorLocs;
    }

    activateListeners(html: JQuery): void {
        // add/delete buttons

        const selectors = [
            'i[data-action="editItem"]',
            'i[data-action="delItem"]',
            'i[data-action="addAffiliation"]',
            'i[data-action="addRelationship"]',
            'i[data-action="addReputation"]',
            'i[data-action="addTrait"]',
            '*[data-action="addSkill"]',
        ];
        html.find(selectors.join(", ")).on("click", e => this._manageItems(e));

        // roll macros
        html.find("button.rollable").on("click",e => handleRollable(e, this));
        html.find("i[data-action=\"refresh-ptgs\"]").on("click",_e => this.actor.updatePtgs());
        html.find('*[data-action="learn-skill"]').on("click",e => this.learnNewSkill(e, this.actor));
        html.find('label.character-burner-icon').on("click", _e => CharacterBurnerDialog.Open(this.actor));
        super.activateListeners(html);
    }

    async learnNewSkill(e: JQuery.ClickEvent, actor: BWActor): Promise<Application> {
        e.preventDefault();
        return addNewItem({
            actor: actor,
            searchTitle: "Learn New Skill",
            itemType: "skill",
            itemDataLeft: (i: Skill) => i.data.data.restrictions.titleCase(),
            itemDataMid: (i: Skill) => i.data.data.skilltype.titleCase(),
            baseData: {
                learning: true,
                root1: "perception",
                skilltype: "special"
            },
            forcedData: {
                learning: true
            }
        });
    }

    private async _manageItems(e: JQuery.ClickEvent) {
        e.preventDefault();
        const t = e.currentTarget as EventTarget;
        const action = $(t).data("action");
        const id = $(t).data("id") as string;
        let options: NewItemData;
        switch (action) {
            case "addRelationship":
                options = { name: "New Relationship", type: "relationship", data: { building: true }};
                return this.actor.createOwnedItem(options).then(i =>
                    this.actor.getOwnedItem(i._id)?.sheet.render(true));
            case "addReputation":
                options = { name: "New Reputation", type: "reputation", data: {}};
                return this.actor.createOwnedItem(options).then(i =>
                    this.actor.getOwnedItem(i._id)?.sheet.render(true));
            case "addAffiliation":
                options = { name: "New Affiliation", type: "affiliation", data: {}};
                return this.actor.createOwnedItem(options).then(i =>
                    this.actor.getOwnedItem(i._id)?.sheet.render(true));
            case "addSkill": 
                return addNewItem({
                    actor: this.actor,
                    searchTitle: "Add New Skill",
                    itemType: "skill",
                    itemDataLeft: (i: Skill) => i.data.data.restrictions.titleCase(),
                    itemDataMid: (i: Skill) => i.data.data.skilltype.titleCase(),
                    baseData: { root1: "perception", skilltype: "special" },
                    popupMessage: "Add a new skill to the character sheet."
                        + "Note this is different than learning a new skill via the beginner's luck rules."
                        + "Check the learning section if you want to begin learning the skill."
                });
            case "addTrait":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: "Add New Trait",
                    itemType: "trait",
                    itemDataLeft: (i: Trait) => i.data.data.restrictions.titleCase(),
                    itemDataMid: (i: Trait) => i.data.data.traittype.titleCase(),
                    baseData: { traittype: id }
                });
            case "delItem":
                return this.actor.deleteOwnedItem(id);
            case "editItem":
                return this.actor.getOwnedItem(id)?.sheet.render(true);
        }
        return null;
    }
}

function equipmentCompare(a: ItemData, b: ItemData): number {
    if (constants.equipmentSheetOrder[a.type] !== constants.equipmentSheetOrder[b.type]) {
        return constants.equipmentSheetOrder[a.type] > constants.equipmentSheetOrder[b.type] ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
}

function weaponCompare(a: ItemData, b: ItemData): number {
    if (a.name === "Bare Fist") {
        return -1;
    }
    if (b.name === "Bare Fist") {
        return 1;
    }
    return a.name.localeCompare(b.name);
}

const byName = (a: ItemData, b: ItemData) => a.name.localeCompare(b.name);

interface CharacterSheetData extends ActorSheetData {
    reputations: ItemData[];
    affiliations: ItemData[];
    equipment: ItemData[];
    melee: MeleeWeaponRootData[];
    fistStats: MeleeWeaponData;
    armor: { [key: string]: ItemData | null}; // armor/location dictionary
    ranged: RangedWeaponRootData[];
    relationships: ItemData<RelationshipData>[];
    beliefs: ItemData[];
    instincts: ItemData[];
    skills: SkillDataRoot[];
    learning: SkillDataRoot[];
    spells: SpellDataRoot[];
    training: SkillDataRoot[];
    traits: CharacterSheetTraits;
    systemVersion: string;
}

interface CharacterSheetTraits {
    character: ItemData[];
    die: ItemData[];
    callon: ItemData[];
}