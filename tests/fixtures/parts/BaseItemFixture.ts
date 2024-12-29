import { expect, Locator, Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { SeededItems } from '../SeededData';

export class BaseItemDialog {
    readonly locator: Locator;
    constructor(readonly fixture: BaseItemFixture, readonly name: SeededItems) {
        this.locator = fixture.sheet(name);
    }

    get description() {
        return this.locator.locator('textarea[name="system.description"]');
    }

    setDescription(text: string) {
        return this.locator
            .locator('textarea[name="system.description"]')
            .fill(text);
    }

    close() {
        return this.fixture.close(this.name);
    }

    open() {
        return this.fixture.open(this.name);
    }
}

export class BaseItemFixture {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async open(name: SeededItems) {
        await this.gamePage.openTab('Items');
        await this.test.step(`Open item named '${name}'`, async () => {
            await this.page.getByText(name).click();
            await this.expectOpened(name);
        });
    }

    close(name: SeededItems) {
        return this.sheet(name).getByText('close').click();
    }

    expectOpened(name: SeededItems) {
        return expect(
            this.page.locator('div.app.bw-app').filter({ hasText: name })
        ).toBeVisible();
    }

    sheet(name: SeededItems) {
        return this.page.locator('div.app.bw-app').filter({ hasText: name });
    }
}
