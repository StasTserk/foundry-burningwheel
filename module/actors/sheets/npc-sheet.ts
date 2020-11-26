import { ActorSheetOptions, BWActorSheet } from "./bwactor-sheet.js";
import { ShadeString } from "../../helpers.js";
import { BWActor } from "../bwactor.js";
import { BWItemData, ItemType } from "../../items/item.js";
import { Npc } from "../npc.js";
import { handleNpcStatRollEvent } from "../../rolls/npcStatRoll.js";
import { handleNpcSkillRollEvent, handleNpcWeaponRollEvent, handleNpcSpellRollEvent } from "../../rolls/npcSkillRoll.js";
import { handleArmorRollEvent } from "../../rolls/rollArmor.js";
import { getKeypressModifierPreset } from "../../rolls/rolls.js";
import { ArmorData } from "../../items/armor.js";
import { SkillDataRoot, Skill } from "../../items/skill.js";
import { TraitDataRoot } from "../../items/trait.js";

export class NpcSheet extends BWActorSheet {
    get actor(): BWActor & Npc {
        return super.actor as BWActor & Npc;
    }

    static get defaultOptions(): ActorSheetOptions {
        const options = super.defaultOptions;

        options.draggableItemSelectors = [
            '.indented-section.item-draggable > .item-entry',
        ];
        options.draggableMeleeSelectors = [
            '.indented-section > .item-entry.melee-draggable',
        ];
        options.draggableRangedSelectors = [
            '.indented-section > .item-entry.ranged-draggable',
        ];
        options.draggableStatSelectors = [
            '.npc-stats .stat-value'
        ];
        return options;
    }
    
    getData(): ActorSheetData<unknown> {
        const data = super.getData() as NpcSheetData;
        const rollable = true; const open = true;
        const actor = this.actor;
        data.statRow = [
            {
                statName: "will", rollable, label: "Wi", value: actor.data.data.will.exp,
                valuePath: "will.exp", shade: actor.data.data.will.shade, shadePath: "will.shade",
                draggable: true, accessor: "data.will"
            }, {
                statName: "perception", rollable, label: "Pe", value: actor.data.data.perception.exp, valuePath: "perception.exp",
                shade: actor.data.data.perception.shade, shadePath: "perception.shade",
                draggable: true, accessor: "data.perception"
            }, {
                statName: "agility", rollable, label: "Ag", value: actor.data.data.agility.exp, valuePath: "agility.exp",
                shade: actor.data.data.agility.shade, shadePath: "agility.shade",
                draggable: true, accessor: "data.agility"
            }, {
                statName: "speed", rollable, label: "Sp", value: actor.data.data.speed.exp, valuePath: "speed.exp",
                shade: actor.data.data.speed.shade, shadePath: "speed.shade",
                draggable: true, accessor: "data.speed"
            }, {
                statName: "power", rollable, label: "Po", value: actor.data.data.power.exp, valuePath: "power.exp",
                shade: actor.data.data.power.shade, shadePath: "power.shade",
                draggable: true, accessor: "data.power"
            }, {
                statName: "forte", rollable, label: "Fo", value: actor.data.data.forte.exp, valuePath: "forte.exp",
                shade: actor.data.data.forte.shade, shadePath: "forte.shade",
                draggable: true, accessor: "data.forte"
            }, {
                statName: "health", rollable, label: "Hea", value: actor.data.data.health.exp, valuePath: "health.exp",
                shade: actor.data.data.health.shade, shadePath: "health.shade",
                draggable: true, accessor: "data.health"
            }, {
                label: "Ref", value: actor.data.data.reflexes || 0, valuePath: "reflexes",
                shade: actor.data.data.reflexesShade, shadePath: "reflexesShade"
            }, {
                label: "MW", value: actor.data.data.ptgs.moThresh || 0, valuePath: "ptgs.moThresh",
                shade: actor.data.data.ptgs.woundShade, shadePath: "ptgs.woundShade"
            }, {
                statName: "steel", rollable, open, label: "Ste", value: actor.data.data.steel.exp, valuePath: "steel.exp",
                shade: actor.data.data.steel.shade, shadePath: "steel.shade",
                draggable: true, accessor: "data.steel"
            }, {
                label: "Hes", value: actor.data.data.hesitation || 0, valuePath: "hesitation"
            }, {
                statName: "resources", rollable, label: "Res", value: actor.data.data.resources.exp, valuePath: "resources.exp",
                shade: actor.data.data.resources.shade, shadePath: "resources.shade",
                draggable: true, accessor: "data.resources"
            }, {
                statName: "circles", rollable, label: "Cir", value: actor.data.data.circles.exp, valuePath: "circles.exp",
                shade: actor.data.data.circles.shade, shadePath: "circles.shade",
                draggable: true, accessor: "data.circles"
            },
            { label: "Str", value: actor.data.data.stride, valuePath: "stride" },
        ];
        const armor: BWItemData[] = [];
        const woundDice = actor.data.data.ptgs.woundDice || 0;
        data.beliefs = [];
        data.traits = [];
        data.instincts = [];
        data.untrained = [];
        data.skills = [];
        data.weapons = [];
        data.affiliations = [];
        data.reputations = [];
        data.relationships = [];
        data.gear = [];
        data.spells = [];
        data.ranged = [];
        actor.data.items.forEach((i) => {
            switch (i.type) {
                case "belief":
                    data.beliefs.push(i); break;
                case "trait":
                    data.traits.push(i as TraitDataRoot); break;
                case "instinct":
                    data.instincts.push(i); break;
                case "skill":
                    if ((i as SkillDataRoot).data.learning) {
                        data.untrained.push(i as SkillDataRoot);
                    } else {
                        Skill.disableIfWounded.call(i, woundDice);
                        data.skills.push(i as SkillDataRoot);
                    }
                    break;
                case "melee weapon":
                    if (i.name !== "Bare Fist") {
                        data.gear.push(i);
                    }
                    data.weapons.push(i);
                    break;
                case "ranged weapon":
                    data.ranged.push(i); break;
                case "relationship":
                    data.relationships.push(i); break;
                case "reputation":
                    data.reputations.push(i); break;
                case "affiliation":
                    data.affiliations.push(i); break;
                case "spell":
                    data.spells.push(i); break;
                case "armor":
                    armor.push(i);
                    data.gear.push(i); break;
                default:
                    data.gear.push(i); break;
            }
        });

        data.beliefs.sort(byName);
        data.traits.sort(byName);
        data.instincts.sort(byName);
        data.skills.sort(byName);
        data.untrained.sort(byName);
        data.weapons.sort(byName);
        data.ranged.sort(byName);
        data.affiliations.sort(byName);
        data.reputations.sort(byName);
        data.relationships.sort(byName);
        data.gear.sort(byName);
        data.spells.sort(byName);
        data.armor = this.getArmorDictionary(armor);
        return data;
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find("div[data-action='edit']").on('click', (e) => this._editSheetItem(e));
        html.find("i[data-action='delete']").on('click', (e) => this._deleteSheetItem(e));
        html.find("i[data-action='add']").on('click', (e) => this._addSheetItem(e));
        html.find("div[data-action='rollStat'], div[data-action='rollStatOpen']").on('click', (e) => handleNpcStatRollEvent({ target: e.target, sheet: this, dataPreset: getKeypressModifierPreset(e) }));
        html.find("div[data-action='rollSkill']").on('click', (e) => handleNpcSkillRollEvent({ target: e.target, sheet: this, dataPreset: getKeypressModifierPreset(e) }));
        html.find("div[data-action='rollWeapon']").on('click', (e) => handleNpcWeaponRollEvent({ target: e.target, sheet: this, dataPreset: getKeypressModifierPreset(e) }));
        html.find("div[data-action='rollSpell']").on('click', (e) => handleNpcSpellRollEvent({ target: e.target, sheet: this, dataPreset: getKeypressModifierPreset(e) }));
        html.find("div[data-action='rollArmor']").on('click', (e) => handleArmorRollEvent({ target: e.target, sheet: this }));
    }
    _editSheetItem(e: JQuery.ClickEvent): void {
        const targetId = $(e.target).data("id") as string;
        const item = this.actor.getOwnedItem(targetId);
        item?.sheet.render(true);
    }
    _deleteSheetItem(e: JQuery.ClickEvent): void {
        const targetId = $(e.target).data("id") as string;
        this.actor.deleteOwnedItem(targetId);
    }
    _addSheetItem(e: JQuery.ClickEvent): void {
        const itemType = $(e.target).data("type") as string;
        this.actor.createOwnedItem({
            name: `New ${itemType}`,
            type: itemType as ItemType
        }).then(i => this.actor.getOwnedItem(i._id)?.sheet.render(true));
    }
}

function byName(a: ItemData, b: ItemData): number {
    return a.name.localeCompare(b.name);
}

export interface NpcSheetData extends ActorSheetData {
    untrained: SkillDataRoot[];
    armor: { [key: string]: ItemData<ArmorData> | null; };
    statRow: NPCStatEntry[];
    beliefs: ItemData[];
    instincts: ItemData[];
    traits: TraitDataRoot[];
    skills: SkillDataRoot[];
    weapons: ItemData[];
    ranged: ItemData[];
    affiliations: ItemData[];
    reputations: ItemData[];
    relationships: ItemData[];
    gear: ItemData[];
    spells: ItemData[];
    actor: BWActor;
}

interface NPCStatEntry {
    rollable?: boolean;
    open?: boolean;
    label: string;
    valuePath: string;
    value: string | number;
    statName?: string;
    shade?: ShadeString;
    shadePath?: string;

    draggable?: boolean;
    accessor?: string;
}