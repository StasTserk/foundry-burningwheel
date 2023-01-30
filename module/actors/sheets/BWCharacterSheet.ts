import { NewItemData } from "../BWActor.js";
import { ActorSheetOptions, BaseActorSheetData, BWActorSheet } from "./BWActorSheet.js";
import * as constants from "../../constants.js";
import { handleRollable } from "../../rolls/rolls.js";
import { CharacterBurnerDialog } from "../../dialogs/CharacterBurnerDialog.js";
import { addNewItem } from "../../dialogs/ImportItemDialog.js";
import { BWCharacter, BWCharacterData } from "../BWCharacter.js";
import { byName } from "../../helpers.js";
import { Armor } from "../../items/armor.js";
import { MeleeWeapon } from "../../items/meleeWeapon.js";
import { RangedWeapon } from "../../items/rangedWeapon.js";
import { Relationship } from "../../items/relationship.js";
import { Reputation } from "../../items/reputation.js";
import { SkillData, Skill } from "../../items/skill.js";
import { Spell } from "../../items/spell.js";
import { Trait } from "../../items/trait.js";
import { BWItem } from "../../items/item.js";
import { TypeMissing } from "../../../types/index.js";

export class BWCharacterSheet extends BWActorSheet<CharacterSheetData, BWCharacter, ActorSheetOptions> {
    get actor(): BWCharacter {
        return super.actor as BWCharacter;
    }

    static get defaultOptions(): ActorSheetOptions {
        const options = super.defaultOptions as ActorSheetOptions;
        options.draggableItemSelectors = [
            '.skills > .rollable',
            '.learning-section > .learning',
            '.spell-section > .spell-section-item',
            '.relationships > .relationship',
            '.reputations > .reputation',
            '.affiliations > .affiliation',
            '.gear > div',
            '.trait-category > .trait',
            '.bits-artha'
        ];
        options.draggableMeleeSelectors = [
            '.weapon-grid .rollable',
            '.weapon-grid > .weapon-name'
        ];
        options.draggableRangedSelectors = [
            '.ranged-grid .rollable',
            '.ranged-grid > .weapon-name'
        ];

        options.draggableStatSelectors = [
            '.stats > .rollable',
            '.attributes > .rollable'
        ];
        
        return options;
    }
    
    getData(): CharacterSheetData {
        const data = super.getData() as CharacterSheetData;
        const woundDice = this.actor.system.ptgs.woundDice;
        const items = this.actor.items.values();

        const beliefs: BWItem[] = [];
        const instincts: BWItem[] = [];
        const traits: BWItem[] = [];
        const skills: Skill[] = [];
        const training: Skill[] = [];
        const learning: Skill[] = [];
        const relationships: Relationship[] = [];
        const equipment: BWItem[] = [];
        const melee: MeleeWeapon[] = [];
        const ranged: RangedWeapon[] = [];
        const armor: Armor[] = [];
        const reps: Reputation[] = [];
        const affs: BWItem[] = [];
        const spells: Spell[] = [];

        for (const i of items) {
            switch(i.type) {
                case "reputation": reps.push(i as Reputation); break;
                case "affiliation": affs.push(i); break;
                case "belief": beliefs.push(i); break;
                case "instinct": instincts.push(i); break;
                case "trait": traits.push(i); break;
                case "skill":
                    const s = i.system as SkillData;
                    if (s.learning) {
                        learning.push(i as Skill);
                    } else if (s.training) {
                        training.push(i as Skill);
                    } else {
                        skills.push(i as Skill);
                    }
                    Skill.disableIfWounded.call(i, woundDice);
                    break;
                case "relationship": relationships.push(i as Relationship); break;
                case "melee weapon":
                    if (!(i.name === "Bare Fist" || i.name === game.i18n.localize('BW.weapon.bareFist'))) {
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
                    armor.push(i as Armor);
                    break;
                case "spell":
                    spells.push(i as Spell);
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
        data.reputations = reps.sort(byName);
        data.affiliations = affs.sort(byName);
        data.spells = spells.sort(byName);

        const traitLists: CharacterSheetTraits = { character: [], die: [], callon: [] };

        if (traits.length !== 0) {
            traits.forEach((trait: Trait) => {
                switch (trait.system.traittype) {
                    case "character": traitLists.character.push(trait); break;
                    case "die": traitLists.die.push(trait); break;
                    default: traitLists.callon.push(trait); break;
                }
            });
            traitLists.callon.sort(byName);
            traitLists.character.sort(byName);
            traitLists.die.sort(byName);
        }
        data.traits = traitLists;
        data.systemVersion = (game.system as TypeMissing).version;
        return data;
    }

    activateListeners(html: JQuery): void {
        // add/delete buttons
        const selectors = [
            '.bits-item .bits-item-name[data-action="editItem"]',
            'i[data-action="editItem"]',
            'i[data-action="delItem"]',
            'i[data-action="addAffiliation"]',
            'i[data-action="addRelationship"]',
            'i[data-action="addReputation"]',
            'i[data-action="addBelief"]',
            'i[data-action="addInstinct"]',
            'i[data-action="addTrait"]',
            '*[data-action="addSkill"]',
            '*[data-action="addSpell"]',
            '*[data-action="learnSpell"]',
            '*[data-action="addGear"]',
            '*[data-action="broadcast"]'
        ];
        html.find(selectors.join(", ")).on("click", e => this._manageItems(e));

        // roll macros
        html.find("button.rollable").on("click",e => handleRollable(e, this));
        html.find("i[data-action=\"refresh-ptgs\"]").on("click",_e => this.actor.updatePtgs());
        html.find('*[data-action="learn-skill"]').on("click",e => this.learnNewSkill(e, this.actor));
        html.find('label.character-burner-icon').on("click", _e => CharacterBurnerDialog.Open(this.actor));

        super.activateListeners(html);
    }

    async learnNewSkill(e: JQuery.ClickEvent, actor: BWCharacter): Promise<unknown> {
        e.preventDefault();
        return addNewItem({
            actor: actor,
            searchTitle: game.i18n.format("BW.character.learnNew", {type: game.i18n.localize("ITEM.TypeSkill")}),
            itemType: "skill",
            itemDataLeft: (i: Skill) => i.system.restrictions.titleCase(),
            itemDataMid: (i: Skill) => game.i18n.localize(`BW.skill.${i.system.skilltype}`),
            baseData: {
                learning: true,
                root1: "perception",
                skilltype: "special",
                img: constants.defaultImages.skill
            },
            forcedData: {
                learning: true
            },
            img: constants.defaultImages.skill
        });
    }

    private async _manageItems(e: JQuery.ClickEvent) {
        e.preventDefault();
        const t = e.currentTarget as EventTarget;
        const action = $(t).data("action");
        const id = $(t).data("id") as string;
        let options: NewItemData;
        switch (action) {
            case "broadcast": 
                const item = this.actor.items.get(id);
                if (item) {
                    return item.generateChatMessage(this.actor);
                }
                break;
            case "addBelief":
                options = {
                    name: game.i18n.format("BW.newItem", { type: game.i18n.localize("ITEM.TypeBelief") }),
                    type: "belief",
                    data: {},
                    img: constants.defaultImages.belief
                };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i =>
                    this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addInstinct":
                options = {
                    name: game.i18n.format("BW.newItem", { type: game.i18n.localize("ITEM.TypeInstinct") }),
                    type: "instinct",
                    data: {},
                    img: constants.defaultImages.instinct
                };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i =>
                    this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addRelationship":
                options = {
                    name: game.i18n.format("BW.newItem", { type: game.i18n.localize("ITEM.TypeRelationship") }),
                    type: "relationship",
                    data: { building: true },
                    img: constants.defaultImages.relationship
                };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i =>
                    this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addReputation":
                options = {
                    name: game.i18n.format("BW.newItem", { type: game.i18n.localize("ITEM.TypeReputation") }),
                    type: "reputation",
                    data: {},
                    img: constants.defaultImages.reputation
                };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i =>
                    this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addAffiliation":
                options = {
                    name: game.i18n.format("BW.newItem", { type: game.i18n.localize("ITEM.TypeAffiliation") }),
                    type: "affiliation",
                    data: {},
                    img: constants.defaultImages.affiliation
                };
                return this.actor.createEmbeddedDocuments("Item", [options]).then(i =>
                    this.actor.items.get(i[0].id)?.sheet?.render(true));
            case "addSkill": 
                return addNewItem({
                    actor: this.actor,
                    searchTitle: game.i18n.format("BW.character.addNew", {type: game.i18n.localize("ITEM.TypeSkill")}),
                    itemType: "skill",
                    itemDataLeft: (i: Skill) => i.system.restrictions.titleCase(),
                    itemDataMid: (i: Skill) => game.i18n.localize(`BW.skill.${i.system.skilltype}`),
                    baseData: { root1: "perception", skilltype: "special" },
                    popupMessage: game.i18n.localize("BW.dialog.addSkillTooltip"),
                    img: constants.defaultImages.skill
                });
            case "addTrait":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: game.i18n.format("BW.character.addNew", {type: game.i18n.localize("ITEM.TypeTrait")}),
                    itemType: "trait",
                    itemDataLeft: (i: Trait) => i.system.restrictions.titleCase(),
                    itemDataMid: (i: Trait) => game.i18n.localize(`BW.trait.${i.system.traittype}`),
                    baseData: { traittype: id },
                    img: constants.defaultImages[id]
                });
            case "addSpell":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: game.i18n.format("BW.character.addNew", {type: game.i18n.localize("ITEM.TypeSpell")}),
                    itemType: "spell",
                    itemDataLeft: (i: Spell) => `${game.i18n.localize("BW.spell.origin")}: ${i.system.origin.titleCase()}`,
                    itemDataMid: (i: Spell) => `${game.i18n.localize("BW.spell.impetus")}: ${i.system.impetus.titleCase()}`,
                    baseData: { },
                    img: constants.defaultImages.spell
                });
            case "learnSpell":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: game.i18n.format("BW.character.addNew", {type: game.i18n.localize("ITEM.TypeSpell")}),
                    itemType: "spell",
                    itemDataLeft: (i: Spell) => `${game.i18n.localize("BW.spell.origin")}: ${i.system.origin.titleCase()}`,
                    itemDataMid: (i: Spell) => `${game.i18n.localize("BW.spell.impetus")}: ${i.system.impetus.titleCase()}`,
                    baseData: { inPracticals: true },
                    forcedData: {
                        inPracticals: true
                    },
                    img: constants.defaultImages.spell
                });
            case "addGear":
                return addNewItem({
                    actor: this.actor,
                    searchTitle: game.i18n.format("BW.character.addNew", {type: game.i18n.localize("BW.character.gear")}),
                    itemTypes: ["melee weapon", "ranged weapon", "armor", "possession", "property" ],
                    itemDataLeft: (_: Item) => "",
                    itemDataMid: (i: Item) =>
                        game.i18n.localize('BW.type')
                        + ": "
                        + game.i18n.localize(`ITEM.Type${i.type.titleCase()}`),
                    baseData: { traittype: id },
                    img: constants.defaultImages[id]
                });
            case "delItem":
                return Dialog.confirm({
                    title: game.i18n.localize("BW.dialog.confirmDelete"),
                    content: `<p>${game.i18n.localize("BW.dialog.confirmDeleteTooltip")}</p>`,
                    yes: () => this.actor.deleteEmbeddedDocuments("Item", [id]),
                    no: () => void 0
                });
                
            case "editItem":
                return this.actor.items.get(id)?.sheet?.render(true);
        }
        return null;
    }
}

function equipmentCompare(a: BWItem, b: BWItem): number {
    if (constants.equipmentSheetOrder[a.type] !== constants.equipmentSheetOrder[b.type]) {
        return constants.equipmentSheetOrder[a.type] > constants.equipmentSheetOrder[b.type] ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
}

function weaponCompare(a: { name: string }, b: { name: string }): number {
    const fistName = game.i18n.localize('BW.weapon.bareFist');
    if (a.name === "Bare Fist" || a.name === fistName) {
        return -1;
    }
    if (b.name === "Bare Fist" || b.name === fistName) {
        return 1;
    }
    return a.name.localeCompare(b.name);
}

interface CharacterSheetData extends BaseActorSheetData<BWCharacterData> {
    reputations: BWItem[];
    affiliations: BWItem[];
    equipment: BWItem[];
    melee: MeleeWeapon[];
    fistStats: MeleeWeapon;
    armor: { [key: string]: Armor | null}; // armor/location dictionary
    ranged: RangedWeapon[];
    relationships: Relationship[];
    beliefs: BWItem[];
    instincts: BWItem[];
    skills: Skill[];
    learning: Skill[];
    spells: Spell[];
    training: Skill[];
    traits: CharacterSheetTraits;
    systemVersion: string;
}

interface CharacterSheetTraits {
    character: BWItem[];
    die: BWItem[];
    callon: BWItem[];
}