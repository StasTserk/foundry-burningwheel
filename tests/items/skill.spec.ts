import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Skill', 'skill');
    await items.skill.expectOpened('Test Skill');
});

test('can load sheet data', async ({ items: { skill } }) => {
    const dialog = await skill.openDialog('Modified Skill');
    await test.step('properly loaded some basic fields', async () => {
        await expect(dialog.getLabeledField('Skill Type')).toHaveValue(
            'schoolofthought'
        );
        await expect(dialog.getLabeledField('Root 1')).toHaveValue('speed');
        await expect(dialog.getLabeledField('Wild Fork')).toBeChecked();
        await expect(dialog.getLabeledField('Magical')).toBeChecked();
        await expect(dialog.getLabeledField('Requires Tools')).toBeChecked();
        await expect(dialog.description).toHaveValue(
            'A modified text description'
        );
    });

    await test.step('hides fields only visible while it is being used', async () => {
        await expect(dialog.getLabeledField('Learning')).not.toBeVisible();
        await expect(dialog.getLabeledField('Aptitude')).not.toBeVisible();
    });
});

test('it can be modified', async ({ items: { skill } }) => {
    const dialog = await skill.openDialog('Modified Skill');
    await test.step('change some fields up and close the sheet', async () => {
        await dialog.setLabeledField('Restrictions', 'none');
        await dialog.togglePillCheckbox('Magical');
        await dialog.togglePillCheckbox('Requires Tools');
        await dialog.togglePillCheckbox('Wild Fork');
        await dialog.selectOption('Root 1', 'power');
        await dialog.close();
    });

    await test.step('reopen the sheet and check values', async () => {
        dialog.open();
        await expect(dialog.getLabeledField('Restrictions')).toHaveValue(
            'none'
        );
        await expect(dialog.getLabeledField('Magical')).not.toBeChecked();
        await expect(
            dialog.getLabeledField('Requires Tools')
        ).not.toBeChecked();
        await expect(dialog.getLabeledField('Wild Fork')).not.toBeChecked();
        await expect(dialog.getLabeledField('Root 1')).toHaveValue('power');
    });
});

test('changing the skill type updates the default mage', async ({
    items: { skill },
}) => {
    const dialog = await skill.openDialog('Modified Skill');
    await test.step('check image, then change the type', async () => {
        await expect(dialog.image).toHaveAttribute(
            'src',
            /book-worn-blue.webp/i
        );
    });

    await test.step('change skill type and check the image', async () => {
        await dialog.selectOption('Skill Type', 'social');
        await expect(dialog.image).toHaveAttribute(
            'src',
            /diplomacy-handshake-yellow.webp/i
        );
    });
});

test('displays character fields when attached to a player', async ({
    char,
}) => {
    const skill =
        await test.step('open character and edit a skill', async () => {
            const sheet = await char.openCharacterDialog('Romeo');
            return await sheet.skill('Sword').edit();
        });

    await test.step('ensure character specific fields were populated', async () => {
        await expect(skill.getLabeledField('Aptitude')).toHaveValue('7');
        await expect(skill.getLabeledField('Learning')).not.toBeChecked();
        await skill.close();
    });
});
