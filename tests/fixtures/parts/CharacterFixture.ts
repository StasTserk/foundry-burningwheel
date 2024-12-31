import { expect, Locator, Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { SeededActors } from '../SeededData';
import { SkillFixture } from './SkillFixture';
import { SpellFixture } from './SpellFixture';

class SkillWidget {
    constructor(
        private readonly locator: Locator,
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
        // return a roll dialog instance
    }
}

class SpellWidget {
    constructor(
        private readonly locator: Locator,
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
    private readonly locator: Locator;
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
            this.locator.getByLabel(new RegExp(`skill rollable ${name}`, 'i')),
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
            this.locator.getByLabel(
                new RegExp(`learning rollable ${name}`, 'i')
            ),
            SkillFixture.getOpenDialog({
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
