import { canAdvance, ShadeString, TestString, updateTestsNeeded } from "./helpers.js";
import { ArmorRootData, DisplayClass, ReputationRootData, Trait, TraitDataRoot } from "./items/item.js";
import { Skill, SkillDataRoot } from "./items/skill.js";

export class BWActor extends Actor {
    data!: CharacterDataRoot;

    prepareData() {
        super.prepareData();
        if (this.data.type === "character") {
            this._prepareCharacterData();
        }
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

    async addAttributeTest(
            stat: TracksTests,
            name: string,
            accessor: string,
            difficultyGroup: TestString,
            isSuccessful: boolean) {
        return this.addStatTest(stat, name, accessor, difficultyGroup, isSuccessful, true);
    }
    async addStatTest(
            stat: TracksTests,
            name: string,
            accessor: string,
            difficultyGroup: TestString,
            isSuccessful: boolean,
            routinesNeeded: boolean = false) {
        const onlySuccessCounts = name === "Resources" || name === "Faith" || name === "Perception";

        if ((onlySuccessCounts && isSuccessful) || !onlySuccessCounts) {
            this._addTestToStat(stat, accessor, difficultyGroup);
        }

        if (canAdvance(stat, routinesNeeded)) {
            Dialog.confirm({
                title: `Advance ${name}?`,
                content: `<p>${name} is ready to advance. Go ahead?</p>`,
                yes: () => this._advanceStat(accessor, parseInt(stat.exp, 10) + 1),
                // tslint:disable-next-line: no-empty
                no: () => {},
                defaultYes: true
            });
        }
    }

    async updatePtgs() {
        const accessorBase = "data.ptgs.wound";
        const forte = parseInt(this.data.data.forte.exp, 10) || 1;
        const mw = this.data.data.mortalWound || 15;
        const su = Math.floor(forte / 2) + 1;

        const wounds = this._calculateThresholds(mw, su, forte);
        const updateData = {};
        let woundType = "bruise";
        for (let i = 1; i <= 16; i ++ ) {
            if (i < wounds.su) {
                woundType = "bruise";
            } else if (i < wounds.li) {
                woundType = "superficial";
            } else if (i < wounds.mi) {
                woundType = "light";
            } else if (i < wounds.se) {
                woundType = "midi";
            } else if (i < wounds.tr) {
                woundType = "severe";
            } else if (i < wounds.mo) {
                woundType = "traumatic";
            } else {
                woundType = "mortal";
            }
            updateData[`${accessorBase}${i}.threshold`] = woundType;
        }
        return this.update(updateData);
    }

    taxResources(amount: number, maxFundLoss: number): void {
        const updateData = {};
        let resourcesTax = parseInt(this.data.data.resourcesTax, 10) || 0;
        const resourceExp = parseInt(this.data.data.resources.exp, 10) || 0;
        const fundDice = parseInt(this.data.data.funds, 10) || 0;
        if (amount <= maxFundLoss) {
            updateData["data.funds"] = fundDice - amount;
        } else {
            updateData["data.funds"] = 0;
            amount -= maxFundLoss;
            resourcesTax = Math.min(resourceExp, amount+resourcesTax);
            updateData["data.resourcesTax"] = resourcesTax;
            if (resourcesTax === resourceExp) {
                // you taxed all your resources away, they degrade
                new Dialog({
                    title: "Overtaxed Resources!",
                    content: "<p>Tax has reduced your resources exponent to 0.</p><hr>",
                    buttons: {
                        reduce: {
                            label: "Reduce exponent by 1",
                            callback: () => {
                                resourcesTax --;
                                this.update({
                                    "data.resourcesTax": resourcesTax,
                                    "data.resources.exp": resourcesTax,
                                    "data.resources.routine": 0,
                                    "data.resources.difficult": 0,
                                    "data.resources.challening": 0
                                });
                            }
                        },
                        ignore: {
                            label: "Ignore for now"
                        }
                    }
                }).render(true);
            }
        }
        this.update(updateData);
    }

    private _addRollModifier(rollName: string, modifier: RollModifier, onlyNonZero: boolean = false) {
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

    getRollModifiers(rollName: string) {
        return (this.data.rollModifiers[rollName.toLowerCase()] || []).concat(this.data.rollModifiers.all || []);
    }

    private _calculateThresholds(mo: number, su: number, forte: number):
        { su: number, li: number, mi: number, se: number, tr: number, mo: number } {
        const maxGap = Math.ceil(forte / 2.0);
        const tr = Math.min(mo - 1, su + (maxGap * 4));
        const se = Math.min(tr - 1, su + (maxGap * 3));
        const mi = Math.min(se - 1, su + (maxGap * 2));
        const li = Math.min(mi - 1, su + (maxGap * 1));

        return { su, li, mi, se, tr, mo };
    }

    private async _addTestToStat(stat: TracksTests, accessor: string, difficultyGroup: TestString) {
        let testNumber = 0;
        const updateData = {};
        switch (difficultyGroup) {
            case "Challenging":
                testNumber = parseInt(stat.challenging, 10);
                if (testNumber < (stat.challengingNeeded || 0)) {
                    updateData[`${accessor}.challenging`] = testNumber +1;
                    stat.challenging = `${testNumber+1}`;
                    return this.update(updateData, {});
                }
                break;
            case "Difficult":
                testNumber = parseInt(stat.difficult, 10);
                if (testNumber < (stat.difficultNeeded || 0)) {
                    updateData[`${accessor}.difficult`] = testNumber +1;
                    stat.difficult = `${testNumber+1}`;
                    return this.update(updateData, {});
                }
                break;
            case "Routine":
                testNumber = parseInt(stat.routine, 10);
                if (testNumber < (stat.routineNeeded || 0)) {
                    updateData[`${accessor}.routine`] = testNumber +1;
                    stat.routine = `${testNumber+1}`;
                    return this.update(updateData, {});
                }
                break;
            case "Routine/Difficult":
                testNumber = parseInt(stat.difficult, 10);
                if (testNumber < (stat.difficultNeeded || 0)) {
                    updateData[`${accessor}.difficult`] = testNumber +1;
                    stat.difficult = `${testNumber+1}`;
                    return this.update(updateData, {});
                } else {
                    testNumber = parseInt(stat.routine, 10);
                    if (testNumber < (stat.routineNeeded || 0)) {
                        updateData[`${accessor}.routine`] = testNumber +1;
                        stat.routine = `${testNumber+1}`;
                        return this.update(updateData, {});
                    }
                }
                break;
        }
    }
    private async _advanceStat(accessor: string, newExp: number) {
        const updateData = {};
        updateData[`${accessor}.routine`] = 0;
        updateData[`${accessor}.difficult`] = 0;
        updateData[`${accessor}.challenging`] = 0;
        updateData[`${accessor}.exp`] = newExp;
        return this.update(updateData);
    }

    private _prepareCharacterData() {
        this.data.rollModifiers = {};
        this._calculatePtgs();
        this._calculateClumsyWeight();
        const woundDice = this.data.data.ptgs.woundDice || 0;
        updateTestsNeeded(this.data.data.will, false, woundDice);
        updateTestsNeeded(this.data.data.power, false, woundDice);
        updateTestsNeeded(this.data.data.perception, false, woundDice);
        updateTestsNeeded(this.data.data.agility, false, woundDice);
        updateTestsNeeded(this.data.data.forte, false, woundDice);
        updateTestsNeeded(this.data.data.speed, false, woundDice);
        updateTestsNeeded(this.data.data.health);
        updateTestsNeeded(this.data.data.steel, true, woundDice);
        updateTestsNeeded(this.data.data.circles);
        updateTestsNeeded(this.data.data.resources, true, -1);
        updateTestsNeeded(this.data.data.custom1);
        updateTestsNeeded(this.data.data.custom2);

        this.data.data.reflexesExp = Math.floor((parseInt(this.data.data.perception.exp, 10) +
            parseInt(this.data.data.agility.exp, 10) +
            parseInt(this.data.data.speed.exp, 10)) / 3) -
            (this.data.data.ptgs.woundDice || 0);

        this.data.data.mortalWound = Math.floor((parseInt(this.data.data.power.exp, 10) +
            parseInt(this.data.data.forte.exp, 10)) / 2 + 6);
        this.data.data.hesitation = 10 - parseInt(this.data.data.will.exp, 10);

        this.data.forks = [];
        this.data.circlesBonus = [];
        this.data.circlesMalus = [];
        if (this.data.items) {
            this.data.items.forEach(i => {
                switch (i.type) {
                    case "skill":
                        if (!(i as unknown as SkillDataRoot).data.learning) {
                            this.data.forks.push(i);
                        }
                        if (i.name === "Armor Training") {
                            this.data.armorTrained = true;
                        }
                        break;
                    case "reputation":
                        const rep = i as unknown as ReputationRootData;
                        if (rep.data.infamous) {
                            this.data.circlesMalus.push({ name: rep.name, amount: parseInt(rep.data.dice, 10) });
                        } else {
                            this.data.circlesBonus.push({ name: rep.name, amount: parseInt(rep.data.dice, 10) });
                        }
                        break;
                    case "affiliation":
                        this.data.circlesBonus.push({ name: i.name, amount: parseInt((i as any).data.dice, 10) });
                        break;
                    case "trait":
                        const t = i as unknown as TraitDataRoot;
                        if (t.data.traittype === "die") {
                            if (t.data.hasDieModifier && t.data.dieModifierTarget) {
                                t.data.dieModifierTarget.split(',').forEach(target =>
                                    this._addRollModifier(target.trim(), Trait.asRollDieModifier(t)));
                            }
                            if (t.data.hasObModifier && t.data.obModifierTarget) {
                                t.data.obModifierTarget.split(',').forEach(target =>
                                    this._addRollModifier(target.trim(), Trait.asRollObModifier(t)));
                            }
                        }
                        break;
                }
            });
        }
    }

    private _calculatePtgs() {
        let suCount = 0;
        let woundDice = 0;
        this.data.data.ptgs.obPenalty = 0;
        Object.entries(this.data.data.ptgs).forEach(([key, value]) => {
            const w = value as Wound;
            const a = w.amount && parseInt(w.amount[0], 10);
            if ((w && a)) {
                switch (w.threshold) {
                    case "superficial": suCount += a; break;
                    case "light": woundDice += a; break;
                    case "midi": woundDice += a*2; break;
                    case "severe": woundDice += a*3; break;
                    case "traumatic": woundDice += a*4; break;
                }
            }
        });

        if (suCount >= 3) {
            woundDice ++;
        } else if (!this.data.data.ptgs.shrugging && suCount >= 1) {
            this.data.data.ptgs.obPenalty = 1;
        }
        if (this.data.data.ptgs.gritting && woundDice) {
            woundDice --;
        }

        this.data.data.ptgs.woundDice = woundDice;
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


            if ((a.data.hasHelm || a.data.hasLeftArm || a.data.hasRightArm || a.data.hasTorso
                || a.data.hasLeftLeg || a.data.hasRightLeg ) && !this.data.armorTrained) {
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

        this.data.data.clumsyWeight = clumsyWeight;
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

export interface CharacterDataRoot extends ActorData {
    circlesMalus: { name: string, amount: number }[];
    circlesBonus: { name: string, amount: number }[];
    data: BWCharacterData;
    items: Item[];
    forks: Skill[];
    armorTrained: boolean;
    rollModifiers: { [rollName:string]: RollModifier[]; };
}

interface BWCharacterData extends Common, DisplayProps, Ptgs {
    stock: string;
    age: number;
    lifepathString: string;
    alias: string;
    homeland: string;
    features: string;

    beliefs: Item[];
    instincts: Item[];
    traits: Item[];
    skills: Skill[];

    hesitation?: number;
    mortalWound?: number;
    reflexesExp?: number;
    reflexesShade?: string;

    clumsyWeight?: ClumsyWeightData;
}

interface Common {
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
    mountedstride: number;
    cash: string;
    funds: string;
    property: string;
    loans: string;
    debt: string;
    willTax: string;
    resourcesTax: string;
    fate: string;
    persona: string;
    deeds: string;
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
    collapseSkills: boolean;
    collapsePtgs: boolean;
}

interface Ptgs {
    ptgs: {
        wound1: Wound, wound2: Wound, wound3: Wound, wound4: Wound,
        wound5: Wound, wound6: Wound, wound7: Wound, wound8: Wound,
        wound9: Wound, wound10: Wound, wound11: Wound, wound12: Wound,
        wound13: Wound, wound14: Wound, wound15: Wound, wound16: Wound,
        woundNotes1: string,
        woundNotes2: string,
        woundNotes3: string,
        shrugging: boolean, // shrug it off is active
        gritting: boolean, // grit your teeth is active

        // not persisted
        obPenalty?: number,
        woundDice?: number
    };
}

interface Wound {
    amount: string[]; // quirk relating to how radio button data is stored
    threshold: string;
}

interface ClumsyWeightData {
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