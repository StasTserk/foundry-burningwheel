import { expect } from '../../node_modules/playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Relationship', 'relationship');
    await items.rel.expectOpened('Test Relationship');
});

test('loads sheet data', async ({ items: { rel } }) => {
    const dialog = await rel.openDialog('Modified Relationship');

    await expect(dialog.getLabeledField('Forbidden')).toBeChecked();
    await expect(dialog.getLabeledField('Immediate Family')).toBeChecked();
    await expect(dialog.getLabeledField('Other Family')).toBeChecked();
    await expect(dialog.getLabeledField('Romantic')).toBeChecked();
    await expect(dialog.getLabeledField('Hateful/Rival')).toBeChecked();
    await expect(dialog.getLabeledField('Building')).not.toBeChecked();
    await expect(dialog.getLabeledField('Enmity Clause')).toBeChecked();
    await expect(dialog.getLabeledField('Influence')).toHaveValue(
        'significant'
    );
    await expect(dialog.description).toHaveValue('A modified text description');
});

test('can be modified', async ({ items: { rel } }) => {
    const dialog = await rel.openDialog('Modified Relationship');
    await test.step('update the sheet data', async () => {
        await dialog.togglePillCheckbox('Forbidden');
        await dialog.togglePillCheckbox('Building');
        await dialog.togglePillCheckbox('Other Family');
        await dialog.selectOption('Influence', 'powerful');
        await dialog.close();
    });

    await test.step('check changes got persisted', async () => {
        await dialog.open();

        await expect(dialog.getLabeledField('Forbidden')).not.toBeChecked();
        await expect(dialog.getLabeledField('Building')).toBeChecked();
        await expect(dialog.getLabeledField('Other Family')).not.toBeChecked();
        await expect(dialog.getLabeledField('Influence')).toHaveValue(
            'powerful'
        );
    });
});
