import { ShadeString, StringIndexedObject } from "./helpers.js";
import { ArmorRootData, DisplayClass, ItemType, Trait, TraitDataRoot, ReputationDataRoot, PossessionRootData, BWItemData } from "./items/item.js";
import { SkillDataRoot } from "./items/skill.js";
import * as constants from "./constants.js";
import { CharacterBurnerDialog } from "./dialogs/character-burner.js";

export class BWActor extends Actor {
    data!: BWActorDataRoot;

    async processNewItem(item: ItemData): Promise<unknown> {
        if (item.type === "trait") {
            const trait = item as TraitDataRoot;
            if (trait.data.addsReputation) {
                const repData: NewItemData = {
                    name: trait.data.reputationName,
                    type: "reputation"
                };
                repData["data.dice"] = trait.data.reputationDice;
                repData["data.infamous"] = trait.data.reputationInfamous;
                repData["data.description"] = trait.data.text;
                return this.createOwnedItem(repData);
            }
            if (trait.data.addsAffiliation) {
                const repData: NewItemData = {
                    name: trait.data.affiliationName,
                    type: "affiliation"
                };
                repData["data.dice"] = trait.data.affiliationDice;
                repData["data.description"] = trait.data.text;
                return this.createOwnedItem(repData);
            }
        }
    }

    async createOwnedItem(itemData: NewItemData | NewItemData[], options?: Record<string, unknown>): Promise<Item> {
        return super.createOwnedItem(itemData, options);
    }

    prepareData(): void {
        super.prepareData();
        if (this.data.type === "character") {
            BWCharacter.prototype.bindCharacterFunctions.call(this);
        } else {
            Npc.prototype.bindNpcFunctions.call(this);
        }

        this._prepareActorData();
        this.prepareTypeSpecificData();
    }

    getForkOptions(skillName: string): { name: string, amount: number }[] {
        return this.data.forks.filter(s =>
            s.name !== skillName // skills reduced to 0 due to wounds can't be used as forks.
            && parseInt((s as unknown as SkillDataRoot).data.exp, 10) > (this.data.data.ptgs.woundDice || 0))
            .map( s => {
                const exp = parseInt((s as unknown as SkillDataRoot).data.exp, 10);
                // skills at 7+ exp provide 2 dice in forks.
                return { name: s.name, amount: exp >= 7 ? 2 : 1 };
            });
    }

    getWildForks(skillName: string): { name: string, amount: number }[] {
        return this.data.wildForks.filter(s =>
            s.name !== skillName // skills reduced to 0 due to wounds can't be used as forks.
            && parseInt((s as unknown as SkillDataRoot).data.exp) > (this.data.data.ptgs.woundDice || 0))
            .map( s => {
                const exp = parseInt((s as unknown as SkillDataRoot).data.exp, 10);
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

    prepareTypeSpecificData(): void { return; }

    private _prepareActorData() {
        this.data.rollModifiers = {};
        this.data.callOns = {};
        
        this._calculateClumsyWeight();

        this.data.forks = [];
        this.data.wildForks = [];
        this.data.circlesBonus = [];
        this.data.circlesMalus = [];
        this.data.martialSkills = [];
        this.data.sorcerousSkills = [];
        this.data.toolkits = [];
        if (this.data.items) {
            this.data.items.forEach((i) => {
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
                            this.data.martialSkills.push(i);
                        } else if ((i as SkillDataRoot).data.skilltype === "sorcerous") {
                            this.data.sorcerousSkills.push(i);
                        }
                        break;
                    case "reputation":
                        const rep = i as ReputationDataRoot;
                        if (rep.data.infamous) {
                            this.data.circlesMalus.push({ name: rep.name, amount: parseInt(rep.data.dice, 10) });
                        } else {
                            this.data.circlesBonus.push({ name: rep.name, amount: parseInt(rep.data.dice, 10) });
                        }
                        break;
                    case "affiliation":
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        this.data.circlesBonus.push({ name: i.name, amount: parseInt((i as any).data.dice, 10) });
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
                        break;
                    case "possession":
                        if ((i as PossessionRootData).data.isToolkit) {
                            this.data.toolkits.push(i);
                        }
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
    _onCreate(data: any, options: any, userId: string, context: any): void {
        super._onCreate(data, options, userId, context);
        this.createOwnedItem([
            { name: "Instinct 1", type: "instinct", data: {}},
            { name: "Instinct 2", type: "instinct", data: {}},
            { name: "Instinct 3", type: "instinct", data: {}},
            { name: "Instinct Special", type: "instinct", data: {}},
            { name: "Belief 1", type: "belief", data: {}},
            { name: "Belief 2", type: "belief", data: {}},
            { name: "Belief 3", type: "belief", data: {}},
            { name: "Belief Special", type: "belief", data: {}}
        ]);
        this.createOwnedItem(constants.bareFistData);

        if (this.data.type === "character") {
            const character = this as unknown as BWCharacter & BWActor;
            setTimeout(() => {
                if (character.data.data.settings.showBurner) {
                    new Dialog({
                        title: "Launch Burner?",
                        content: "This is a new character. Would you like to launch the character burner?",
                        buttons: {
                            yes: {
                                label: "Yes",
                                callback: () => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    CharacterBurnerDialog.Open(this as any);
                                }
                            },
                            later: {
                                label: "Later"
                            },
                            never: {
                                label: "No",
                                callback: () => {
                                    this.update({ "data.settings.showBurner": false });
                                }
                            }
                        }
                    }).render(true);
                }
            }, 500);
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

        const asCharacter = this.data.type === "character" ? this as unknown as BWActor & BWCharacter : undefined;

        this.data.items.filter(i => i.type === "armor" && (i as unknown as ArmorRootData).data.equipped)
            .forEach(i => {
            const a = i as unknown as ArmorRootData;
            if (a.data.hasHelm) {
                    clumsyWeight.helmetObPenalty = parseInt(a.data.perceptionObservationPenalty, 10) || 0;
            }
            if (a.data.hasTorso) {
                clumsyWeight.healthFortePenalty = Math.max(clumsyWeight.healthFortePenalty,
                    parseInt(a.data.healthFortePenalty, 10) || 0);
                clumsyWeight.stealthyPenalty = Math.max(clumsyWeight.stealthyPenalty,
                    parseInt(a.data.stealthyPenalty, 10) || 0);
            }
            if (a.data.hasLeftArm || a.data.hasRightArm) {
                clumsyWeight.agilityPenalty = Math.max(clumsyWeight.agilityPenalty,
                    parseInt(a.data.agilityPenalty, 10) || 0);
                clumsyWeight.throwingShootingPenalty = Math.max(clumsyWeight.throwingShootingPenalty,
                    parseInt(a.data.throwingShootingPenalty, 10) || 0);
            }
            if (a.data.hasLeftLeg || a.data.hasRightLeg) {
                clumsyWeight.speedDiePenalty = Math.max(clumsyWeight.speedDiePenalty,
                    parseInt(a.data.speedDiePenalty, 10) || 0);
                clumsyWeight.speedObPenalty = Math.max(clumsyWeight.speedObPenalty,
                    parseInt(a.data.speedObPenalty, 10) || 0);
                clumsyWeight.climbingPenalty = Math.max(clumsyWeight.climbingPenalty,
                    parseInt(a.data.climbingPenalty, 10) || 0);
            }


            if (asCharacter && !asCharacter.data.data.settings.armorTrained &&
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

        if (asCharacter) { asCharacter.data.data.clumsyWeight = clumsyWeight; }
        const baseModifier = { optional: true, label: "Clumsy Weight" };
        this._addRollModifier("climbing", { obstacle: clumsyWeight.climbingPenalty, ...baseModifier }, true);
        this._addRollModifier("perception", { obstacle: clumsyWeight.helmetObPenalty,  ...baseModifier }, true);
        this._addRollModifier("observation", { obstacle: clumsyWeight.helmetObPenalty, ...baseModifier }, true);
        this._addRollModifier("shooting", { obstacle: clumsyWeight.throwingShootingPenalty,  ...baseModifier }, true);
        this._addRollModifier("bow", { obstacle: clumsyWeight.throwingShootingPenalty, ...baseModifier }, true);
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
            { obstacle: clumsyWeight.untrainedAll, label: "Untrained Armor", optional: true },
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
    cash: string;
    funds: string;
    property: string;
    loans: string;
    debt: string;

    willTax: number;
    forteTax: number;

    resourcesTax: string;
    fate: string;
    persona: string;
    deeds: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BWActorDataRoot extends ActorData<BWCharacterData | NpcData> {
    toolkits: PossessionRootData[];
    martialSkills: SkillDataRoot[];
    sorcerousSkills: SkillDataRoot[];
    wildForks: SkillDataRoot[];

    circlesMalus: { name: string, amount: number }[];
    circlesBonus: { name: string, amount: number }[];
    items: BWItemData[];
    forks: SkillDataRoot[];
    rollModifiers: { [rollName:string]: RollModifier[]; };
    callOns: { [rollName:string]: string[] };
    successOnlyRolls: string[];

    type: "character" | "npc";
}

export interface Ability extends TracksTests, DisplayClass {
    shade: ShadeString;
    open: boolean;
}

export interface TracksTests {
    exp: string;
    routine: string;
    difficult: string;
    challenging: string;
    persona: string;
    fate: string;
    deeds: string;

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

// ====================== Character Class ===============================
import { BWCharacter, BWCharacterData } from "./character.js";
import { Npc, NpcData } from "./npc.js";
export * from "./character.js";