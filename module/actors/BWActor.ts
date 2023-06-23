import { ShadeString, StringIndexedObject } from "../helpers";
import { DisplayClass, ItemType, BWItem, BWItemDataTypes } from "../items/item";
import { Skill, SkillData } from "../items/skill";
import * as constants from "../constants";
import { Armor } from "../items/armor";
import { Possession, PossessionData } from "../items/possession";
import { ReputationData } from "../items/reputation";
import { TraitData, Trait } from "../items/trait";
import { BWCharacterData } from "./BWCharacter";
import { NpcData } from "./Npc";
import { AffiliationData } from "../items/affiliation";
import { MeleeWeapon } from "../items/meleeWeapon";
import { RangedWeapon } from "../items/rangedWeapon";
import { Spell } from "../items/spell";
import { TypeMissing } from "../../types/index";

export class BWActor<T extends Common = Common> extends Actor<Actor.Data & T, BWItem>{


    readonly batchAdd = {
        task: -1,
        items: [] as (NewItemData & Partial<BWItemDataTypes>)[] 
    };

    private async _handleBatchAdd(): Promise<FoundryDocument[]> {
        const items = this.batchAdd.items;
        this.batchAdd.items = [];
        clearTimeout(this.batchAdd.task);
        this.batchAdd.task = -1;
        return this.createEmbeddedDocuments("Item", items);
    }

    batchAddItem(item: NewItemData): void {
        if (this.batchAdd.task === -1) {
            this.batchAdd.task = setTimeout(() => this._handleBatchAdd(), 500);
        }
        this.batchAdd.items.push(item);
    }

    async processNewItem(item: Item.Data, userId: string): Promise<unknown> {
        if (game.userId !== userId) {
            // this item has been added by someone else.
            return;
        }
        if (item.type === "trait") {
            const trait = item as unknown as TraitData;
            if (trait.addsReputation) {
                const repData: NewItemData = {
                    name: trait.reputationName,
                    type: "reputation",
                    img: constants.defaultImages.reputation
                };
                repData["data.dice"] = trait.reputationDice;
                repData["data.infamous"] = trait.reputationInfamous;
                repData["data.description"] = trait.text;
                this.batchAddItem(repData);
            }
            if (trait.addsAffiliation) {
                const repData: NewItemData = {
                    name: trait.affiliationName,
                    type: "affiliation",
                    img: constants.defaultImages.affiliation
                };
                repData["data.dice"] = trait.affiliationDice;
                repData["data.description"] = trait.text;
                this.batchAddItem(repData);
            }
        }
    }

    prepareData(): void {
        super.prepareData();
    }

    prepareBaseData(): void {
        this._prepareActorData();
    }

    getForkOptions(skillName: string): { name: string, amount: number }[] {
        return this.forks.filter(s =>
            s.name !== skillName // skills reduced to 0 due to wounds can't be used as forks.
            && s.system.exp > ((this.system as unknown as BWCharacterData | NpcData).ptgs.woundDice || 0))
            .map( s => {
                const exp = s.system.exp;
                // skills at 7+ exp provide 2 dice in forks.
                return { name: s.name, amount: exp >= 7 ? 2 : 1 };
            });
    }

    getWildForks(skillName: string): { name: string, amount: number }[] {
        return this.wildForks.filter(s =>
            s.name !== skillName // skills reduced to 0 due to wounds can't be used as forks.
            && s.system.exp > ((this.system as unknown as BWCharacterData | NpcData).ptgs.woundDice || 0))
            .map( s => {
                const exp = s.system.exp;
                // skills at 7+ exp provide 2 dice in forks.
                return { name: s.name, amount: exp >= 7 ? 2 : 1 };
            });
    }

    private _addRollModifier(rollName: string, modifier: RollModifier, onlyNonZero = false) {
        rollName = rollName.toLowerCase();
        if (onlyNonZero && !modifier.dice && !modifier.obstacle) {
            return;
        }
        if (this.rollModifiers[rollName]) {
            this.rollModifiers[rollName].push(modifier);
        } else {
            this.rollModifiers[rollName] = [modifier];
        }
    }

    getRollModifiers(rollName: string): RollModifier[] {
        return (this.rollModifiers[rollName.toLowerCase()] || []).concat(this.rollModifiers.all || []);
    }

    private _addAptitudeModifier(name: string, modifier: number) {
        name = name.toLowerCase();
        if (Number.isInteger(this.aptitudeModifiers[name])) {
            this.aptitudeModifiers[name] += modifier;
        } else {
            this.aptitudeModifiers[name] = modifier;
        }
    }

    getAptitudeModifiers(name = ""): number {
        return (this.aptitudeModifiers || {})[name.toLowerCase()] || 0;
    }

    private _prepareActorData() {
        this.rollModifiers = {};
        this.callOns = {};
        this.aptitudeModifiers = {};
        
        this._calculateClumsyWeight();

        this.forks = [];
        this.wildForks = [];
        this.circlesBonus = [];
        this.circlesMalus = [];
        this.martialSkills = [];
        this.socialSkills = [];
        this.sorcerousSkills = [];
        this.toolkits = [];
        this.fightWeapons = [];
        
        if (this.items) {
            this.items.forEach((item) => {
                const { system: i, name, type } = item;
                switch (type) {
                    case "skill":
                        if (!(i as SkillData).learning &&
                            !(i as SkillData).training) {
                            if ((i as SkillData).wildFork) {
                                this.wildForks.push(item as Skill);
                            } else {
                                this.forks.push(item as Skill);
                            }
                        }
                        if ((i as SkillData).skilltype === "martial" &&
                            !(i as SkillData).training) {
                            this.martialSkills.push(item as Skill);
                        } else if ((i as SkillData).skilltype === "sorcerous") {
                            this.sorcerousSkills.push(item as Skill);
                        } else if ((i as SkillData).skilltype === "social") {
                            this.socialSkills.push(item as Skill);
                        }
                        break;
                    case "reputation":
                        const rep = i as ReputationData;
                        if (rep.infamous) {
                            this.circlesMalus.push({ name: name, amount: rep.dice });
                        } else {
                            this.circlesBonus.push({ name: name, amount: rep.dice });
                        }
                        break;
                    case "affiliation":
                        this.circlesBonus.push({ name: name, amount: (i as AffiliationData).dice });
                        break;
                    case "trait":
                        const t = i as TraitData;
                        if (t.traittype === "die") {
                            if (t.hasDieModifier && t.dieModifierTarget) {
                                t.dieModifierTarget.split(',').forEach(target =>
                                    this._addRollModifier(target.trim(), Trait.asRollDieModifier(name, t)));
                            }
                            if (t.hasObModifier && t.obModifierTarget) {
                                t.obModifierTarget.split(',').forEach(target =>
                                    this._addRollModifier(target.trim(), Trait.asRollObModifier(name, t)));
                            }
                        } if (t.traittype === "call-on") {
                            if (t.callonTarget) {
                                this._addCallon(t.callonTarget, name);
                            }
                        }
                        if (t.hasAptitudeModifier) {
                            t.aptitudeTarget.split(',').forEach((target) =>
                                this._addAptitudeModifier(target.trim(), t.aptitudeModifier));
                        }
                        break;
                    case "possession":
                        if ((i as PossessionData).isToolkit) {
                            this.toolkits.push(item as Possession);
                        }
                        break;
                    case "spell":
                    case "melee weapon":
                    case "ranged weapon":
                        this.fightWeapons.push(item as MeleeWeapon | RangedWeapon | Spell);
                        break;
                }
            });
        }
    }

    private _addCallon(callonTarget: string, name: string) {
        callonTarget.split(',').forEach(s => {
            if (this.callOns[s.trim().toLowerCase()]) {
                this.callOns[s.trim().toLowerCase()].push(name);
            }
            else {
                this.callOns[s.trim().toLowerCase()] = [name];
            }
        });

    }

    getCallons(roll: string): string[] {
        return this.callOns[roll.toLowerCase()] || [];
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    _onCreate(data: any, options: any, userId: string): void {
        super._onCreate(data, options, userId);
        if (this.items.contents.length) {
            return; // this is most likely a duplicate of an existing actor. we don't need to add default items.
        }
        if (game.userId !== userId) {
            // we aren't the person who created this actor
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.createEmbeddedDocuments("Item", [
                { name: "Instinct 1", type: "instinct", data: {}, img: constants.defaultImages.instinct },
                { name: "Instinct 2", type: "instinct", data: {}, img: constants.defaultImages.instinct },
                { name: "Instinct 3", type: "instinct", data: {}, img: constants.defaultImages.instinct },
                { name: "Instinct Special", type: "instinct", data: {}, img: constants.defaultImages.instinct },
                { name: "Belief 1", type: "belief", data: {}, img: constants.defaultImages.belief },
                { name: "Belief 2", type: "belief", data: {}, img: constants.defaultImages.belief },
                { name: "Belief 3", type: "belief", data: {}, img: constants.defaultImages.belief },
                { name: "Belief Special", type: "belief", data: {}, img: constants.defaultImages.belief },
                { ...constants.bareFistData, img: "icons/skills/melee/unarmed-punch-fist-yellow-red.webp" }
            ]
        );
    }

    async _preCreate(actor: Partial<T> & TypeMissing, _options: FoundryDocument.CreateOptions, user: User): Promise<void> {
        await super._preCreate(actor as TypeMissing, _options, user);
        if (actor.type === 'character' || actor.type === 'npc') {
            (this as TypeMissing).prototypeToken.updateSource({
                disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                sight: { enabled: true }
            });
        }
        if (actor.type === 'character' || actor.type === 'setting') {
            (this as TypeMissing).prototypeToken.updateSource({
                actorLink: true,
                disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY
            });
        }
    }

    private _calculateClumsyWeight() {
        const clumsyWeight: ClumsyWeightData = {
            agilityPenalty: 0,
            speedObPenalty: 0,
            speedDiePenalty: 0,
            climbingPenalty: 0,
            healthFortePenalty: 0,
            throwingShootingPenalty: 0,
            stealthyPenalty: 0,
            swimmingPenalty: 0,
            helmetObPenalty: 0,
            untrainedHealth: 0,
            untrainedAll: 0
        };

        const charData = this.type === "character" ? this.system as unknown as BWCharacterData : undefined;

        this.items.filter((i: BWItem) => (i.type === "armor" && (i as Armor).system.equipped))
            .forEach((i: Armor) => {
            const a = i.system;
            if (a.hasHelm) {
                    clumsyWeight.helmetObPenalty = a.perceptionObservationPenalty || 0;
            }
            if (a.hasTorso) {
                clumsyWeight.healthFortePenalty = Math.max(clumsyWeight.healthFortePenalty,
                    a.healthFortePenalty || 0);
                clumsyWeight.stealthyPenalty = Math.max(clumsyWeight.stealthyPenalty,
                    a.stealthyPenalty || 0);
                clumsyWeight.swimmingPenalty = Math.max(clumsyWeight.swimmingPenalty,
                    a.swimmingPenalty || 0);
            }
            if (a.hasLeftArm || a.hasRightArm) {
                clumsyWeight.agilityPenalty = Math.max(clumsyWeight.agilityPenalty,
                    a.agilityPenalty || 0);
                clumsyWeight.throwingShootingPenalty = Math.max(clumsyWeight.throwingShootingPenalty,
                    a.throwingShootingPenalty || 0);
                clumsyWeight.climbingPenalty = Math.max(clumsyWeight.climbingPenalty,
                    a.climbingPenalty || 0);
            }
            if (a.hasLeftLeg || a.hasRightLeg) {
                clumsyWeight.speedDiePenalty = Math.max(clumsyWeight.speedDiePenalty,
                    a.speedDiePenalty || 0);
                clumsyWeight.speedObPenalty = Math.max(clumsyWeight.speedObPenalty,
                    a.speedObPenalty || 0);
            }


            if (charData && !charData.settings.armorTrained &&
                (a.hasHelm || a.hasLeftArm || a.hasRightArm || a.hasTorso || a.hasLeftLeg || a.hasRightLeg)) {
                // if this is more than just a shield
                if (a.untrainedPenalty === "plate") {
                    clumsyWeight.untrainedAll = Math.max(clumsyWeight.untrainedAll, 2);
                    clumsyWeight.untrainedHealth = 0;
                } else if (a.untrainedPenalty === "heavy") {
                    clumsyWeight.untrainedAll = Math.max(clumsyWeight.untrainedAll, 1);
                    clumsyWeight.untrainedHealth = 0;
                } else if (a.untrainedPenalty === "light" && clumsyWeight.untrainedAll === 0) {
                    clumsyWeight.untrainedHealth = 1;
                }
            }
        });

        if (charData) { charData.clumsyWeight = clumsyWeight; }
        const baseModifier = { optional: true, label: game.i18n.localize('BW.armor.armorClumsyWeight') };
        this._addRollModifier("climbing", { obstacle: clumsyWeight.climbingPenalty, ...baseModifier }, true);
        this._addRollModifier("perception", { obstacle: clumsyWeight.helmetObPenalty,  ...baseModifier }, true);
        this._addRollModifier("observation", { obstacle: clumsyWeight.helmetObPenalty, ...baseModifier }, true);
        this._addRollModifier("shooting", { obstacle: clumsyWeight.throwingShootingPenalty,  ...baseModifier }, true);
        this._addRollModifier("bow", { obstacle: clumsyWeight.throwingShootingPenalty, ...baseModifier }, true);
        this._addRollModifier("throwing", { obstacle: clumsyWeight.throwingShootingPenalty, ...baseModifier }, true);
        this._addRollModifier("crossbow", { obstacle: clumsyWeight.throwingShootingPenalty, ...baseModifier }, true);
        this._addRollModifier("firearms", { obstacle: clumsyWeight.throwingShootingPenalty, ...baseModifier }, true);
        this._addRollModifier("agility", { obstacle: clumsyWeight.agilityPenalty, ...baseModifier }, true);
        this._addRollModifier("speed", { dice: -clumsyWeight.speedDiePenalty, ...baseModifier }, true);
        this._addRollModifier("speed", { obstacle: clumsyWeight.speedObPenalty, ...baseModifier }, true);
        this._addRollModifier("health", { obstacle: clumsyWeight.healthFortePenalty, ...baseModifier }, true);
        this._addRollModifier("forte", { obstacle: clumsyWeight.healthFortePenalty, ...baseModifier }, true);
        this._addRollModifier("stealthy", { obstacle: clumsyWeight.stealthyPenalty, ...baseModifier }, true);

        const swimmingModifier = {
            label: game.i18n.localize('BW.armor.armorSwimmingPenalty'),
            obstacle: clumsyWeight.swimmingPenalty,
            optional: true
        };
        this._addRollModifier("forte", swimmingModifier, true);
        this._addRollModifier("power", swimmingModifier, true);
        this._addRollModifier("speed", swimmingModifier, true);

        this._addRollModifier(
            "all",
            { obstacle: clumsyWeight.untrainedAll, label: game.i18n.localize('BW.armor.untrainedArmorPenalty'), optional: true },
            true);

        this._addRollModifier(
            "health",
            { obstacle: clumsyWeight.untrainedHealth, label: game.i18n.localize('BW.armor.untrainedArmor'), optional: true },
            true);
        this._addRollModifier(
            "forte",
            { obstacle: clumsyWeight.untrainedHealth, label: game.i18n.localize('BW.armor.untrainedArmor'), optional: true },
            true);
    }

    public updateArthaForSkill(_skillId: string, persona: number, deeds: number): void {
        const updateData = {};
        updateData["data.deeds"] = this.system.deeds - (deeds ? 1 : 0);
        updateData["data.persona"] = this.system.persona - persona;
        this.update(updateData);
    }

    public updateArthaForStat(accessor: string, persona: number, deeds: number): void {
        const updateData = {};
        updateData["data.deeds"] = this.system.deeds - (deeds ? 1 : 0);
        updateData["data.persona"] = this.system.persona - persona;
        this.update(updateData);
    }

    aptitudeModifiers: StringIndexedObject<number>;
    toolkits: Possession[];
    martialSkills: Skill[];
    socialSkills: Skill[];
    sorcerousSkills: Skill[];
    wildForks: Skill[];

    circlesMalus: { name: string, amount: number }[];
    circlesBonus: { name: string, amount: number }[];
    items: DocumentCollection<BWItem>;
    forks: Skill[];
    rollModifiers: { [rollName:string]: RollModifier[]; };
    callOns: { [rollName:string]: string[] };
    successOnlyRolls: string[];

    fightWeapons: (MeleeWeapon | RangedWeapon | Spell)[];

    type: "character" | "npc" | "setting";
}

export interface Common {
    will: Ability;
    power: Ability;
    agility: Ability;
    perception: Ability;
    forte: Ability;
    speed: Ability;
    health: Ability;
    steel: Ability;
    circles: Ability;
    resources: Ability;
    custom1: Ability & { name: string };
    custom2: Ability & { name: string };
    stride: number;
    mountedStride: number;
    cash: number;
    funds: number;
    property: string;
    loans: string;
    debt: string;

    willTax: number;
    forteTax: number;

    resourcesTax: number;
    fate: number;
    persona: number;
    deeds: number;
}

export interface Ability extends TracksTests, DisplayClass {
    shade: ShadeString;
    open: boolean;
}

export interface TracksTests {
    exp: number;
    routine: number;
    difficult: number;
    challenging: number;
    persona: number;
    fate: number;
    deeds: number;

    // derived values
    routineNeeded?: number;
    difficultNeeded?: number;
    challengingNeeded?: number;
}

export interface DisplayProps {
    collapseBeliefs: boolean;
    collapseInstincts: boolean;
    collapseTraits: boolean;
    collapseStats: boolean;
    collapseAttributes: boolean;
    collapseRelationships: boolean;
    collapseGear: boolean;
    collapseLearning: boolean;
    collapseSkills: boolean;
    collapsePtgs: boolean;
    collapseCombat: boolean;
    collapseMisc: boolean;
    collapseSpells: boolean;
}

export interface ClumsyWeightData {
    agilityPenalty: number;
    speedObPenalty: number;
    speedDiePenalty: number;
    climbingPenalty: number;
    healthFortePenalty: number;
    throwingShootingPenalty: number;
    stealthyPenalty: number;
    swimmingPenalty: number;
    helmetObPenalty: number;
    untrainedHealth: number;
    untrainedAll: number;
}

export interface RollModifier {
    dice?: number;
    obstacle?: number;
    optional: boolean;
    label: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface NewItemData extends StringIndexedObject<any> {
    name: string;
    type: ItemType;
}
