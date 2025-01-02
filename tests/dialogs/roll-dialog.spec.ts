import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('basic skill roll workflow', async ({ char, chat }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const skill = sheet.skill('Brawling');
    const roll = await skill.roll();

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
        await expect(skill.difficultProgress, {
            message: 'Expect progress to have been tracked',
        }).toHaveValue('1');
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

test('triggers advancement', async ({ char, gamePage }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const skill = sheet.skill('Intimidation');

    await test.step('get skill close to advancing then roll it', async () => {
        await skill.setRoutineProgress('1');
        (await skill.roll()).roll();
    });

    await test.step('ensure advancement triggers', async () => {
        await gamePage.expectOpenedDialog('Advance Intimidation?');
        await gamePage.clickDialogButton('Advance Intimidation?', /yes/i);
        await expect(skill.exponent).toHaveValue('2');
        await expect(skill.routineNeeded).toHaveValue('2');
    });
    await sheet.close();
});

test('learning skill can advance', async ({ char, gamePage }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const skill = sheet.learningSkill('Falsehood');

    await test.step('get skill close to advancing then roll it', async () => {
        await skill.setLearningProgress('5');
        const dialog = await skill.roll();
        await dialog.bonusDice.fill('10');
        await dialog.roll();
    });

    await test.step('ensure advancement triggers', async () => {
        await gamePage.expectOpenedDialog('Finish training Falsehood?');
        await gamePage.clickDialogButton('Finish training Falsehood?', /yes/i);
        const trainedSkill = await sheet.skill('Falsehood');
        await expect(trainedSkill.exponent).toHaveValue('2');
    });
    await sheet.close();
});
