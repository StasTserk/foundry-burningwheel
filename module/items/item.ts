import { AffiliationSheet } from "./sheets/affiliation-sheet.js";
import { ArmorSheet } from "./sheets/armor-sheet.js";
import { BeliefSheet } from "./sheets/belief-sheet.js";
import { InstinctSheet } from "./sheets/instinct-sheet.js";
import { MeleeWeaponSheet } from "./sheets/melee-sheet.js";
import { PossessionSheet } from "./sheets/possession-sheet.js";
import { PropertySheet } from "./sheets/property-sheet.js";
import { RangedWeaponSheet } from "./sheets/ranged-sheet.js";
import { RelationshipSheet } from "./sheets/relationship-sheet.js";
import { ReputationSheet } from "./sheets/reputation-sheet.js";
import { SkillSheet } from "./sheets/skill-sheet.js";
import { TraitSheet } from "./sheets/trait-sheet.js";
import { SpellSheet } from "./sheets/spell-sheet.js";
import * as constants from "../constants.js";
import { LifepathSheet } from "./sheets/lifepath-sheet.js";
import { BWActor } from "../actors/BWActor.js";
import { simpleBroadcast } from "../chat.js";
import { SkillDataRoot } from "./skill.js";
import { LifepathRootData } from "./lifepath.js";
import { MeleeWeaponRootData } from "./meleeWeapon.js";
import { AffiliationDataRoot } from "./affiliation.js";
import { ArmorRootData } from "./armor.js";
import { PossessionRootData } from "./possession.js";
import { PropertyRootData } from "./property.js";
import { RangedWeaponRootData } from "./rangedWeapon.js";
import { RelationshipDataRoot } from "./relationship.js";
import { ReputationDataRoot } from "./reputation.js";
import { SpellDataRoot } from "./spell.js";
import { TraitDataRoot } from "./trait.js";

export * from "./sheets/affiliation-sheet.js";
export * from "./sheets/armor-sheet.js";
export * from "./sheets/belief-sheet.js";
export * from "./sheets/instinct-sheet.js";
export * from "./sheets/melee-sheet.js";
export * from "./sheets/possession-sheet.js";
export * from "./sheets/property-sheet.js";
export * from "./sheets/ranged-sheet.js";
export * from "./sheets/relationship-sheet.js";
export * from "./sheets/reputation-sheet.js";
export * from "./sheets/skill-sheet.js";
export * from "./sheets/trait-sheet.js";
export * from "./sheets/spell-sheet.js";

export class BWItem<T extends BWItemData = BWItemDataTypes> extends Item<T> {
    async generateChatMessage(speaker: BWActor): Promise<ChatMessage | null> {
        return simpleBroadcast({ title: this.name, mainText: `Type - ${this.data.type}` }, speaker);
    }
    prepareData(): void {
        super.prepareData();
        this.data.hasOwner = !!(this.actor && this.actor.data);
    }

    get type(): ItemType {
        return super.type as ItemType;
    }

    async _preCreate(data: Partial<BWItemData>, options: FoundryDocument.CreateOptions, user: User): Promise<void> {
        await super._preCreate(data as T, options, user);
        if (data.type) {
            this.data._source.img = constants.defaultImages[data.type];
        }
    }
}

export interface BWItemData<T = unknown> extends Item.Data<T> {
    type: ItemType;
    hasOwner: boolean;
}

export interface ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
    fateSpent: number;
    personaSpent: number;
    deedsSpent: number;
}

export interface HasPointCost {
    pointCost: number;
}

export interface DisplayClass {
    cssClass?: string;
}

export function RegisterItemSheets(): void {
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet(constants.systemName, BeliefSheet, {
        types: ["belief"],
        makeDefault: true
    });
    Items.registerSheet(constants.systemName, InstinctSheet, {
        types: ["instinct"],
        makeDefault: true
    });
    Items.registerSheet(constants.systemName, TraitSheet, {
        types: ["trait"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, SkillSheet, {
        types: ["skill"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, RelationshipSheet, {
        types: ["relationship"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, PossessionSheet, {
        types: ["possession"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, PropertySheet, {
        types: ["property"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, MeleeWeaponSheet, {
        types: ["melee weapon"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, RangedWeaponSheet, {
        types: ["ranged weapon"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, ArmorSheet, {
        types: ["armor"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, ReputationSheet, {
        types: ["reputation"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, AffiliationSheet, {
        types: ["affiliation"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, SpellSheet, {
        types: ["spell"],
        makeDefault: true
    });

    Items.registerSheet(constants.systemName, LifepathSheet, {
        types: ["lifepath"],
        makeDefault: true
    });
}

export type ItemType =
    "belief" | "instinct" | "trait" |
    "skill" | "armor" | "possession" |
    "property" | "relationship" | "melee weapon" |
    "ranged weapon" | "reputation" | "affiliation"
    | "spell" | "lifepath";

export type BWItemDataTypes = BWItemData | SkillDataRoot | LifepathRootData | MeleeWeaponRootData
    | AffiliationDataRoot | ArmorRootData | PossessionRootData | PropertyRootData | RangedWeaponRootData
    | RelationshipDataRoot | ReputationDataRoot | SpellDataRoot | TraitDataRoot;
