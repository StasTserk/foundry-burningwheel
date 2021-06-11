import { ShadeString, StringIndexedObject } from "../helpers.js";
import { DisplayClass, ItemType, BWItemData, BWItem, BWItemDataTypes } from "../items/item.js";
import { SkillDataRoot } from "../items/skill.js";
import * as constants from "../constants.js";
import { Armor } from "../items/armor.js";
import { PossessionRootData } from "../items/possession.js";
import { ReputationDataRoot } from "../items/reputation.js";
import { TraitDataRoot, Trait } from "../items/trait.js";
import { BWCharacterData } from "./BWCharacter.js";
import { NpcData } from "./Npc.js";
import { AffiliationDataRoot } from "../items/affiliation.js";

export class BWActor<T extends BWActorData = BWActorData> extends Actor<T, BWItem> {
    data: T;

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
            const trait = item as TraitDataRoot;
            if (trait.data.addsReputation) {
                const repData: NewItemData = {
                    name: trait.data.reputationName,
                    type: "reputation",
                    img: constants.defaultImages.reputation
                };
                repData["data.dice"] = trait.data.reputationDice;
                repData["data.infamous"] = trait.data.reputationInfamous;
                repData["data.description"] = trait.data.text;
                this.batchAddItem(repData);
            }
            if (trait.data.addsAffiliation) {
                const repData: NewItemData = {
                    name: trait.data.affiliationName,
                    type: "affiliation",
                    img: constants.defaultImages.affiliation
                };
                repData["data.dice"] = trait.data.affiliationDice;
                repData["data.description"] = trait.data.text;
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
        return this.data.forks.filter(s =>
            s.name !== skillName // skills reduced to 0 due to wounds can't be used as forks.
            && (s as unknown as SkillDataRoot).data.exp > ((this.data.data as BWCharacterData | NpcData).ptgs.woundDice || 0))
            .map( s => {
                const exp = (s as unknown as SkillDataRoot).data.exp;
                // skills at 7+ exp provide 2 dice in forks.
                return { name: s.name, amount: exp >= 7 ? 2 : 1 };
            });
    }

    getWildForks(skillName: string): { name: string, amount: number }[] {
        return this.data.wildForks.filter(s =>
            s.name !== skillName // skills reduced to 0 due to wounds can't be used as forks.
            && (s as unknown as SkillDataRoot).data.exp > ((this.data.data as BWCharacterData | NpcData).ptgs.woundDice || 0))
            .map( s => {
                const exp = (s as unknown as SkillDataRoot).data.exp;
                // skills at 7+ exp provide 2 dice in forks.
                return { name: s.name, amount: exp >= 7 ? 2 : 1 };
            });
    }

    private _addRollModifier(rollName: string, modifier: RollModifier, onlyNonZero = false) {
        rollName = rollName.toLowerCase();
        if (onlyNonZero && !modifier.dice && !modifier.obstacle) {
            return;
        }
        if (this.data.rollModifiers[rollName]) {
            this.data.rollModifiers[rollName].push(modifier);
        } else {
            this.data.rollModifiers[rollName] = [modifier];
        }
    }

    getRollModifiers(rollName: string): RollModifier[] {
        return (this.data.rollModifiers[rollName.toLowerCase()] || []).concat(this.data.rollModifiers.all || []);
    }

    private _addAptitudeModifier(name: string, modifier: number) {
        name = name.toLowerCase();
        if (Number.isInteger(this.data.aptitudeModifiers[name])) {
            this.data.aptitudeModifiers[name] += modifier;
        } else {
            this.data.aptitudeModifiers[name] = modifier;
        }
    }

    getAptitudeModifiers(name = ""): number {
        return this.data.aptitudeModifiers[name.toLowerCase()] || 0;
    }

    private _prepareActorData() {
        this.data.rollModifiers = {};
        this.data.callOns = {};
        this.data.aptitudeModifiers = {};
        
        this._calculateClumsyWeight();

        this.data.forks = [];
        this.data.wildForks = [];
        this.data.circlesBonus = [];
        this.data.circlesMalus = [];
        this.data.martialSkills = [];
        this.data.socialSkills = [];
        this.data.sorcerousSkills = [];
        this.data.toolkits = [];
        this.data.fightWeapons = [];
        
        if (this.data.items) {
            this.data.items.forEach(({ data }) => {
                const i: BWItemData = data;
                switch (i.type) {
                    case "skill":
                        if (!(i as SkillDataRoot).data.learning &&
                            !(i as SkillDataRoot).data.training) {
                            if ((i as SkillDataRoot).data.wildFork) {
                                this.data.wildForks.push(i as SkillDataRoot);
                            } else {
                                this.data.forks.push(i as SkillDataRoot);
                            }
                        }
                        if ((i as SkillDataRoot).data.skilltype === "martial" &&
                            !(i as SkillDataRoot).data.training) {
                            this.data.martialSkills.push(i as SkillDataRoot);
                        } else if ((i as SkillDataRoot).data.skilltype === "sorcerous") {
                            this.data.sorcerousSkills.push(i as SkillDataRoot);
                        } else if ((i as SkillDataRoot).data.skilltype === "social") {
                            this.data.socialSkills.push(i as SkillDataRoot);
                        }
                        break;
                    case "reputation":
                        const rep = i as ReputationDataRoot;
                        if (rep.data.infamous) {
                            this.data.circlesMalus.push({ name: rep.name, amount: rep.data.dice });
                        } else {
                            this.data.circlesBonus.push({ name: rep.name, amount: rep.data.dice });
                        }
                        break;
                    case "affiliation":
                        this.data.circlesBonus.push({ name: i.name, amount: (i as AffiliationDataRoot).data.dice });
                        break;
                    case "trait":
                        const t = i as TraitDataRoot;
                        if (t.data.traittype === "die") {
                            if (t.data.hasDieModifier && t.data.dieModifierTarget) {
                                t.data.dieModifierTarget.split(',').forEach(target =>
                                    this._addRollModifier(target.trim(), Trait.asRollDieModifier(t)));
                            }
                            if (t.data.hasObModifier && t.data.obModifierTarget) {
                                t.data.obModifierTarget.split(',').forEach(target =>
                                    this._addRollModifier(target.trim(), Trait.asRollObModifier(t)));
                            }
                        } if (t.data.traittype === "call-on") {
                            if (t.data.callonTarget) {
                                this._addCallon(t.data.callonTarget, t.name);
                            }
                        }
                        if (t.data.hasAptitudeModifier) {
                            t.data.aptitudeTarget.split(',').forEach((target) =>
                                this._addAptitudeModifier(target.trim(), t.data.aptitudeModifier));
                        }
                        break;
                    case "possession":
                        if ((i as PossessionRootData).data.isToolkit) {
                            this.data.toolkits.push(i as PossessionRootData);
                        }
                        break;
                    case "spell":
                    case "melee weapon":
                    case "ranged weapon":
                        this.data.fightWeapons.push(i);
                        break;
                }
            });
        }
    }

    private _addCallon(callonTarget: string, name: string) {
        callonTarget.split(',').forEach(s => {
            if (this.data.callOns[s.trim().toLowerCase()]) {
                this.data.callOns[s.trim().toLowerCase()].push(name);
            }
            else {
                this.data.callOns[s.trim().toLowerCase()] = [name];
            }
        });

    }

    getCallons(roll: string): string[] {
        return this.data.callOns[roll.toLowerCase()] || [];
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    _onCreate(data: any, options: any, userId: string): void {
        super._onCreate(data, options, userId);
        if (this.data.items.contents.length) {
            return; // this is most likely a duplicate of an existing actor. we don't need to add default items.
        }
        if (game.userId !== userId) {
            // we aren't the person who created this actor
            return;
        }
        this.createOwnedItem([
            { name: "Instinct 1", type: "instinct", data: {}, img: constants.defaultImages.instinct},
            { name: "Instinct 2", type: "instinct", data: {}, img: constants.defaultImages.instinct},
            { name: "Instinct 3", type: "instinct", data: {}, img: constants.defaultImages.instinct},
            { name: "Instinct Special", type: "instinct", data: {}, img: constants.defaultImages.instinct},
            { name: "Belief 1", type: "belief", data: {}, img: constants.defaultImages.belief},
            { name: "Belief 2", type: "belief", data: {}, img: constants.defaultImages.belief},
            { name: "Belief 3", type: "belief", data: {}, img: constants.defaultImages.belief},
            { name: "Belief Special", type: "belief", data: {}, img: constants.defaultImages.belief},
            { ...constants.bareFistData, img: "icons/equipment/hand/gauntlet-simple-leather-steel.webp" }
        ]);
    }

    async _preCreate(actor: BWActorData, _options: FoundryDocument.CreateOptions, user: User): Promise<void> {
        await super._preCreate(actor as T, _options, user);
        if (actor.type === 'character' || actor.type === 'npc') {
            this.data.token.update({
                disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
                vision: true
            });
        }
        if (actor.type === 'character' || actor.type === 'setting') {
            this.data.token.update({
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

        const charData = this.data.type === "character" ? this.data.data as BWCharacterData : undefined;

        this.data.items.filter<Armor>(i => (i.type === "armor" && i.data.data.equipped))
            .forEach(i => {
            const a = i.data;
            if (a.data.hasHelm) {
                    clumsyWeight.helmetObPenalty = a.data.perceptionObservationPenalty || 0;
            }
            if (a.data.hasTorso) {
                clumsyWeight.healthFortePenalty = Math.max(clumsyWeight.healthFortePenalty,
                    a.data.healthFortePenalty || 0);
                clumsyWeight.stealthyPenalty = Math.max(clumsyWeight.stealthyPenalty,
                    a.data.stealthyPenalty || 0);
            }
            if (a.data.hasLeftArm || a.data.hasRightArm) {
                clumsyWeight.agilityPenalty = Math.max(clumsyWeight.agilityPenalty,
                    a.data.agilityPenalty || 0);
                clumsyWeight.throwingShootingPenalty = Math.max(clumsyWeight.throwingShootingPenalty,
                    a.data.throwingShootingPenalty || 0);
            }
            if (a.data.hasLeftLeg || a.data.hasRightLeg) {
                clumsyWeight.speedDiePenalty = Math.max(clumsyWeight.speedDiePenalty,
                    a.data.speedDiePenalty || 0);
                clumsyWeight.speedObPenalty = Math.max(clumsyWeight.speedObPenalty,
                    a.data.speedObPenalty || 0);
                clumsyWeight.climbingPenalty = Math.max(clumsyWeight.climbingPenalty,
                    a.data.climbingPenalty || 0);
            }


            if (charData && !charData.settings.armorTrained &&
                (a.data.hasHelm || a.data.hasLeftArm || a.data.hasRightArm || a.data.hasTorso || a.data.hasLeftLeg || a.data.hasRightLeg)) {
                // if this is more than just a shield
                if (a.data.untrainedPenalty === "plate") {
                    clumsyWeight.untrainedAll = Math.max(clumsyWeight.untrainedAll, 2);
                    clumsyWeight.untrainedHealth = 0;
                } else if (a.data.untrainedPenalty === "heavy") {
                    clumsyWeight.untrainedAll = Math.max(clumsyWeight.untrainedAll, 1);
                    clumsyWeight.untrainedHealth = 0;
                } else if (a.data.untrainedPenalty === "light" && clumsyWeight.untrainedAll === 0) {
                    clumsyWeight.untrainedHealth = 1;
                }
            }
        });

        if (charData) { charData.clumsyWeight = clumsyWeight; }
        const baseModifier = { optional: true, label: "Armor Clumsy Weight" };
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
        this._addRollModifier("swimming", { obstacle: clumsyWeight.swimmingPenalty, ...baseModifier }, true);
        this._addRollModifier(
            "all",
            { obstacle: clumsyWeight.untrainedAll, label: "Untrained Armor Penalty", optional: true },
            true);

        this._addRollModifier(
            "health",
            { obstacle: clumsyWeight.untrainedHealth, label: "Untrained Armor", optional: true },
            true);
        this._addRollModifier(
            "forte",
            { obstacle: clumsyWeight.untrainedHealth, label: "Untrained Armor", optional: true },
            true);
    }

    public updateArthaForSkill(_skillId: string, persona: number, deeds: number): void {
        const updateData = {};
        updateData["data.deeds"] = this.data.data.deeds - (deeds ? 1 : 0);
        updateData["data.persona"] = this.data.data.persona - persona;
        this.update(updateData);
    }

    public updateArthaForStat(accessor: string, persona: number, deeds: number): void {
        const updateData = {};
        updateData["data.deeds"] = this.data.data.deeds - (deeds ? 1 : 0);
        updateData["data.persona"] = this.data.data.persona - persona;
        this.update(updateData);
    }
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

export interface BWActorData<T extends Common = Common> extends Actor.Data<T, BWItem> {
    aptitudeModifiers: StringIndexedObject<number>;
    toolkits: PossessionRootData[];
    martialSkills: SkillDataRoot[];
    socialSkills: SkillDataRoot[];
    sorcerousSkills: SkillDataRoot[];
    wildForks: SkillDataRoot[];

    circlesMalus: { name: string, amount: number }[];
    circlesBonus: { name: string, amount: number }[];
    items: DocumentCollection<BWItem>;
    forks: SkillDataRoot[];
    rollModifiers: { [rollName:string]: RollModifier[]; };
    callOns: { [rollName:string]: string[] };
    successOnlyRolls: string[];

    fightWeapons: BWItemData[];

    type: "character" | "npc" | "setting";

    data: T
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
