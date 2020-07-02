import { MeleeWeapon } from "./meleeWeapon.js";
import { RangedWeapon } from "./rangedWeapon.js";
import { Relationship } from "./relationship.js";
import { ArmorSheet } from "./sheets/armor-sheet.js";
import { BeliefSheet } from "./sheets/belief-sheet.js";
import { MeleeWeaponSheet } from "./sheets/melee-sheet.js";
import { PosessionSheet } from "./sheets/posession-sheet.js";
import { PropertySheet } from "./sheets/property-sheet.js";
import { RangedWeaponSheet } from "./sheets/ranged-sheet.js";
import { RelationshipSheet } from "./sheets/relationship-sheet.js";
import { SkillSheet } from "./sheets/skill-sheet.js";
import { TraitSheet } from "./sheets/trait-sheet.js";
import { Skill } from "./skill.js";
import { Trait } from "./trait.js";

export * from "./armor.js";
export * from "./belief.js";
export * from "./instinct.js";
export * from "./meleeWeapon.js";
export * from "./rangedWeapon.js";
export * from "./relationship.js";
export * from "./sheets/armor-sheet.js";
export * from "./sheets/belief-sheet.js";
export * from "./sheets/melee-sheet.js";
export * from "./sheets/posession-sheet.js";
export * from "./sheets/property-sheet.js";
export * from "./sheets/ranged-sheet.js";
export * from "./sheets/relationship-sheet.js";
export * from "./sheets/skill-sheet.js";
export * from "./sheets/trait-sheet.js";
export * from "./skill.js";
export * from "./trait.js";

export class BWItem extends Item {
    prepareData() {
        super.prepareData();
        switch (this.type) {
            case "trait":
                Trait.prototype.prepareData.bind(this)();
                break;
            case "skill":
                Skill.prototype.prepareData.bind(this)();
                break;
            case "relationship":
                Relationship.prototype.prepareData.bind(this)();
                break;
            case "melee weapon":
                MeleeWeapon.prototype.prepareData.bind(this)();
                break;
            case "ranged weapon":
                RangedWeapon.prototype.prepareData.bind(this)();
        }
    }
}

export interface ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
}

export function RegisterItemSheets() {
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("burningwheel", BeliefSheet, {
        types: ["belief"],
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

    Items.registerSheet("burningwheel", PosessionSheet, {
        types: ["posession"],
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
}
