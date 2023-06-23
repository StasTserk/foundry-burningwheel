import { DisplayProps, ClumsyWeightData, TracksTests, Ability, BWActor, Common } from "./BWActor";
import { CharacterBurnerDialog } from "../dialogs/CharacterBurnerDialog";
import { ShadeString, TestString, canAdvance, updateTestsNeeded, getWorstShadeString } from "../helpers";
import { Skill } from "../items/skill";

export class BWCharacter extends BWActor<BWCharacterData> {
    type: "character";

    prepareData(): void {
        super.prepareData();

        this._calculatePtgs();

        const woundDice = this.system.ptgs.woundDice || 0;
        updateTestsNeeded(this.system.will, false, woundDice, this.system.willTax);
        updateTestsNeeded(this.system.power, false, woundDice);
        updateTestsNeeded(this.system.perception, false, woundDice);
        updateTestsNeeded(this.system.agility, false, woundDice);
        updateTestsNeeded(this.system.forte, false, woundDice, this.system.forteTax);
        updateTestsNeeded(this.system.speed, false, woundDice);
        updateTestsNeeded(this.system.health);
        updateTestsNeeded(this.system.steel, true, woundDice);
        updateTestsNeeded(this.system.circles);
        updateTestsNeeded(this.system.resources, true, -1);
        updateTestsNeeded(this.system.custom1);
        updateTestsNeeded(this.system.custom2);

        this.system.maxSustained = this.system.will.exp - (this.system.ptgs.woundDice || 0) - 1;
        this.system.maxObSustained = this.system.forte.exp - (this.system.ptgs.woundDice || 0) - this.system.forteTax - 1;

        const unRoundedReflexes =
            (this.system.perception.exp +
            this.system.agility.exp +
            this.system.speed.exp) / 3.0;
        this.system.reflexesExp = (this.system.settings.roundUpReflexes ?
            Math.ceil(unRoundedReflexes) : Math.floor(unRoundedReflexes))
            - (this.system.ptgs.woundDice || 0);
        const shades = [this.system.perception.shade, this.system.agility.shade, this.system.speed.shade];
        this.system.reflexesShade = getWorstShadeString(getWorstShadeString(shades[0], shades[1]), shades[2]);
        if (this.system.reflexesShade === "B") {
            this.system.reflexesExp += shades.filter(s => s !== "B").length;
        } else if (this.system.reflexesShade === "G") {
            this.system.reflexesExp += shades.filter(s => s === "W").length;
        }

        const unRoundedMortalWound =
            (this.system.power.exp + this.system.forte.exp) / 2 + 6;
        this.system.mortalWound = this.system.settings.roundUpMortalWound ?
            Math.ceil(unRoundedMortalWound) : Math.floor(unRoundedMortalWound);
        if (this.system.power.shade !== this.system.forte.shade) {
            this.system.mortalWound += 1;
        }
        this.system.mortalWoundShade = getWorstShadeString(this.system.power.shade, this.system.forte.shade);

        this.system.hesitation = 10 - this.system.will.exp;
        if (this.system.will.shade === "G") {
            this.system.hesitation -= 2;
        }
        if (this.system.will.shade === "W") {
            this.system.hesitation -= 3;
        }

        this.successOnlyRolls = (this.system.settings.onlySuccessesCount || '')
            .split(',')
            .map(s => s.trim().toLowerCase());
    }

    async updatePtgs(): Promise<this> {
        const accessorBase = "data.ptgs.wound";
        const forte = this.system.forte.exp || 1;
        const mw = this.system.mortalWound || 15;
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
        this.system.ptgs.obPenalty = 0;
        Object.entries(this.system.ptgs).forEach(([_key, value]) => {
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
        } else if (!this.system.ptgs.shrugging && suCount >= 1 && !this.system.settings.ignoreSuperficialWounds) {
            this.system.ptgs.obPenalty = 1;
        }
        if (this.system.ptgs.gritting && woundDice) {
            woundDice --;
        }

        woundDice = Math.max(0,
            woundDice - (this.system.ptgs.woundRecovery1 || 0) - (this.system.ptgs.woundRecovery2 || 0) - (this.system.ptgs.woundRecovery3 || 0));

        this.system.ptgs.woundDice = woundDice;
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

        // if the stat should not advance on failure, back out immediately.
        name = name.toLowerCase();
        const onlySuccessCounts = this.successOnlyRolls.indexOf(name) !== -1;
        if (onlySuccessCounts && !isSuccessful) {
            return;
        }

        // if the test should be tracked but we're doing deferred tracking do that now.
        const difficultyDialog = game.burningwheel.gmDifficulty;
        if (!force && difficultyDialog?.extendedTest) {
            difficultyDialog?.addDeferredTest({
                actor: this,
                path: accessor,
                difficulty: difficultyGroup,
                name
            });
            return;
        }

        // if the test should be tracked and we're not deferring track the test.
        this._addTestToStat(stat, accessor, difficultyGroup);
        if (canAdvance(stat, routinesNeeded)) {
            const statName = game.i18n.localize('BW.' + name);
            Dialog.confirm({
                title: game.i18n.localize('BW.dialog.advanceTitle').replace("{name}", statName),
                content: `<p>${game.i18n.localize('BW.dialog.advanceText').replace("{name}", statName)}</p>`,
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
            isSuccessful: boolean,
            force = false): Promise<void>  {
        return this.addStatTest(stat, name, accessor, difficultyGroup, isSuccessful, true, force);
    }

    public updateArthaForSkill(skillId: string, persona: number, deeds: number): void {
        this.update({
            "system.deeds": this.system.deeds - deeds,
            "system.persona": this.system.persona - persona,
        });
        const skill = this.items.get(skillId) as unknown as Skill;
        skill.update({
            "system.deeds": deeds ? (skill.system.deeds || 0) + 1 : undefined,
            "system.persona": skill.system.persona + persona
        }, {});
    }

    public updateArthaForStat(accessor: string, persona: number, deeds: number): void {
        accessor = accessor.replace('system.', '');
        const stat = getProperty(this.system, accessor) as Ability;
        const updateData = {
            "system.deeds": this.system.deeds - (deeds ? 1 : 0),
            "system.persona": this.system.persona - persona,
        };
        updateData[`system.${accessor}.deeds`] = deeds ? (stat.deeds || 0) + 1 : undefined;
        updateData[`system.${accessor}.persona`] = (stat.persona || 0) + persona;
        this.update(updateData);
    }

    private async _addTestToStat(stat: TracksTests, accessor: string, difficultyGroup: TestString) {
        let testNumber = 0;
        accessor = accessor.replace('system.', '');
        const updateData = {};
        switch (difficultyGroup) {
            case "Challenging":
                testNumber = stat.challenging;
                if (testNumber < (stat.challengingNeeded || 0)) {
                    updateData[`system.${accessor}.challenging`] = testNumber +1;
                    stat.challenging = testNumber+1;
                    return this.update(updateData, {});
                }
                break;
            case "Difficult":
                testNumber = stat.difficult;
                if (testNumber < (stat.difficultNeeded || 0)) {
                    updateData[`system.${accessor}.difficult`] = testNumber +1;
                    stat.difficult = testNumber+1;
                    return this.update(updateData, {});
                }
                break;
            case "Routine":
                testNumber = stat.routine;
                if (testNumber < (stat.routineNeeded || 0)) {
                    updateData[`system.${accessor}.routine`] = testNumber +1;
                    stat.routine = testNumber + 1;
                    return this.update(updateData, {});
                }
                break;
            case "Routine/Difficult":
                testNumber = stat.difficult;
                if (testNumber < (stat.difficultNeeded || 0)) {
                    updateData[`system.${accessor}.difficult`] = testNumber +1;
                    stat.difficult = testNumber+1;
                    return this.update(updateData, {});
                } else {
                    testNumber = stat.routine;
                    if (testNumber < (stat.routineNeeded || 0)) {
                        updateData[`system.${accessor}.routine`] = testNumber +1;
                        stat.routine = testNumber+1;
                        return this.update(updateData, {});
                    }
                }
                break;
        }
    }

    taxResources(amount: number, maxFundLoss: number): void {
        const updateData = {};
        let resourcesTax = parseInt(this.system.resourcesTax.toString()) || 0;
        const resourceExp = this.system.resources.exp || 0;
        const fundDice = this.system.funds || 0;
        if (amount <= maxFundLoss) {
            updateData["system.funds"] = fundDice - amount;
        } else {
            updateData["system.funds"] = 0;
            amount -= maxFundLoss;
            resourcesTax = Math.min(resourceExp, amount+resourcesTax);
            updateData["system.resourcesTax"] = resourcesTax;
            if (resourcesTax === resourceExp) {
                // you taxed all your resources away, they degrade
                new Dialog({
                    title: game.i18n.localize('BW.dialog.overtaxedTitle'),
                    content: `<p>${game.i18n.localize('BW.dialog.overtaxedBody')}</p><hr>`,
                    buttons: {
                        reduce: {
                            label: game.i18n.localize('BW.dialog.reduceByOne'),
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
                            label: game.i18n.localize('BW.dialog.skipTax')
                        }
                    },
                    default: "reduce"
                }).render(true);
            }
        }
        this.update(updateData);
    }

    private async _advanceStat(accessor: string, newExp: number) {
        const updateData = {};
        if (accessor.indexOf('system.') !== -1) {
            accessor = accessor.slice(7);
        }
        updateData[`system.${accessor}.routine`] = 0;
        updateData[`system.${accessor}.difficult`] = 0;
        updateData[`system.${accessor}.challenging`] = 0;
        updateData[`system.${accessor}.exp`] = newExp;
        return this.update(updateData);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    _onCreate(data: any, options: any, userId: string): void {
        if (game.userId !== userId) {
            return;
        }
        super._onCreate(data, options, userId);
        setTimeout(() => {
            if (this.system.settings.showBurner) {
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
                    },
                    default: "yes"
                }).render(true);
            }
        }, 500);
    }

    async createEmbeddedDocuments(type: FoundryDocument.Types, data: Partial<FoundryDocument.Data>[], options?: FoundryDocument.ModificationContext): Promise<FoundryDocument[]> {
        data = data.filter(i => i.type !== "lifepath");
        return super.createEmbeddedDocuments(type, data, options);
    }
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