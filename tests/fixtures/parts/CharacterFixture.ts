import { expect, Locator, Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { SeededActors } from '../SeededData';
import { SkillFixture } from './SkillFixture';
import { SpellFixture } from './SpellFixture';
import { ReputationFixture } from './ReputationFixture';
import { AffiliationFixture } from './AffiliationFixture';
import { RollDialog } from './RollDialog';
import { RelationshipFixture } from './RelationshipFixture';

class RepWidget {
    constructor(
        readonly locator: Locator,
        private readonly dialog: ReturnType<
            typeof ReputationFixture.getOpenDialog
        >
    ) {}

    async edit() {
        await this.locator.locator('i.fa-edit').click();
        return this.dialog;
    }

    async delete() {
        await this.locator.locator('i.fa-trash').click();
    }
}

class RelationshipWidget {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase,
        private readonly name: string,
        readonly locator: Locator
    ) {}

    async edit() {
        await this.locator.locator('i.fa-edit').click();
        return RelationshipFixture.getOpenDialog(
            this.page,
            this.gamePage,
            this.test,
            this.name
        );
    }

    async delete() {
        await this.locator.locator('i.fa-trash').click();
    }

    async roll() {
        await this.locator.getByLabel('roll relationship').click();
        return RollDialog.getDialog(this.page, 'Circles');
    }

    get buildingProgress() {
        return this.locator.locator(
            'input[data-binding="system.buildingProgress"][checked="checked"]'
        );
    }

    setBuildingProgress(value: string) {
        return this.locator
            .locator(
                `input[data-binding="system.buildingProgress"][value="${value}"]+label`
            )
            .click();
    }
}

class AffWidget {
    constructor(
        readonly locator: Locator,
        private readonly dialog: ReturnType<
            typeof AffiliationFixture.getOpenDialog
        >
    ) {}

    async edit() {
        await this.locator.locator('i.fa-edit').click();
        return this.dialog;
    }

    async delete() {
        await this.locator.locator('i.fa-trash').click();
    }
}

class SkillWidget {
    constructor(
        private readonly page: Page,
        readonly locator: Locator,
        private readonly name: string,
        private readonly dialog: ReturnType<typeof SkillFixture.getOpenDialog>
    ) {}

    async edit() {
        await this.locator.locator('i.fa-edit').click();
        return this.dialog;
    }

    async delete() {
        await this.locator.locator('i.fa-trash').click();
    }

    async roll() {
        await this.locator.getByLabel('roll skill').click();
        return RollDialog.getDialog(this.page, this.name);
    }

    get routineNeeded() {
        return this.locator.getByRole('textbox').first();
    }

    get routineProgress() {
        return this.locator.locator(
            'input[data-binding="system.routine"][checked="checked"]'
        );
    }

    setRoutineProgress(value: string) {
        return this.locator
            .locator(
                `input[data-binding="system.routine"][value="${value}"]+label`
            )
            .click();
    }

    get difficultNeeded() {
        return this.locator.getByRole('textbox').nth(1);
    }

    get difficultProgress() {
        return this.locator.locator(
            'input[data-binding="system.difficult"][checked="checked"]'
        );
    }

    get challengingNeeded() {
        return this.locator.getByRole('textbox').nth(2);
    }

    get challengingProgress() {
        return this.locator.locator(
            'input[data-binding="system.challenging"][checked="checked"]'
        );
    }

    get learningProgress() {
        return this.locator.locator(
            'input[data-binding="system.learningProgress"][checked="checked"]'
        );
    }

    setLearningProgress(value: string) {
        return this.locator
            .locator(
                `input[data-binding="system.learningProgress"][value="${value}"]+label`
            )
            .click();
    }

    get exponent() {
        return this.locator.getByRole('spinbutton').first();
    }

    get fateSpent() {
        return this.locator.getByPlaceholder('F');
    }

    get personaSpent() {
        return this.locator.getByPlaceholder('P');
    }

    get deedsSpent() {
        return this.locator.getByPlaceholder('D');
    }

    get open() {
        return this.locator.getByLabel('Open');
    }
}

class StatWidget {
    constructor(
        private readonly page: Page,
        readonly locator: Locator,
        private readonly name: string,
        private readonly hasRoutine: boolean
    ) {}

    async roll() {
        await this.locator.getByLabel('roll item').click();
        return RollDialog.getDialog(this.page, this.name);
    }

    get routineNeeded() {
        return this.locator.getByRole('textbox').first();
    }

    get routineProgress() {
        return this.locator.locator(
            'input[data-test="routine"][checked="checked"]'
        );
    }

    setRoutineProgress(value: string) {
        return this.locator
            .locator(`input[data-test="routine"][value="${value}"]+label`)
            .click();
    }

    get difficultNeeded() {
        return this.hasRoutine
            ? this.locator.getByRole('textbox').nth(1)
            : this.locator.getByRole('textbox').first();
    }

    get difficultProgress() {
        return this.locator.locator(
            'input[data-test="difficult"][checked="checked"]'
        );
    }

    setDifficultProgress(value: string) {
        return this.locator
            .locator(`input[data-test="difficult"][value="${value}"]+label`)
            .click();
    }

    get challengingNeeded() {
        return this.locator.getByRole('textbox').nth(this.hasRoutine ? 2 : 1);
    }

    get challengingProgress() {
        return this.locator.locator(
            'input[data-test="challenging"][checked="checked"]'
        );
    }

    setChallengingProgress(value: string) {
        return this.locator
            .locator(`input[data-test="challenging"][value="${value}"]+label`)
            .click();
    }

    get exponent() {
        return this.locator.getByRole('spinbutton').first();
    }

    get fateSpent() {
        return this.locator.getByPlaceholder('F');
    }

    get personaSpent() {
        return this.locator.getByPlaceholder('P');
    }

    get deedsSpent() {
        return this.locator.getByPlaceholder('D');
    }

    get open() {
        return this.locator.getByLabel('Open');
    }

    get tax() {
        return this.locator.getByLabel('Tax');
    }
}

class SpellWidget {
    constructor(
        private readonly page: Page,
        readonly locator: Locator,
        private readonly name: string,
        private readonly dialog: ReturnType<typeof SpellFixture.getOpenDialog>
    ) {}

    async edit() {
        await this.locator.locator('i.fa-edit').click();
        return this.dialog;
    }

    async delete() {
        await this.locator.locator('i.fa-trash').click();
    }

    async roll(skillName: string) {
        await this.locator.getByLabel('roll spell').click();
        return RollDialog.getDialog(this.page, skillName);
    }

    get skill() {
        return this.locator.getByLabel('Skill');
    }
}

class CharacterDialog {
    readonly locator: Locator;
    constructor(
        private readonly page: Page,
        private readonly fixture: CharacterFixture,
        private readonly name: SeededActors,
        private readonly test: FixtureBase,
        private readonly gamePage: GameFixture
    ) {
        this.locator = this.page.locator('div.app.bw-app').filter({
            has: page.locator('h4').filter({ hasText: new RegExp(name, 'i') }),
        });
    }

    stat(
        name: 'Will' | 'Power' | 'Agility' | 'Perception' | 'Forte' | 'Speed'
    ) {
        return new StatWidget(
            this.page,
            this.locator.getByLabel(`rollable ${name}`),
            name,
            false
        );
    }

    attribute(name: 'Health' | 'Steel' | 'Circles' | 'Resources') {
        return new StatWidget(
            this.page,
            this.locator.getByLabel(`rollable ${name}`),
            name,
            true
        );
    }

    spell(name: string) {
        return new SpellWidget(
            this.page,
            this.locator.getByLabel(new RegExp(`spell rollable ${name}`, 'i')),
            this.name,
            SpellFixture.getOpenDialog({
                page: this.page,
                gamePage: this.gamePage,
                test: this.test,
                name,
            })
        );
    }

    skill(name: string) {
        return new SkillWidget(
            this.page,
            this.locator.getByLabel(new RegExp(`skill rollable ${name}`, 'i')),
            name,
            SkillFixture.getOpenDialog({
                page: this.page,
                gamePage: this.gamePage,
                test: this.test,
                name,
            })
        );
    }

    learningSkill(name: string) {
        return new SkillWidget(
            this.page,
            this.locator.getByLabel(
                new RegExp(`learning rollable ${name}`, 'i')
            ),
            name,
            SkillFixture.getOpenDialog({
                page: this.page,
                gamePage: this.gamePage,
                test: this.test,
                name,
            })
        );
    }

    reputation(name: string) {
        return new RepWidget(
            this.locator.getByLabel(new RegExp(`reputation ${name}`, 'i')),
            ReputationFixture.getOpenDialog({
                page: this.page,
                gamePage: this.gamePage,
                test: this.test,
                name,
            })
        );
    }

    affiliation(name: string) {
        return new AffWidget(
            this.locator.getByLabel(new RegExp(`affiliation ${name}`, 'i')),
            AffiliationFixture.getOpenDialog({
                page: this.page,
                gamePage: this.gamePage,
                test: this.test,
                name,
            })
        );
    }

    relationship(name: string) {
        return new RelationshipWidget(
            this.page,
            this.gamePage,
            this.test,
            name,
            this.locator.getByLabel(`relationship ${name}`)
        );
    }

    open() {
        return this.fixture.openCharacter(this.name);
    }

    close() {
        return this.locator.getByText(/close/i).click();
    }
}

export class CharacterFixture {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async openCharacter(name: SeededActors) {
        await this.gamePage.openTab('Actors');
        await this.test.step(`Open actor named '${name}'`, async () => {
            await this.page.getByText(name).click();
            await this.expectOpened(name);
        });
    }

    async openCharacterDialog(name: SeededActors) {
        await this.openCharacter(name);
        return new CharacterDialog(
            this.page,
            this,
            name,
            this.test,
            this.gamePage
        );
    }

    expectOpened(name: SeededActors) {
        return expect(
            this.page.locator('div.app.bw-app').filter({
                has: this.page
                    .locator('h4')
                    .filter({ hasText: new RegExp(name, 'i') }),
            })
        ).toBeVisible();
    }

    sheet(name: SeededActors) {
        return this.page.locator('div.app.bw-app').filter({
            has: this.page
                .locator('h4')
                .filter({ hasText: new RegExp(name, 'i') }),
        });
    }
}
