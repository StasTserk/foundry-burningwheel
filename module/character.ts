import { Common, DisplayProps, Ptgs, ClumsyWeightData, TracksTests, BWActorDataRoot } from "./bwactor.js";
import { ShadeString, TestString, canAdvance } from "./helpers.js";

export class BWCharacter extends Actor<BWCharacterData>{
    data: CharacterDataRoot;

    bindCharacterFunctions(): void {
        this.addStatTest = BWCharacter.prototype.addStatTest.bind(this);
        this.addAttributeTest = BWCharacter.prototype.addAttributeTest.bind(this);
        this._addTestToStat = BWCharacter.prototype._addTestToStat.bind(this);
        this.taxResources = BWCharacter.prototype.taxResources.bind(this);
        this._advanceStat = BWCharacter.prototype._advanceStat.bind(this);
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

interface BWCharacterData extends Common, DisplayProps, Ptgs, SpellsMaintainedInfo {
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