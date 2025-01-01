import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can open the character sheet', async ({ char }) => {
    await char.openCharacter('Romeo');
    await char.expectOpened('Romeo');
});

test('characters can be created, on create scripts fire', async ({
    gamePage,
    char,
}) => {
    await gamePage.createActor('Shakespeare', 'character');
    await char.expectOpened('Shakespeare');
    await test.step('ensure first time burning dialog opens', async () => {
        await gamePage.expectOpenedDialog('Launch Burner?');
        await gamePage.closeDialog('Launch Burner?');
    });

    const sheet = char.sheet('Shakespeare');
    await test.step('ensure base items loaded correctly', async () => {
        expect(await sheet.locator('.beliefs > .bits-item').all()).toHaveLength(
            4
        );
        expect(
            await sheet.locator('.instincts > .bits-item').all()
        ).toHaveLength(4);
        await expect(
            sheet.locator('.weapons').filter({ hasText: 'Bare Fist' })
        ).toBeVisible();
    });
});

test('item states persist correctly', async ({ char }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    await test.step('edit a skill exponent and close the sheet', async () => {
        await sheet.skill('Brawling').exponent.fill('3');
        await sheet.skill('Brawling').exponent.blur();
        await sheet.close();
    });
    await test.step('reopen sheet and check value', async () => {
        await sheet.open();
        await expect(sheet.skill('Brawling').exponent).toHaveValue('3');
    });
});
