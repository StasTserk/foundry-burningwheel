import { AffiliationSheet } from './sheets/affiliation-sheet';
import { ArmorSheet } from './sheets/armor-sheet';
import { BeliefSheet } from './sheets/belief-sheet';
import { InstinctSheet } from './sheets/instinct-sheet';
import { MeleeWeaponSheet } from './sheets/melee-sheet';
import { PossessionSheet } from './sheets/possession-sheet';
import { PropertySheet } from './sheets/property-sheet';
import { RangedWeaponSheet } from './sheets/ranged-sheet';
import { RelationshipSheet } from './sheets/relationship-sheet';
import { ReputationSheet } from './sheets/reputation-sheet';
import { SkillSheet } from './sheets/skill-sheet';
import { TraitSheet } from './sheets/trait-sheet';
import { SpellSheet } from './sheets/spell-sheet';
import * as constants from '../constants';
import { LifepathSheet } from './sheets/lifepath-sheet';
import { BWActor } from '../actors/BWActor';
import { simpleBroadcast } from '../chat';
import { LifepathData } from './lifepath';
import { AffiliationData } from './affiliation';
import { ArmorData } from './armor';
import { PossessionData } from './possession';
import { PropertyData } from './property';
import { RangedWeaponData } from './rangedWeapon';
import { RelationshipData } from './relationship';
import { ReputationData } from './reputation';
import { SpellData } from './spell';
import { TraitData } from './trait';
import { MeleeWeaponData } from './meleeWeapon';
import { SkillData } from './skill';
import { TypeMissing } from '../../types/index';

export * from './sheets/affiliation-sheet';
export * from './sheets/armor-sheet';
export * from './sheets/belief-sheet';
export * from './sheets/instinct-sheet';
export * from './sheets/melee-sheet';
export * from './sheets/possession-sheet';
export * from './sheets/property-sheet';
export * from './sheets/ranged-sheet';
export * from './sheets/relationship-sheet';
export * from './sheets/reputation-sheet';
export * from './sheets/skill-sheet';
export * from './sheets/trait-sheet';
export * from './sheets/spell-sheet';

export class BWItem<T extends BWItemDataTypes = BWItemDataTypes> extends Item<
    Item.Data & T
> {
    async generateChatMessage(speaker: BWActor): Promise<ChatMessage | null> {
        return simpleBroadcast(
            { title: this.name, mainText: `Type - ${this.type}` },
            speaker
        );
    }
    prepareData(): void {
        super.prepareData();
        this.hasOwner = !!(this.actor && this.actor.system);
    }

    type: ItemType;
    hasOwner: boolean;

    _preCreate(
        data: Partial<T & Item.Data>,
        options: FoundryDocument.CreateOptions,
        user: User
    ): void {
        super._preCreate(data, options, user);
        const entity = this as TypeMissing;
        if (entity.type && entity._source.img === 'icons/svg/item-bag.svg') {
            this.updateSource({
                img: constants.defaultImages[
                    data.type as keyof typeof constants.defaultImages
                ],
            });
        }
    }
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
    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet(constants.systemName, BeliefSheet, {
        types: ['belief'],
        makeDefault: true,
        label: 'BW.sheet.belief',
    });
    Items.registerSheet(constants.systemName, InstinctSheet, {
        types: ['instinct'],
        makeDefault: true,
        label: 'BW.sheet.instinct',
    });
    Items.registerSheet(constants.systemName, TraitSheet, {
        types: ['trait'],
        makeDefault: true,
        label: 'BW.sheet.trait',
    });

    Items.registerSheet(constants.systemName, SkillSheet, {
        types: ['skill'],
        makeDefault: true,
        label: 'BW.sheet.skill',
    });

    Items.registerSheet(constants.systemName, RelationshipSheet, {
        types: ['relationship'],
        makeDefault: true,
        label: 'BW.sheet.relationship',
    });

    Items.registerSheet(constants.systemName, PossessionSheet, {
        types: ['possession'],
        makeDefault: true,
        label: 'BW.sheet.possession',
    });

    Items.registerSheet(constants.systemName, PropertySheet, {
        types: ['property'],
        makeDefault: true,
        label: 'BW.sheet.property',
    });

    Items.registerSheet(constants.systemName, MeleeWeaponSheet, {
        types: ['melee weapon'],
        makeDefault: true,
        label: 'BW.sheet.meleeWeapon',
    });

    Items.registerSheet(constants.systemName, RangedWeaponSheet, {
        types: ['ranged weapon'],
        makeDefault: true,
        label: 'BW.sheet.rangedWeapon',
    });

    Items.registerSheet(constants.systemName, ArmorSheet, {
        types: ['armor'],
        makeDefault: true,
        label: 'BW.sheet.armor',
    });

    Items.registerSheet(constants.systemName, ReputationSheet, {
        types: ['reputation'],
        makeDefault: true,
        label: 'BW.sheet.reputation',
    });

    Items.registerSheet(constants.systemName, AffiliationSheet, {
        types: ['affiliation'],
        makeDefault: true,
        label: 'BW.sheet.affiliation',
    });

    Items.registerSheet(constants.systemName, SpellSheet, {
        types: ['spell'],
        makeDefault: true,
        label: 'BW.sheet.spell',
    });

    Items.registerSheet(constants.systemName, LifepathSheet, {
        types: ['lifepath'],
        makeDefault: true,
        label: 'BW.sheet.lifepath',
    });
}

export type ItemType =
    | 'belief'
    | 'instinct'
    | 'trait'
    | 'skill'
    | 'armor'
    | 'possession'
    | 'property'
    | 'relationship'
    | 'melee weapon'
    | 'ranged weapon'
    | 'reputation'
    | 'affiliation'
    | 'spell'
    | 'lifepath';

export type BWItemDataTypes =
    | SkillData
    | LifepathData
    | MeleeWeaponData
    | AffiliationData
    | ArmorData
    | PossessionData
    | PropertyData
    | RangedWeaponData
    | RelationshipData
    | ReputationData
    | SpellData
    | TraitData;
