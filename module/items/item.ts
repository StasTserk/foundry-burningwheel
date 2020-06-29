import { Belief } from "./belief.js";
import { Instinct } from "./instinct.js";
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

export {
    ArmorSheet,
    PosessionSheet,
    RelationshipSheet,
    BeliefSheet,
    MeleeWeaponSheet,
    PropertySheet,
    RangedWeaponSheet,
    SkillSheet,
    TraitSheet,

    Belief,
    Instinct,
    Relationship,
    Skill,
    Trait
}

export class BWItem extends Item {
    prepareData() {
        super.prepareData();
        if (this.type === "trait") {
            Trait.prototype.prepareData.bind(this)();
        }
        if (this.type === "skill") {
            Skill.prototype.prepareData.bind(this)();
        }
        if (this.type === "relationship") {
            Relationship.prototype.prepareData.bind(this)();
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