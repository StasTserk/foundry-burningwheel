import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Melee weapon', 'melee weapon');
    await items.melee.expectOpened('Test Melee weapon');
});

test('loads sheet data', async ({ items: { melee } }) => {
    const dialog = await melee.openDialog('Modified Melee weapon');
    await test.step('test basic weapon data', async () => {
        await expect(dialog.getLabeledField('Shade')).toHaveValue('G');
        await expect(dialog.getLabeledField('Weapon Quality')).toHaveValue(
            'poor'
        );
        await expect(dialog.getLabeledField('Handedness')).toHaveValue('two');
        await expect(dialog.getLabeledField('Resource Point Cost')).toHaveValue(
            '2'
        );
    });

    await test.step('test some recurring attack section values', async () => {
        await expect(dialog.getLabeledField('attack 0 add')).toHaveValue('4');
        await expect(dialog.getLabeledField('attack 1 add')).toHaveValue('7');
        await expect(dialog.getLabeledField('attack 0 length')).toHaveValue(
            'longest'
        );
        await expect(dialog.getLabeledField('attack 1 length')).toHaveValue(
            'longer'
        );
    });
});

test('can be edited', async ({ items: { melee } }) => {
    const dialog = await melee.openDialog('Modified Melee weapon');
    await test.step('modify some fields and close the sheet', async () => {
        await dialog.setLabeledField('Resource Point Cost', '22');
        await dialog.selectOption('Shade', 'W');
        await dialog.selectOption('attack 0 speed', '1');
        await dialog.selectOption('attack 1 length', 'short');
        await dialog.selectOption('Handedness', 'one');
        await dialog.close();
    });

    await test.step('reopen dialog and ensure data saved', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('Resource Point Cost')).toHaveValue(
            '22'
        );
        await expect(dialog.getLabeledField('Shade')).toHaveValue('W');
        await expect(dialog.getLabeledField('Handedness')).toHaveValue('one');
        await expect(dialog.getLabeledField('attack 0 speed')).toHaveValue('1');
        await expect(dialog.getLabeledField('attack 1 length')).toHaveValue(
            'short'
        );
    });
});

test('can add and remove attack variants', async ({ items: { melee } }) => {
    const dialog = await melee.openDialog('Modified Melee weapon');
    await test.step('delete variant and verify deletion', async () => {
        await dialog.removeAttack(1);
        await expect(dialog.getLabeledField('attack 1 name')).not.toBeVisible();
        await expect(dialog.getLabeledField('attack 0 name')).toHaveValue(
            'Primary'
        );
    });
    await test.step('can make a new attack option', async () => {
        await dialog.addAttack();
        await dialog.setLabeledField('attack 1 name', 'newly added attack');
        await dialog.setLabeledField('attack 1 power', '99');
        await dialog.selectOption('attack 1 speed', 'x');
        await dialog.close();
    });

    await test.step('the changes survive a reload', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('attack 1 name')).toHaveValue(
            'newly added attack'
        );
        await expect(dialog.getLabeledField('attack 1 power')).toHaveValue(
            '99'
        );
        await expect(dialog.getLabeledField('attack 1 speed')).toHaveValue('x');
    });
});
