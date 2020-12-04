import { Common, DisplayProps, ClumsyWeightData, TracksTests, BWActorDataRoot, Ability, BWActor, NewItemData } from "./BWActor.js";
import { CharacterBurnerDialog } from "../dialogs/CharacterBurnerDialog.js";
import { ShadeString, TestString, canAdvance, updateTestsNeeded, getWorstShadeString, StringIndexedObject } from "../helpers.js";
import { BWItem, BWItemData } from "../items/item.js";
import { Skill } from "../items/skill.js";
import { DifficultyDialog } from "../dialogs/DifficultyDialog.js";

export class BWCharacter extends BWActor{
    data: CharacterDataRoot;

    // eslint-disable-next-line @typescript-eslint/ban-types
    async update(data: object, options?: object): Promise<this> {
        const updateAptitude = this._statsHaveChanged(data as unknown as StringIndexedObject<string>);
        const self = super.update(data, options);
        if (updateAptitude) {
            for (let i = 0; i < this.data.items.length; i ++) {
                const item = this.data.items[i];
                if (item.type === "skill" && item.data.learning) {
                    await this.getOwnedItem((this.data.items[i] as BWItemData & { _id: string })._id)
                    ?.update({ name: this.data.items[i].name }, { diff: false}); // force
                }
            }
        }
        return self;
    }

    prepareData(): void {
        super.prepareData();
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
        updateTestsNeeded(this.data.data.will, false, woundDice, this.data.data.willTax);
        updateTestsNeeded(this.data.data.power, false, woundDice);
        updateTestsNeeded(this.data.data.perception, false, woundDice);
        updateTestsNeeded(this.data.data.agility, false, woundDice);
        updateTestsNeeded(this.data.data.forte, false, woundDice, this.data.data.forteTax);
        updateTestsNeeded(this.data.data.speed, false, woundDice);
        updateTestsNeeded(this.data.data.health);
        updateTestsNeeded(this.data.data.steel, true, woundDice);
        updateTestsNeeded(this.data.data.circles);
        updateTestsNeeded(this.data.data.resources, true, -1);
        updateTestsNeeded(this.data.data.custom1);
        updateTestsNeeded(this.data.data.custom2);

        this.data.data.maxSustained = this.data.data.will.exp - (this.data.data.ptgs.woundDice || 0) - 1;
        this.data.data.maxObSustained = this.data.data.forte.exp - (this.data.data.ptgs.woundDice || 0) - this.data.data.forteTax - 1;

        const unRoundedReflexes =
            (this.data.data.perception.exp +
            this.data.data.agility.exp +
            this.data.data.speed.exp) / 3.0;
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
            (this.data.data.power.exp + this.data.data.forte.exp) / 2 + 6;
        this.data.data.mortalWound = this.data.data.settings.roundUpMortalWound ?
            Math.ceil(unRoundedMortalWound) : Math.floor(unRoundedMortalWound);
        if (this.data.data.power.shade !== this.data.data.forte.shade) {
            this.data.data.mortalWound += 1;
        }
        this.data.data.mortalWoundShade = getWorstShadeString(this.data.data.power.shade, this.data.data.forte.shade);

        this.data.data.hesitation = 10 - this.data.data.will.exp;
        if (this.data.data.will.shade === "G") {
            this.data.data.hesitation -= 2;
        }
        if (this.data.data.will.shade === "W") {
            this.data.data.hesitation -= 3;
        }

        this.data.successOnlyRolls = (this.data.data.settings.onlySuccessesCount || '')
            .split(',')
            .map(s => s.trim().toLowerCase());
    }

    async updatePtgs(): Promise<this> {
        const accessorBase = "data.ptgs.wound";
        const forte = this.data.data.forte.exp || 1;
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
            const a = w && w.amount && parseInt(w.amount[0], 10);
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

        woundDice = Math.max(0,
            woundDice - (this.data.data.ptgs.woundRecovery1 || 0) - (this.data.data.ptgs.woundRecovery2 || 0) - (this.data.data.ptgs.woundRecovery3 || 0));

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
            routinesNeeded = false,
            force = false): Promise<void> {
        const difficultyDialog = game.burningwheel.difficultyDialog as DifficultyDialog | undefined;
        if (!force || difficultyDialog?.extendedTest) {
            console.log("Deferring tracking.");
            return;
        }

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
                yes: () => this._advanceStat(accessor, stat.exp + 1),
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

    public updateArthaForSkill(skillId: string, persona: number, deeds: number): void {
        this.update({
            "data.deeds": this.data.data.deeds - deeds,
            "data.persona": this.data.data.persona - persona,
        });
        const skill = this.getOwnedItem(skillId) as Skill;
        skill.update({
            "data.deeds": deeds ? (skill.data.data.deeds || 0) + 1 : undefined,
            "data.persona": skill.data.data.persona + persona
        }, {});
    }

    public updateArthaForStat(accessor: string, persona: number, deeds: number): void {
        const stat = getProperty(this.data, accessor) as Ability;
        const updateData = {
            "data.deeds": this.data.data.deeds - (deeds ? 1 : 0),
            "data.persona": this.data.data.persona - persona,
        };
        updateData[`${accessor}.deeds`] = deeds ? (stat.deeds || 0) + 1 : undefined;
        updateData[`${accessor}.persona`] = (stat.persona || 0) + persona;
        this.update(updateData);
    }

    private async _addTestToStat(stat: TracksTests, accessor: string, difficultyGroup: TestString) {
        let testNumber = 0;
        const updateData = {};
        switch (difficultyGroup) {
            case "Challenging":
                testNumber = stat.challenging;
                if (testNumber < (stat.challengingNeeded || 0)) {
                    updateData[`${accessor}.challenging`] = testNumber +1;
                    stat.challenging = testNumber+1;
                    return this.update(updateData, {});
                }
                break;
            case "Difficult":
                testNumber = stat.difficult;
                if (testNumber < (stat.difficultNeeded || 0)) {
                    updateData[`${accessor}.difficult`] = testNumber +1;
                    stat.difficult = testNumber+1;
                    return this.update(updateData, {});
                }
                break;
            case "Routine":
                testNumber = stat.routine;
                if (testNumber < (stat.routineNeeded || 0)) {
                    updateData[`${accessor}.routine`] = testNumber +1;
                    stat.routine = testNumber;
                    return this.update(updateData, {});
                }
                break;
            case "Routine/Difficult":
                testNumber = stat.difficult;
                if (testNumber < (stat.difficultNeeded || 0)) {
                    updateData[`${accessor}.difficult`] = testNumber +1;
                    stat.difficult = testNumber+1;
                    return this.update(updateData, {});
                } else {
                    testNumber = stat.routine;
                    if (testNumber < (stat.routineNeeded || 0)) {
                        updateData[`${accessor}.routine`] = testNumber +1;
                        stat.routine = testNumber+1;
                        return this.update(updateData, {});
                    }
                }
                break;
        }
    }

    private _statsHaveChanged(data: StringIndexedObject<string>): boolean {
        return [
            "data.forte.exp",
            "data.will.exp",
            "data.power.exp",
            "data.perception.exp",
            "data.speed.exp",
            "data.agility.exp"
        ].some(accessor => {
            return data[accessor] && getProperty(this.data, accessor) !== data[accessor];
        });
    }

    taxResources(amount: number, maxFundLoss: number): void {
        const updateData = {};
        let resourcesTax = parseInt(this.data.data.resourcesTax, 10) || 0;
        const resourceExp = this.data.data.resources.exp || 0;
        const fundDice = this.data.data.funds || 0;
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

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    _onCreate(data: any, options: any, userId: string, context: any): void {
        if (game.userId !== userId) {
            return;
        }
        super._onCreate(data, options, userId, context);
        setTimeout(() => {
            if (this.data.data.settings.showBurner) {
                new Dialog({
                    title: "Launch Burner?",
                    content: "This is a new character. Would you like to launch the character burner?",
                    buttons: {
                        yes: {
                            label: "Yes",
                            callback: () => {
                                CharacterBurnerDialog.Open(this);
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

    async createOwnedItem(itemData: NewItemData | NewItemData[], options?: Record<string, unknown>): Promise<BWItem> {
        // we don't add lifepaths to actors. they are simply a data structure for holding lifepath info for the character burner
        if (Array.isArray(itemData)) {
            itemData = itemData.filter(id => id.type !== "lifepath");
            return super.createOwnedItem(itemData, options);
        }
        if (itemData.type !== "lifepath") {
            return super.createOwnedItem(itemData);
        }
        return super.createOwnedItem([], options);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async createEmbeddedEntity(entityType: string, data: NewItemData, options?: any): Promise<this> {
        // we don't add lifepaths to actors. they are simply a data structure for holding lifepath info for the character burner
        if (data.type !== 'lifepath') {
            return super.createEmbeddedEntity(entityType, data, options);
        }
        return this;
    }
}

export interface CharacterDataRoot extends BWActorDataRoot {
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
        woundRecovery1: number,
        woundRecovery2: number,
        woundRecovery3: number,
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