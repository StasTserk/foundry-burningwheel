import { skillImages, skillRootSelect, SkillTypeString } from '../constants';
import { Ability, BWActor, TracksTests } from '../actors/BWActor';
import {
    ShadeString,
    StringIndexedObject,
    TestString,
    updateTestsNeeded,
} from '../helpers';
import { DisplayClass, BWItem } from './item';
import { DifficultyDialog } from '../dialogs/DifficultyDialog';
import * as helpers from '../helpers';
import { TypeMissing } from '../../types/index';

export class Skill extends BWItem<SkillData> {
    getRootSelect(): StringIndexedObject<string> {
        const roots = {};
        const actor = this.actor as unknown as BWActor | null;
        Object.assign(roots, skillRootSelect);
        if (!actor) {
            return roots;
        }

        if (this.hasOwner && actor.type === 'character') {
            if (actor.system.custom1.name) {
                roots['custom1'] = actor.system.custom1.name;
            }
            if (actor.system.custom2.name) {
                roots['custom2'] = actor.system.custom2.name;
            }
        } else {
            roots['custom1'] = 'Custom Attribute 1';
            roots['custom2'] = 'Custom Attribute 2';
        }
        return roots;
    }
    prepareData(): void {
        super.prepareData();
        updateTestsNeeded(this.system);
        this.calculateAptitude();
        this.system.safeId = this.id;
    }

    calculateAptitude(this: Skill): void {
        const actor = this.actor as BWActor | null;
        if (!actor || !this.hasOwner) {
            return;
        }
        let aptitudeMod =
            actor.getAptitudeModifiers(this.name) +
            actor.getAptitudeModifiers(this.system.skilltype);

        aptitudeMod += actor.getAptitudeModifiers(this.system.root1);

        if (this.system.root2) {
            aptitudeMod +=
                actor.getAptitudeModifiers(
                    `${this.system.root1}/${this.system.root2}`
                ) +
                actor.getAptitudeModifiers(
                    `${this.system.root2}/${this.system.root1}`
                );
            +actor.getAptitudeModifiers(this.system.root2);
        }

        const root1 = actor.system[this.system.root1] as Ability;
        const root1exp =
            root1.exp + (root1.shade === 'W' ? 2 : root1.shade === 'G' ? 1 : 0);
        const root2 = actor.system[this.system.root2] as Ability;
        const root2exp = this.system.root2
            ? root2.exp +
              (root2.shade === 'W' ? 2 : root2.shade === 'G' ? 1 : 0)
            : root1exp;
        const rootAvg = Math.floor((root1exp + root2exp) / 2);
        this.system.aptitude = 10 - rootAvg + aptitudeMod;
    }

    static disableIfWounded(this: Skill, woundDice: number): void {
        if (!this.system.learning && this.system.exp <= woundDice) {
            this.system.cssClass += ' wound-disabled';
        }
    }

    canAdvance(): boolean {
        const enoughRoutine =
            this.system.routine >= (this.system.routineNeeded || 0);
        const enoughDifficult =
            this.system.difficult >= (this.system.difficultNeeded || 0);
        const enoughChallenging =
            this.system.challenging >= (this.system.challengingNeeded || 0);

        if (this.system.exp === 0) {
            return enoughRoutine || enoughDifficult || enoughChallenging;
        }

        if (this.system.exp < 5) {
            // need only enough difficult or routine, not both
            return enoughRoutine && (enoughDifficult || enoughChallenging);
        }
        // otherwise, need both routine and difficult tests to advance, don't need routine anymore
        return enoughDifficult && enoughChallenging;
    }

    async advance(): Promise<void> {
        const exp = this.system.exp;
        this.update(
            {
                system: {
                    routine: 0,
                    difficult: 0,
                    challenging: 0,
                    exp: exp + 1,
                },
            },
            {}
        );
    }

    async addTest(difficulty: TestString, force = false): Promise<void> {
        // if we're doing deferred tracking, register the test then skip tracking for now
        const difficultyDialog = game.burningwheel.gmDifficulty as
            | DifficultyDialog
            | undefined;
        if (!force && difficultyDialog?.extendedTest) {
            difficultyDialog?.addDeferredTest({
                actor: this.actor as unknown as BWActor,
                skill: this,
                difficulty,
                name: this.name,
            });
            return;
        }

        // if we're ready to assign the test, do that now.
        if (this.system.learning) {
            const progress = this.system.learningProgress;
            let requiredTests = this.system.aptitude || 10;
            let shade = foundry.utils.getProperty(
                this.actor || {},
                `system.${this.system.root1.toLowerCase()}`
            ).shade;

            this.update({ 'system.learningProgress': progress + 1 }, {});
            if (progress + 1 >= requiredTests) {
                if (this.system.root2 && this.actor) {
                    const root2Shade = foundry.utils.getProperty(
                        this.actor,
                        `system.${this.system.root2.toLowerCase()}`
                    ).shade;
                    if (shade != root2Shade) {
                        requiredTests -= 2;
                    }
                    shade = helpers.getWorstShadeString(shade, root2Shade);
                }

                Dialog.confirm({
                    title: game.i18n
                        .localize('BW.dialog.finishTraining')
                        .replace('{name}', this.name),
                    content: `<p>${game.i18n
                        .localize('BW.dialog.finishTrainingText')
                        .replace('{name}', this.name)}</p>`,
                    yes: () => {
                        const updateData = {};
                        updateData['system.learning'] = false;
                        updateData['system.learningProgress'] = 0;
                        updateData['system.routine'] = 0;
                        updateData['system.difficult'] = 0;
                        updateData['system.challenging'] = 0;
                        updateData['system.shade'] = shade;
                        updateData['system.exp'] = Math.floor(
                            this.rootStatExp / 2
                        );
                        this.update(updateData, {});
                    },
                    no: () => {
                        return;
                    },
                    defaultYes: true,
                });
            }
        } else {
            switch (difficulty) {
                case 'Routine':
                    if (
                        this.system.routine < (this.system.routineNeeded || 0)
                    ) {
                        this.system.routine++;
                        this.update(
                            { 'system.routine': this.system.routine },
                            {}
                        );
                    }
                    break;
                case 'Difficult':
                    if (
                        this.system.difficult <
                        (this.system.difficultNeeded || 0)
                    ) {
                        this.system.difficult++;
                        this.update(
                            { 'system.difficult': this.system.difficult },
                            {}
                        );
                    }
                    break;
                case 'Challenging':
                    if (
                        this.system.challenging <
                        (this.system.challengingNeeded || 0)
                    ) {
                        this.system.challenging++;
                        this.update(
                            { 'system.challenging': this.system.challenging },
                            {}
                        );
                    }
                    break;
                case 'Routine/Difficult':
                    if (
                        this.system.routine < (this.system.routineNeeded || 0)
                    ) {
                        this.system.routine++;
                        this.update(
                            { 'system.routine': this.system.routine },
                            {}
                        );
                    } else if (
                        this.system.difficult <
                        (this.system.difficultNeeded || 0)
                    ) {
                        this.system.difficult++;
                        this.update(
                            { 'system.difficult': this.system.difficult },
                            {}
                        );
                    }
                    break;
            }
        }

        if (this.canAdvance()) {
            Dialog.confirm({
                title: `Advance ${this.name}?`,
                content: `<p>${this.name} is ready to advance. Go ahead?</p>`,
                yes: () => this.advance(),
                no: () => {
                    return;
                },
                defaultYes: true,
            });
        }
    }

    get rootStatExp(): number {
        if (this.actor) {
            const actor = this.actor;
            const root1exp = (actor.system[this.system.root1] as Ability).exp;
            const root2exp = this.system.root2
                ? (actor.system[this.system.root2] as Ability).exp
                : root1exp;
            let exp = Math.floor((root1exp + root2exp) / 2);
            if (this.system.root2) {
                const root1Shade = (actor.system[this.system.root1] as Ability)
                    .shade;
                const root2Shade = this.system.root2
                    ? (actor.system[this.system.root2] as Ability).shade
                    : root1Shade;
                if (root1Shade != root2Shade) {
                    exp++;
                }
            }
            return exp;
        } else {
            return 0;
        }
    }

    async _preUpdate(
        changed: Partial<TypeMissing>,
        options: FoundryDocument.ModificationContext,
        userId: string
    ): Promise<void> {
        await super._preUpdate(changed, options, userId);

        if (
            changed.system?.skilltype &&
            this.img === skillImages[this.system.skilltype]
        ) {
            // we should update the image for this skill
            changed.img = skillImages[changed.system?.skilltype];
        }
    }
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
