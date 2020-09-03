import { Common, DisplayProps, ClumsyWeightData, TracksTests, BWActorDataRoot } from "./bwactor.js";
import { ShadeString, TestString, canAdvance, updateTestsNeeded, getWorstShadeString } from "./helpers.js";

export class BWCharacter extends Actor<BWCharacterData>{
    data: CharacterDataRoot;

    bindCharacterFunctions(): void {
        this.addStatTest = BWCharacter.prototype.addStatTest.bind(this);
        this.addAttributeTest = BWCharacter.prototype.addAttributeTest.bind(this);
        this._addTestToStat = BWCharacter.prototype._addTestToStat.bind(this);
        this.taxResources = BWCharacter.prototype.taxResources.bind(this);
        this._advanceStat = BWCharacter.prototype._advanceStat.bind(this);
        this.prepareTypeSpecificData = BWCharacter.prototype.prepareTypeSpecificData.bind(this);
        this.updatePtgs = BWCharacter.prototype.updatePtgs.bind(this);
        this._calculatePtgs = BWCharacter.prototype._calculatePtgs.bind(this);
    }

    prepareTypeSpecificData(): void {
        if (!this.data.data.settings) {
            this.data.data.settings = {
                onlySuccessesCount: 'Faith, Resources, Perception',
                showSettings: false,
                roundUpHealth: false,
                roundUpMortalWound: false,
                roundUpReflexes: false,
                armorTrained: false,
                ignoreSuperficialWounds: false,
                showBurner: false
            };
        }

        this._calculatePtgs();

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

        this.data.data.maxSustained = parseInt(this.data.data.will.exp) - (this.data.data.ptgs.woundDice || 0) - 1;
        this.data.data.maxObSustained = parseInt(this.data.data.forte.exp) - (this.data.data.ptgs.woundDice || 0) - this.data.data.forteTax - 1;

        const unRoundedReflexes =
            (parseInt(this.data.data.perception.exp, 10) +
            parseInt(this.data.data.agility.exp, 10) +
            parseInt(this.data.data.speed.exp, 10)) / 3.0;
        this.data.data.reflexesExp = (this.data.data.settings.roundUpReflexes ?
            Math.ceil(unRoundedReflexes) : Math.floor(unRoundedReflexes))
            - (this.data.data.ptgs.woundDice || 0);
        const shades = [this.data.data.perception.shade, this.data.data.agility.shade, this.data.data.speed.shade];
        this.data.data.reflexesShade = getWorstShadeString(getWorstShadeString(shades[0], shades[1]), shades[2]);
        if (this.data.data.reflexesShade === "B") {
            this.data.data.reflexesExp += shades.filter(s => s !== "B").length;
        } else if (this.data.data.reflexesShade === "G") {
            this.data.data.reflexesExp += shades.filter(s => s === "W").length;
        }

        const unRoundedMortalWound =
            (parseInt(this.data.data.power.exp, 10) + parseInt(this.data.data.forte.exp, 10)) / 2 + 6;
        this.data.data.mortalWound = this.data.data.settings.roundUpMortalWound ?
            Math.ceil(unRoundedMortalWound) : Math.floor(unRoundedMortalWound);
        if (this.data.data.power.shade !== this.data.data.forte.shade) {
            this.data.data.mortalWound += 1;
        }
        this.data.data.mortalWoundShade = getWorstShadeString(this.data.data.power.shade, this.data.data.forte.shade);

        this.data.data.hesitation = 10 - parseInt(this.data.data.will.exp, 10);

        this.data.successOnlyRolls = (this.data.data.settings.onlySuccessesCount || '')
            .split(',')
            .map(s => s.trim().toLowerCase());
    }

    async updatePtgs(): Promise<this> {
        const accessorBase = "data.ptgs.wound";
        const forte = parseInt(this.data.data.forte.exp, 10) || 1;
        const mw = this.data.data.mortalWound || 15;
        const su = Math.floor(forte / 2) + 1;

        const wounds = BWCharacter._calculateThresholds(mw, su, forte);
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

    private _calculatePtgs() {
        let suCount = 0;
        let woundDice = 0;
        this.data.data.ptgs.obPenalty = 0;
        Object.entries(this.data.data.ptgs).forEach(([_key, value]) => {
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
        } else if (!this.data.data.ptgs.shrugging && suCount >= 1 && !this.data.data.settings.ignoreSuperficialWounds) {
            this.data.data.ptgs.obPenalty = 1;
        }
        if (this.data.data.ptgs.gritting && woundDice) {
            woundDice --;
        }

        this.data.data.ptgs.woundDice = woundDice;
    }

    private static _calculateThresholds(mo: number, su: number, forte: number):
        { su: number, li: number, mi: number, se: number, tr: number, mo: number } {
        const maxGap = Math.ceil(forte / 2.0);
        const tr = Math.min(mo - 1, su + (maxGap * 4));
        const se = Math.min(tr - 1, su + (maxGap * 3));
        const mi = Math.min(se - 1, su + (maxGap * 2));
        const li = Math.min(mi - 1, su + (maxGap));

        return { su, li, mi, se, tr, mo };
    }

    async addStatTest(
            stat: TracksTests,
            name: string,
            accessor: string,
            difficultyGroup: TestString,
            isSuccessful: boolean,
            routinesNeeded = false): Promise<void> {
        name = name.toLowerCase();
        const onlySuccessCounts = this.data.successOnlyRolls.indexOf(name) !== -1;
        if (onlySuccessCounts && !isSuccessful) {
            return;
        }

        this._addTestToStat(stat, accessor, difficultyGroup);
        if (canAdvance(stat, routinesNeeded)) {
            Dialog.confirm({
                title: `Advance ${name}?`,
                content: `<p>${name} is ready to advance. Go ahead?</p>`,
                yes: () => this._advanceStat(accessor, parseInt(stat.exp, 10) + 1),
                no: () => { return; },
                defaultYes: true
            });
        }
    }

    async addAttributeTest(
            stat: TracksTests,
            name: string,
            accessor: string,
            difficultyGroup: TestString,
            isSuccessful: boolean): Promise<void>  {
        return this.addStatTest(stat, name, accessor, difficultyGroup, isSuccessful, true);
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
                                    "data.resources.challenging": 0
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

    private async _advanceStat(accessor: string, newExp: number) {
        const updateData = {};
        updateData[`${accessor}.routine`] = 0;
        updateData[`${accessor}.difficult`] = 0;
        updateData[`${accessor}.challenging`] = 0;
        updateData[`${accessor}.exp`] = newExp;
        return this.update(updateData);
    }
}

export interface CharacterDataRoot extends BWActorDataRoot, ActorData<BWCharacterData> {
    data: BWCharacterData;
    type: "character"
}

export interface BWCharacterData extends Common, DisplayProps, Ptgs, SpellsMaintainedInfo {
    stock: string;
    age: number;
    lifepathString: string;
    alias: string;
    homeland: string;
    features: string;

    settings: CharacterSettings;

    hesitation?: number;
    mortalWound?: number;
    mortalWoundShade?: ShadeString;
    reflexesExp?: number;
    reflexesShade?: ShadeString;

    clumsyWeight?: ClumsyWeightData;
}

export interface CharacterSettings {
    showSettings: boolean;
    showBurner: boolean;

    roundUpMortalWound: boolean;
    roundUpHealth: boolean;
    roundUpReflexes: boolean;
    onlySuccessesCount: string;
    armorTrained: boolean;
    ignoreSuperficialWounds: boolean;
}

export interface SpellsMaintainedInfo {
    sustainedSpell1: string;
    sustainedSpell1Ob: number;
    sustainedSpell2: string;
    sustainedSpell2Ob: number;
    sustainedSpell3: string;
    sustainedSpell3Ob: number;
    sustainedSpell4: string;
    sustainedSpell5: string;

    maxSustained?: number;
    maxObSustained?: number;
}

export interface Ptgs {
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