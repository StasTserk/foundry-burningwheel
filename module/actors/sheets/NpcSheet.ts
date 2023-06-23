import { ActorSheetOptions, BaseActorSheetData, BWActorSheet } from "./BWActorSheet";
import { ShadeString } from "../../helpers";
import { BWActor } from "../BWActor";
import { BWItem, ItemType } from "../../items/item";
import { Npc } from "../Npc";
import { handleNpcStatRollEvent } from "../../rolls/npcStatRoll";
import { handleNpcSkillRollEvent, handleNpcWeaponRollEvent, handleNpcSpellRollEvent } from "../../rolls/npcSkillRoll";
import { handleArmorRollEvent } from "../../rolls/rollArmor";
import { getKeypressModifierPreset } from "../../rolls/rolls";
import { Armor } from "../../items/armor";
import { Skill } from "../../items/skill";
import { Trait } from "../../items/trait";

export class NpcSheet extends BWActorSheet<NpcSheetData, Npc, ActorSheetOptions> {
    get actor(): Npc {
        return super.actor as Npc;
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
    
    getData(): NpcSheetData {
        const data = super.getData() as NpcSheetData;
        const rollable = true; const open = true;
        const actor = this.actor;
        data.statRow = [
            {
                statName: game.i18n.localize("BW.will"), rollable, label: "Wi", value: actor.system.will.exp,
                valuePath: "will.exp", shade: actor.system.will.shade, shadePath: "will.shade",
                draggable: true, accessor: "will"
            }, {
                statName: game.i18n.localize("BW.perception"), rollable, label: "Pe", value: actor.system.perception.exp, valuePath: "perception.exp",
                shade: actor.system.perception.shade, shadePath: "perception.shade",
                draggable: true, accessor: "perception"
            }, {
                statName: game.i18n.localize("BW.agility"), rollable, label: "Ag", value: actor.system.agility.exp, valuePath: "agility.exp",
                shade: actor.system.agility.shade, shadePath: "agility.shade",
                draggable: true, accessor: "agility"
            }, {
                statName: game.i18n.localize("BW.speed"), rollable, label: "Sp", value: actor.system.speed.exp, valuePath: "speed.exp",
                shade: actor.system.speed.shade, shadePath: "speed.shade",
                draggable: true, accessor: "speed"
            }, {
                statName: game.i18n.localize("BW.power"), rollable, label: "Po", value: actor.system.power.exp, valuePath: "power.exp",
                shade: actor.system.power.shade, shadePath: "power.shade",
                draggable: true, accessor: "power"
            }, {
                statName: game.i18n.localize("BW.forte"), rollable, label: "Fo", value: actor.system.forte.exp, valuePath: "forte.exp",
                shade: actor.system.forte.shade, shadePath: "forte.shade",
                draggable: true, accessor: "forte"
            }, {
                statName: game.i18n.localize("BW.health"), rollable, label: "Hea", value: actor.system.health.exp, valuePath: "health.exp",
                shade: actor.system.health.shade, shadePath: "health.shade",
                draggable: true, accessor: "health"
            }, {
                label: "Ref", value: actor.system.reflexes || 0, valuePath: "reflexes",
                shade: actor.system.reflexesShade, shadePath: "reflexesShade"
            }, {
                label: "MW", value: actor.system.ptgs.moThresh || 0, valuePath: "ptgs.moThresh",
                shade: actor.system.ptgs.woundShade, shadePath: "ptgs.woundShade"
            }, {
                statName: game.i18n.localize("BW.steel"), rollable, open, label: "Ste", value: actor.system.steel.exp, valuePath: "steel.exp",
                shade: actor.system.steel.shade, shadePath: "steel.shade",
                draggable: true, accessor: "steel"
            }, {
                label: "Hes", value: actor.system.hesitation || 0, valuePath: "hesitation"
            }, {
                statName: game.i18n.localize("BW.resources"), rollable, label: "Res", value: actor.system.resources.exp, valuePath: "resources.exp",
                shade: actor.system.resources.shade, shadePath: "resources.shade",
                draggable: true, accessor: "resources"
            }, {
                statName: game.i18n.localize("BW.circles"), rollable, label: "Cir", value: actor.system.circles.exp, valuePath: "circles.exp",
                shade: actor.system.circles.shade, shadePath: "circles.shade",
                draggable: true, accessor: "circles"
            },
            { label: "Str", value: actor.system.stride, valuePath: "stride" },
        ];
        const armor: Armor[] = [];
        const woundDice = actor.system.ptgs.woundDice || 0;
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
        actor.items.forEach((i: BWItem) => {
            switch (i.type) {
                case "belief":
                    data.beliefs.push(i); break;
                case "trait":
                    data.traits.push(i as Trait); break;
                case "instinct":
                    data.instincts.push(i); break;
                case "skill":
                    if ((i as Skill).system.learning) {
                        data.untrained.push(i as Skill);
                    } else {
                        Skill.disableIfWounded.call(i, woundDice);
                        data.skills.push(i as Skill);
                    }
                    break;
                case "melee weapon":
                    if (i.name !== "Bare Fist" && i.name !== game.i18n.localize('BW.weapon.bareFist')) {
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
                    armor.push(i as Armor);
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
        const item = this.actor.items.get(targetId);
        item?.sheet?.render(true);
    }
    _deleteSheetItem(e: JQuery.ClickEvent): void {
        const targetId = $(e.target).data("id") as string;
        this.actor.deleteEmbeddedDocuments("Item", [targetId]);
    }
    _addSheetItem(e: JQuery.ClickEvent): void {
        const itemType = $(e.target).data("type") as string;
        this.actor.createEmbeddedDocuments("Item", [{
            name: `New ${itemType}`,
            type: itemType as ItemType
        }]).then(i => this.actor.items.get(i[0].id)?.sheet?.render(true));
    }
}

function byName(a: BWItem, b: BWItem): number {
    return a.name.localeCompare(b.name);
}

export interface NpcSheetData extends BaseActorSheetData {
    untrained: Skill[];
    armor: { [key: string]: Armor | null; };
    statRow: NPCStatEntry[];
    beliefs: BWItem[];
    instincts: BWItem[];
    traits: Trait[];
    skills: Skill[];
    weapons: BWItem[];
    ranged: BWItem[];
    affiliations: BWItem[];
    reputations: BWItem[];
    relationships: BWItem[];
    gear: BWItem[];
    spells: BWItem[];
    actor: BWActor;
    [k: string]: unknown;
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