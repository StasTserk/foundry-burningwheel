import { expect, Locator, Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { SeededActors } from '../SeededData';
import { SkillFixture } from './SkillFixture';
import { SpellFixture } from './SpellFixture';
import { ReputationFixture } from './ReputationFixture';
import { AffiliationFixture } from './AffiliationFixture';
import { RollDialog } from './RollDialog';

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

    get difficultNeeded() {
        return this.locator.getByRole('textbox').nth(1);
    }

    get challengingNeeded() {
        return this.locator.getByRole('textbox').nth(2);
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

class SpellWidget {
    constructor(
        readonly locator: Locator,
        private readonly dialog: ReturnType<typeof SpellFixture.getOpenDialog>
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
        // return a roll dialog instance
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

    spell(name: string) {
        return new SpellWidget(
            this.locator.getByLabel(new RegExp(`spell rollable ${name}`, 'i')),
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
