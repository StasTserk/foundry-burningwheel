import { skillImages, skillRootSelect, SkillTypeString } from "../constants.js";
import { Ability, BWActor, TracksTests } from "../actors/BWActor.js";
import { ShadeString, StringIndexedObject, TestString, updateTestsNeeded } from "../helpers.js";
import { DisplayClass, BWItemData, BWItem } from "./item.js";
import { DifficultyDialog } from "../dialogs/DifficultyDialog.js";
import * as helpers from "../helpers.js";

export class Skill extends BWItem<SkillDataRoot> {
    getRootSelect(): StringIndexedObject<string> {
        const roots = {};
        const actor = this.actor as unknown as BWActor  | null;
        Object.assign(roots, skillRootSelect);
        if (!actor) { return roots; }

        if (this.data.hasOwner && actor.data.type === "character") {
            if (actor.data.data.custom1.name) {
                roots["custom1"] = actor.data.data.custom1.name;
            }
            if (actor.data.data.custom2.name) {
                roots["custom2"] = actor.data.data.custom2.name;
            }
        } else {
            roots["custom1"] = "Custom Attribute 1";
            roots["custom2"] = "Custom Attribute 2";
        }
        return roots;
    }
    prepareData(): void {
        super.prepareData();
        updateTestsNeeded(this.data.data);
        this.calculateAptitude();
        this.data.data.safeId = this.id;
    }

    calculateAptitude(this: Skill): void {
        const actor = this.actor as BWActor | null;
        if (!actor || !this.data.hasOwner) { return; }
        let aptitudeMod = actor.getAptitudeModifiers(this.name) + actor.getAptitudeModifiers(this.data.data.skilltype);

        aptitudeMod += actor.getAptitudeModifiers(this.data.data.root1);
        
        if (this.data.data.root2) {
            aptitudeMod += actor.getAptitudeModifiers(`${this.data.data.root1}/${this.data.data.root2}`)
                + actor.getAptitudeModifiers(`${this.data.data.root2}/${this.data.data.root1}`);
                + actor.getAptitudeModifiers(this.data.data.root2);
        }

        const root1exp = (actor.data.data[this.data.data.root1] as Ability).exp;
        const root2exp = this.data.data.root2 ? (actor.data.data[this.data.data.root2] as Ability).exp : root1exp;
        const rootAvg = Math.floor((root1exp + root2exp) / 2);
        this.data.data.aptitude = 10 - rootAvg + aptitudeMod;
    }

    static disableIfWounded(this: SkillDataRoot, woundDice: number): void {
        if (!this.data.learning && this.data.exp <= woundDice) {
            this.data.cssClass += " wound-disabled";
        }
    }

    canAdvance(): boolean {

        const enoughRoutine = (this.data.data.routine >= (this.data.data.routineNeeded || 0 ));
        const enoughDifficult = this.data.data.difficult >= (this.data.data.difficultNeeded || 0);
        const enoughChallenging = this.data.data.challenging >= (this.data.data.challengingNeeded || 0);
    
        if (this.data.data.exp === 0) {
            return enoughRoutine || enoughDifficult || enoughChallenging;
        }
    
        if (this.data.data.exp < 5) {
            // need only enough difficult or routine, not both
            return enoughRoutine && (enoughDifficult || enoughChallenging);
        }
        // otherwise, need both routine and difficult tests to advance, don't need routine anymore
        return enoughDifficult && enoughChallenging;
    }

    async advance(): Promise<void> {
        const exp = this.data.data.exp;
        this.update({ data: { routine: 0, difficult: 0, challenging: 0, exp: exp + 1 } }, {});
    }

    async addTest(difficulty: TestString, force = false): Promise<void> {
        // if we're doing deferred tracking, register the test then skip tracking for now
        const difficultyDialog = game.burningwheel.gmDifficulty as (DifficultyDialog | undefined);
        if (!force && (difficultyDialog?.extendedTest)) {
            difficultyDialog?.addDeferredTest({
                actor: this.actor as unknown as BWActor,
                skill: this,
                difficulty,
                name: this.name
            });
            return;
        }

        // if we're ready to assign the test, do that now.
        if (this.data.data.learning) {
            const progress = this.data.data.learningProgress;
            let requiredTests = this.data.data.aptitude || 10;
            let shade = getProperty(this.actor || {}, `data.data.${this.data.data.root1.toLowerCase()}`).shade;
        
            this.update({"data.learningProgress": progress + 1 }, {});
            if (progress + 1 >= requiredTests) {
                if (this.data.data.root2 && this.actor) {
                    const root2Shade = getProperty(this.actor, `data.data.${this.data.data.root2.toLowerCase()}`).shade;
                    if (shade != root2Shade) {
                        requiredTests -= 2;
                    }
                    shade = helpers.getWorstShadeString(shade, root2Shade);
                }
        
                Dialog.confirm({
                    title: `Finish Training ${this.name}?`,
                    content: `<p>${this.name} is ready to become a full skill. Go ahead?</p>`,
                    yes: () => {
                        const updateData = {};
                        updateData["data.learning"] = false;
                        updateData["data.learningProgress"] = 0;
                        updateData["data.routine"] = 0;
                        updateData["data.difficult"] = 0;
                        updateData["data.challenging"] = 0;
                        updateData["data.shade"] = shade;
                        updateData["data.exp"] = Math.floor(this.rootStatExp / 2);
                        this.update(updateData, {});
                    },
                    no: () => { return; },
                    defaultYes: true
                });
            }
        }
        else {
            switch (difficulty) {
                case "Routine":
                    if (this.data.data.routine < (this.data.data.routineNeeded || 0)) {
                        this.data.data.routine ++;
                        this.update({ "data.routine": this.data.data.routine }, {});
                    }
                    break;
                case "Difficult":
                    if (this.data.data.difficult < (this.data.data.difficultNeeded || 0)) {
                        this.data.data.difficult ++;
                        this.update({ "data.difficult": this.data.data.difficult }, {});
                    }
                    break;
                case "Challenging":
                    if (this.data.data.challenging < (this.data.data.challengingNeeded || 0)) {
                        this.data.data.challenging ++;
                        this.update({ "data.challenging": this.data.data.challenging }, {});
                    }
                    break;
                case "Routine/Difficult":
                    if (this.data.data.routine < (this.data.data.routineNeeded || 0)) {
                        this.data.data.routine ++;
                        this.update({ "data.routine": this.data.data.routine }, {});
                    } else if (this.data.data.difficult < (this.data.data.difficultNeeded || 0)) {
                        this.data.data.difficult ++;
                        this.update({ "data.difficult": this.data.data.difficult }, {});
                    }
                    break;
            }
            
        }

        if (this.canAdvance()) {
            Dialog.confirm({
                title: `Advance ${this.name}?`,
                content: `<p>${this.name} is ready to advance. Go ahead?</p>`,
                yes: () => this.advance(),
                no: () => { return; },
                defaultYes: true
            });
        }
    }

    get rootStatExp(): number {
        if (this.actor) {
            const actor = this.actor;
            const root1exp = (actor.data.data[this.data.data.root1] as Ability).exp;
            const root2exp = this.data.data.root2 ? (actor.data.data[this.data.data.root2] as Ability).exp : root1exp;
            let exp = Math.floor((root1exp + root2exp) / 2);
            if (this.data.data.root2) {
                const root1Shade = (actor.data.data[this.data.data.root1] as Ability).shade;
                const root2Shade = this.data.data.root2 ? (actor.data.data[this.data.data.root2] as Ability).shade : root1Shade;
                if (root1Shade != root2Shade) {
                    exp ++;
                }
            }
            return exp;
        } else {
            return 0;
        }
    }

    async _preUpdate(changed: Partial<SkillDataRoot>, options: FoundryDocument.ModificationContext, userId: string): Promise<void> {
        await super._preUpdate(changed, options, userId);

        if (changed.data?.skilltype && this.data.img === skillImages[this.data.data.skilltype]) {
            // we should update the image for this skill
            changed.img = skillImages[changed.data?.skilltype];
        }
    }
}

export interface SkillDataRoot extends BWItemData<SkillData> {
    type: "skill";
}

export interface SkillData extends TracksTests, DisplayClass {
    name: string;
    shade: ShadeString;

    root1: string;
    root2: string;
    skilltype: SkillTypeString;
    description: string;
    restrictions: string;

    training: boolean;
    magical: boolean;
    open: boolean;
    wildFork: boolean;
    learning: boolean;
    learningProgress: number;

    tools: boolean;

    routineNeeded?: number;
    difficultNeeded?: number;
    challengingNeeded?: number;
    aptitude?: number;
    safeId?: string;
}
