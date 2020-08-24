import { Armor } from "./armor.js";
import { MeleeWeapon } from "./meleeWeapon.js";
import { Possession } from "./possession.js";
import { Property } from "./property.js";
import { RangedWeapon } from "./rangedWeapon.js";
import { Relationship } from "./relationship.js";
import { Reputation } from "./reputation.js";
import { AffiliationSheet } from "./sheets/affiliation-sheet.js";
import { ArmorSheet } from "./sheets/armor-sheet.js";
import { BeliefSheet } from "./sheets/belief-sheet.js";
import { InstinctSheet } from "./sheets/instinct-sheet.js";
import { MeleeWeaponSheet } from "./sheets/melee-sheet.js";
import { PossessionSheet } from "./sheets/possession-sheet.js";
import { PropertySheet } from "./sheets/property-sheet.js";
import { RangedWeaponSheet } from "./sheets/ranged-sheet.js";
import { RelationshipSheet } from "./sheets/relationship-sheet.js";
import { ReputationSheet } from "./sheets/repuatation-sheet.js";
import { SkillSheet } from "./sheets/skill-sheet.js";
import { TraitSheet } from "./sheets/trait-sheet.js";
import { Skill } from "./skill.js";
import { Trait } from "./trait.js";
import { SpellSheet } from "./sheets/spell-sheet.js";
import { Spell } from "./spell.js";

export * from "./affiliation.js";
export * from "./armor.js";
export * from "./belief.js";
export * from "./instinct.js";
export * from "./meleeWeapon.js";
export * from "./possession.js";
export * from "./property.js";
export * from "./rangedWeapon.js";
export * from "./relationship.js";
export * from "./reputation.js";
export * from "./sheets/affiliation-sheet.js";
export * from "./sheets/armor-sheet.js";
export * from "./sheets/belief-sheet.js";
export * from "./sheets/instinct-sheet.js";
export * from "./sheets/melee-sheet.js";
export * from "./sheets/possession-sheet.js";
export * from "./sheets/property-sheet.js";
export * from "./sheets/ranged-sheet.js";
export * from "./sheets/relationship-sheet.js";
export * from "./sheets/repuatation-sheet.js";
export * from "./sheets/skill-sheet.js";
export * from "./sheets/trait-sheet.js";
export * from "./sheets/spell-sheet.js";
export * from "./spell.js";
export * from "./skill.js";
export * from "./trait.js";

export class BWItem extends Item {
    prepareData(): void {
        super.prepareData();
        if (prototypeList[this.type]) {
            prototypeList[this.type].prototype.prepareData.bind(this)();
        }
    }

    data: BWItemData;

    get type(): ItemType {
        return super.type as ItemType;
    }
}

export interface BWItemData extends ItemData {
    type: ItemType;
}

export interface ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
}

export interface HasPointCost {
    pointCost: number;
}

export interface DisplayClass {
    cssClass?: string;
}

export function RegisterItemSheets(): void {
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("burningwheel", BeliefSheet, {
        types: ["belief"],
        makeDefault: true
    });
    Items.registerSheet("burningwheel", InstinctSheet, {
        types: ["instinct"],
        makeDefault: true
    });
    Items.registerSheet("burningwheel", TraitSheet, {
        types: ["trait"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", SkillSheet, {
        types: ["skill"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", RelationshipSheet, {
        types: ["relationship"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", PossessionSheet, {
        types: ["possession"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", PropertySheet, {
        types: ["property"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", MeleeWeaponSheet, {
        types: ["melee weapon"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", RangedWeaponSheet, {
        types: ["ranged weapon"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", ArmorSheet, {
        types: ["armor"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", ReputationSheet, {
        types: ["reputation"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", AffiliationSheet, {
        types: ["affiliation"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", SpellSheet, {
        types: ["spell"],
        makeDefault: true
    });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const prototypeList: { [i: string]: typeof Item} = {
    "trait": Trait as any,
    "skill": Skill as any,
    "relationship": Relationship as any,
    "melee weapon":  MeleeWeapon as any,
    "ranged weapon":  RangedWeapon as any,
    "armor": Armor as any,
    "possession":  Possession as any,
    "property":  Property as any,
    "reputation":  Reputation as any,
    "spell": Spell as any
};

export type ItemType =
    "belief" | "instinct" | "trait" |
    "skill" | "armor" | "possession" |
    "property" | "relationship" | "melee weapon" |
    "ranged weapon" | "reputation" | "affiliation"
    | "spell";