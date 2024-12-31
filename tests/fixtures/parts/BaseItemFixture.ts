import { expect, Locator, Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { SeededItems } from '../SeededData';

export class BaseItemDialog<
    LabelFields extends string = string,
    CheckBoxFields extends string = string,
    SelectFields extends string = string
> {
    readonly locator: Locator;
    constructor(readonly fixture: BaseItemFixture, readonly name: SeededItems) {
        this.locator = fixture.sheet(name);
    }

    get description() {
        return this.locator.locator('textarea[name="system.description"]');
    }

    get image() {
        return this.locator.getByRole('img');
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

    getLabeledField(label: LabelFields | CheckBoxFields | SelectFields) {
        return this.locator.getByLabel(new RegExp(label, 'i'));
    }
    async setLabeledField(label: LabelFields, value: string) {
        const locator = this.getLabeledField(label);
        await locator.fill(value);
        return locator.blur();
    }
    async selectOption(label: SelectFields, option: string) {
        const locator = this.getLabeledField(label);
        await locator.selectOption(option);
        return locator.blur();
    }
    togglePillCheckbox(label: CheckBoxFields, force?: boolean) {
        if (force) {
            // work around for this feature not working some times. (invisible checkbox?)
            return this.locator.getByText(label).dispatchEvent('click');
        }
        return this.locator.getByText(label).click();
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
        return this.page.locator('div.app.bw-app').filter({
            has: this.page
                .locator('h4')
                .filter({ hasText: new RegExp(name, 'i') }),
        });
    }
}
