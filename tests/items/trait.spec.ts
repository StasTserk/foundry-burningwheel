import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Trait', 'trait');
    await items.trait.expectOpened('Test Trait');
});

test('loads sheet data for char trait', async ({ items: { trait } }) => {
    const dialog = await trait.openDialog('Modified Trait');
    await expect(dialog.getLabeledField('Restrictions')).toHaveValue(
        'Testing only'
    );
    await expect(dialog.getLabeledField('Trait Type')).toHaveValue('character');
    await expect(dialog.getLabeledField('Cost')).toHaveValue('1');
});

test('char trait can be modified', async ({ items: { trait } }) => {
    const dialog = await trait.openDialog('Modified Trait');
    await test.step('change char trait fields', async () => {
        await dialog.setLabeledField('Restrictions', 'only testing');
        await dialog.setLabeledField('Cost', '11');
        await dialog.close();
    });

    await test.step('check fields were changed', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('Restrictions')).toHaveValue(
            'only testing'
        );
        await expect(dialog.getLabeledField('Cost')).toHaveValue('11');
    });
});

test('die trait loads sheet data', async ({ items: { trait } }) => {
    const dialog = await trait.openDialog('Modified Trait Die');
    await expect(dialog.getLabeledField('Restrictions')).toHaveValue(
        'Testing only'
    );
    await expect(dialog.getLabeledField('Trait Type')).toHaveValue('die');
    await expect(dialog.getLabeledField('Cost')).toHaveValue('2');

    await test.step('test die specific fields', async () => {
        await expect(dialog.getLabeledField('Has Die Modifier')).toBeChecked();
        await expect(dialog.getLabeledField('die rolls affected')).toHaveValue(
            'Spelling'
        );
        await expect(
            dialog.locator.getByLabel('Die Modifier', { exact: true })
        ).toHaveValue('1');

        await expect(dialog.getLabeledField('Adds Reputation')).toBeChecked();
        await expect(dialog.getLabeledField('Reputation Name')).toHaveValue(
            'Yes'
        );
        await expect(dialog.getLabeledField('Infamous')).toBeChecked();
    });
});

test('die traits can be edited', async ({ items: { trait } }) => {
    const dialog = await trait.openDialog('Modified Trait Die');
    await test.step('modify some die trait values', async () => {
        await dialog.togglePillCheckbox('Has Die Modifier');
        await dialog.setLabeledField('reputation dice', '99');
        await dialog.togglePillCheckbox('Infamous');
        await dialog.close();
    });

    await test.step('check fields were persisted', async () => {
        await dialog.open();
        await expect(
            dialog.getLabeledField('Has Die Modifier')
        ).not.toBeChecked();
        await expect(dialog.getLabeledField('reputation dice')).toHaveValue(
            '99'
        );
        await expect(dialog.getLabeledField('Infamous')).not.toBeChecked();
    });
});

test('call on sheet data loads correctly', async ({ items: { trait } }) => {
    const dialog = await trait.openDialog('Modified Trait Call-on');
    await expect(dialog.getLabeledField('Call-on Rolls')).toHaveValue(
        'Sorcery'
    );
});

test('call on traits can be edited', async ({ items: { trait } }) => {
    const dialog = await trait.openDialog('Modified Trait Call-on');
    await dialog.setLabeledField('Call-on Rolls', 'Swimming');
    await dialog.close();
    await dialog.open();
    await expect(dialog.getLabeledField('Call-on Rolls')).toHaveValue(
        'Swimming'
    );
});

test('changing trait type displays different fields', async ({
    items: { trait },
}) => {
    const dialog = await trait.openDialog('Modified Trait Call-on');
    await dialog.selectOption('Trait Type', 'die');
    await expect(dialog.locator.getByText('Has Die Modifier')).toBeVisible();
});

test('die traits add respective items when dropped on sheet', async ({
    char,
    items: { trait },
    gamePage,
    page,
}) => {
    test.slow();
    const character = await char.openCharacterDialog('Romeo');
    await test.step('tweak some die trait data', async () => {
        const dialog = await trait.openDialog('Modified Trait Die');
        await dialog.setLabeledField('reputation dice', '2');
        await dialog.close();
    });
    await test.step('drop die trait onto character sheet', async () => {
        await gamePage.openTab('Items');
        await page
            .locator('#sidebar')
            .getByText('Modified Trait Die')
            .dragTo(character.locator);
    });

    await expect(character.reputation('Yes').locator).toBeVisible();
    await expect(character.affiliation('Spellcraft').locator).toBeVisible();

    await test.step('make sure rep data populated correctly', async () => {
        const rep = await character.reputation('Yes').edit();
        await expect(rep.getLabeledField('Dice')).toHaveValue('2');
        await expect(rep.getLabeledField('Infamous')).toBeChecked();
        rep.close();
    });

    await test.step('make sure aff data populated correctly', async () => {
        const aff = await character.affiliation('Spellcraft').edit();
        await expect(aff.dieValue).toHaveValue('3');
    });
});
