import { expect } from '../../node_modules/playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('loads data correctly', async ({ page, dowDialog, gamePage }) => {
    await dowDialog.openDialog();
    await expect(
        page.getByRole('dialog').getByRole('heading', { name: 'duel of wits' }),
        { message: 'ensure dialog opens' }
    ).toBeVisible();

    await test.step('verify selected participants', async () => {
        expect(
            await gamePage.getSelectedValue(
                page.getByLabel('side 1 actor select')
            )
        ).toBe('Romeo');
        expect(
            await page.getByLabel('side 1 statement of purpose').inputValue()
        ).toBe('Let me date your cousin');

        expect(
            await gamePage.getSelectedValue(
                page.getByLabel('side 2 actor select')
            )
        ).toBe('Tybalt');
        expect(
            await page.getByLabel('side 2 statement of purpose').inputValue()
        ).toBe('No way');
    });

    await test.step('verify base data preloaded correctly', async () => {
        expect(
            await gamePage.getSelectedValue(
                page.getByLabel('side 1 skill selection')
            )
        ).toBe('Persuasion');

        expect(await page.getByLabel('side 1 body points').inputValue()).toBe(
            '9'
        );
        expect(await page.getByLabel('side 1 body max').inputValue()).toBe('9');

        expect(
            await gamePage.getSelectedValue(
                page.getByLabel('side 2 skill selection')
            )
        ).toBe('Intimidation');

        expect(await page.getByLabel('side 2 body points').inputValue()).toBe(
            '6'
        );
        expect(await page.getByLabel('side 2 body max').inputValue()).toBe('6');
    });

    await test.step('ensure actions scripted correctly', async () => {
        expect(await dowDialog.getSide1Actions()).toEqual(
            expect.arrayContaining(['Incite', 'Dismiss', 'Cast Spell'])
        );
        expect(await dowDialog.getSide2Actions()).toEqual(
            expect.arrayContaining(['Point', 'Hidden', 'Hidden'])
        );
    });

    await test.step('volley visibility is correct', async () => {
        const hideActionToggles = await page
            .getByRole('checkbox', { name: /hide actions/i })
            .all();

        expect(hideActionToggles).toHaveLength(2);
        await expect(hideActionToggles[0]).not.toBeChecked();
        await expect(hideActionToggles[1]).toBeChecked();

        await expect(
            page.getByRole('checkbox', { name: /show volley 1/i })
        ).toBeChecked();
        await expect(
            page.getByRole('checkbox', { name: /show volley 2/i })
        ).not.toBeChecked();
        await expect(
            page.getByRole('checkbox', { name: /show volley 3/i })
        ).not.toBeChecked();
        await expect(page.getByLabel('side 1 volley 1 select')).toBeVisible();
        await expect(
            page.getByLabel('side 2 volley 1 select')
        ).not.toBeVisible();
    });
});

test('showing another volley reveals a hidden action', async ({
    page,
    dowDialog,
}) => {
    await dowDialog.openDialog();

    await page.getByRole('checkbox', { name: /show volley 2/i }).click();
    expect(await dowDialog.getSide2Actions()).toStrictEqual(
        expect.arrayContaining(['Point', 'Rebuttal', 'Hidden'])
    );
});

test('toggling hide actions reveals all', async ({ page, dowDialog }) => {
    await dowDialog.openDialog();
    await page
        .getByRole('checkbox', { name: /hide actions/i })
        .nth(1)
        .click();
    expect(await dowDialog.getSide2Actions()).toStrictEqual(
        expect.arrayContaining(['Point', 'Rebuttal', 'Run Screaming'])
    );
    await page
        .getByRole('checkbox', { name: /hide actions/i })
        .nth(1)
        .click();
});

test('actions can be changed', async ({ page, dowDialog }) => {
    await dowDialog.openDialog();
    await page
        .getByLabel('side 1 volley 1 select')
        .selectOption('Stand & Drool');
    expect(await dowDialog.getSide1Actions()).toStrictEqual(
        expect.arrayContaining(['Stand & Drool', 'Dismiss', 'Cast Spell'])
    );
});

test('roll button will display a dialog', async ({
    page,
    dowDialog,
    rollDialog,
}) => {
    await dowDialog.openDialog();

    await page.getByRole('button', { name: /side 1 roll skill/i }).click();

    await rollDialog.expectOpened('Persuasion');
    await rollDialog.close('Persuasion');
});

test('chosen roll skill can be changed', async ({
    page,
    dowDialog,
    rollDialog,
}) => {
    await dowDialog.openDialog();

    await page
        .getByRole('combobox', { name: /side 1 skill select/i })
        .selectOption('Intimidation');
    await page.getByRole('button', { name: /side 1 roll skill/i }).click();
    await rollDialog.expectOpened('Intimidation');
    await rollDialog.close('Intimidation');
});

test('round can be cleared', async ({ page, dowDialog }) => {
    await dowDialog.openDialog();

    await page.getByRole('button', { name: /reset round/i }).click();
    expect(
        await dowDialog.getSide1Actions(),
        'expect known actions to set to "?"'
    ).toStrictEqual(expect.arrayContaining(['?', '?', '?']));
    expect(
        await dowDialog.getSide2Actions(),
        'expect hidden actions to revert'
    ).toStrictEqual(expect.arrayContaining(['Hidden', 'Hidden', 'Hidden']));

    expect(
        await page.getByLabel('side 1 statement of purpose').inputValue(),
        'expect statement to stay the same'
    ).toBe('Let me date your cousin');
});

test('dialog can be cleared', async ({ page, dowDialog, gamePage }) => {
    await dowDialog.openDialog();

    await page.getByRole('button', { name: /clear all/i }).click();

    expect(
        await page.getByLabel('side 1 statement of purpose').inputValue(),
        'expect statement clear'
    ).toBe('');

    expect(
        await gamePage.getSelectedValue(page.getByLabel('side 1 actor select')),
        'Expect participants to be cleared'
    ).toBe('Side 1');
});

// TODO: test permissions for players that own/down own actors

// TODO: test multi browser socket messaging support
