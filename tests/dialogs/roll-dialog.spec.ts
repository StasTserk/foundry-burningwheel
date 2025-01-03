import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';
import { RollDialog } from '../fixtures/parts/RollDialog';

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

test('health roll special rules', async ({ char }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const roll = await sheet.attribute('Health').roll();

    await expect(roll.woundPenalty, {
        message: 'ensure health is not affected by wounds',
    }).not.toBeVisible();

    await test.step('ensure health is affected by armor', async () => {
        await expect(
            roll.optionalObModifier('Armor Clumsy Weight')
        ).toBeVisible();
        await expect(roll.optionalObModifier('Untrained Armor')).toBeVisible();
        await roll.close();
    });
});

test('Circles roll special rules', async ({ char }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const roll = await sheet.attribute('Circles').roll();

    await expect(roll.woundPenalty, {
        message: 'ensure Circles is not affected by wounds',
    }).not.toBeVisible();

    await expect(roll.repModifier('All Around Cool Dude'), {
        message: 'Reputation added to circles roll',
    }).toBeVisible();
    await expect(roll.repModifier('Veronan Nobility'), {
        message: 'Affiliation added to circles roll',
    }).toBeVisible();
});

test('Resources roll special rules', async ({ char, gamePage }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const roll = await sheet.attribute('Resources').roll();

    await expect(roll.woundPenalty, {
        message: 'ensure Resources is not affected by wounds',
    }).not.toBeVisible();
    await expect(roll.cashDice, {
        message: 'Cash dice are usable for the roll ',
    }).toBeVisible();
    await expect(roll.fundDice, {
        message: 'Fund dice are usable for the roll ',
    }).toBeVisible();

    await test.step('roll impossible challenging test', async () => {
        await roll.bonusDice.fill('-1');
        await roll.roll();
    });

    await test.step('navigate failed resources test dialog', async () => {
        await gamePage.expectOpenedDialog('Failed Resource Roll');
        await gamePage.clickDialogButton(
            'Failed Resource Roll',
            'Cut your losses'
        );
    });

    await expect(sheet.attribute('Resources').tax, {
        message: 'Expect tax to be added',
    }).toHaveValue('1');
    await expect(sheet.attribute('Resources').challengingProgress, {
        message: 'Expect no tracked progress',
    }).toHaveValue('0');
    const reRoll = await sheet.attribute('Resources').roll();
    await expect(reRoll.locator).toBeVisible();
});

test('Steel roll special rules', async ({ char }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const roll = await sheet.attribute('Steel').roll();

    await expect(roll.woundPenalty, {
        message: 'ensure Steel is affected by wounds',
    }).toBeVisible();

    await expect(roll.customObstacle, {
        message: 'Steel tests against hesitation instead of GM set value',
    }).toHaveValue('6');
});

test('attribute advancement and artha tracking', async ({ char, gamePage }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const attr = sheet.attribute('Resources');

    await test.step('get skill one test away from increasing', async () => {
        await attr.setRoutineProgress('1');
        await attr.setDifficultProgress('1');
        await attr.setChallengingProgress('1');
    });

    await test.step('roll test with tons of bonus dice and artha', async () => {
        const roll = await attr.roll();
        await roll.bonusDice.fill('99');
        await roll.personaDice.selectOption('1');
        await roll.roll();
    });

    await gamePage.clickDialogButton('Advance Resources?', 'Yes');

    await test.step('expect stuff got updated', async () => {
        await expect(
            sheet.locator.getByLabel('Persona', { exact: true })
        ).toHaveValue('2');
        await expect(attr.personaSpent).toHaveValue('1');
        await expect(attr.exponent).toHaveValue('3');
        await expect(attr.routineNeeded).toHaveValue('3');
        await expect(attr.difficultNeeded).toHaveValue('2');
    });
});

test('stat advancement and artha tracking', async ({ char, gamePage }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const attr = sheet.stat('Agility');

    await test.step('get agility one test away from advancing', async () => {
        await attr.setDifficultProgress('2');
    });

    await test.step('Roll a challenging agility test', async () => {
        const roll = await attr.roll();
        await roll.personaDice.selectOption('2');
        await roll.roll();
    });

    await gamePage.clickDialogButton('Advance Agility?', 'Yes');
    await test.step('expect stuff got updated', async () => {
        await expect(
            sheet.locator.getByLabel('Persona', { exact: true })
        ).toHaveValue('1');
        await expect(attr.personaSpent).toHaveValue('2');
        await expect(attr.exponent).toHaveValue('4');
        await expect(attr.difficultNeeded).toHaveValue('2');
    });
});

test('rolling from relationship', async ({ char }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const rel = await sheet.relationship('Juliet');

    const roll = await rel.roll();
    await expect(roll.relationshipDice).toHaveValue('1');
    await roll.roll();
    5;
    await expect(rel.buildingProgress).toHaveValue('4');
});

test('rolling spells', async ({ char, page, gamePage }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    const spell = sheet.spell('Jazz Hands');

    // the one sorcerous kill on the sheet
    await spell.skill.selectOption('DSHW1Op7MQnEJ988');
    const roll = await spell.roll('The Power of Jazz');

    expect(roll.locator).toBeVisible();
    await roll.roll();

    const taxDialog = RollDialog.getDialog(page, 'Jazz Hands Tax Test');
    await expect(taxDialog.locator).toBeVisible();
    await taxDialog.bonusDice.fill('-3');
    await taxDialog.roll();
    await gamePage.clickDialogButton('Taxed', 'Ok');
});

test('weapons and armor section', async ({ char, gamePage, page }) => {
    const sheet = await char.openCharacterDialog('Romeo');
    await test.step('stab someone', async () => {
        const weapon = sheet.meleeWeapon('A Dirk');
        const dialog = await weapon.roll('Sword');
        await dialog.roll();
    });

    await test.step("beginner's luck to shoot someone", async () => {
        const ranged = sheet.rangedWeapon("A Frickin' Gun");
        const dialog2 = await ranged.roll('Firearms');
        await gamePage.clickDialogButton('Pick Root Stat', 'Agility');
        await dialog2.roll();
    });

    await test.step('do a quick armor roll', async () => {
        const sheet = await char.openCharacterDialog('Romeo');
        await sheet.locator.getByLabel('roll torso').click();
        const armorDialog = RollDialog.getDialog(page, 'armor');
        await armorDialog.roll();
    });
});
