import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('basic skill roll workflow', async ({ char, chat }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const roll = await sheet.skill('Brawling').roll();

    await test.step('check auto includes', async () => {
        await expect(roll.exponent).toHaveValue('2');
        await expect(roll.woundPenalty).toHaveValue('1');
        await roll.setBonusDice(2);
    });

    await test.step('check all the forks are there', async () => {
        await expect(roll.fork('Intimidation')).toBeVisible();
        await expect(roll.fork('Persuasion')).toBeVisible();
        await expect(roll.fork('Sword')).toBeVisible();
        await expect(roll.fork('Theatrics')).toBeVisible();
    });
    await test.step('ensure own skill is not in fork', async () => {
        await expect(roll.fork('Brawling')).not.toBeVisible();
    });
    await test.step('roll skill, and verify results', async () => {
        await roll.roll();
        await sheet.close();
        const result = await chat.getChatMessage('Brawling Test');
        await expect(result.obstacles).toContainText([
            '+3 Base Obstacle',
            '+1 Wound Penalty',
        ]);
        await expect(result.dice).toContainText(['Exponent +2', 'Bonus +2']);
        expect(await result.results.all()).toHaveLength(4);
    });
});
