import { TestString } from '../helpers';
import { BWActor, TracksTests } from '../actors/BWActor';
import * as helpers from '../helpers';
import {
    getNoDiceErrorDialog,
    RerollMessageData,
    rollDice,
    templates,
} from './rolls';
import { BWCharacter } from '../actors/BWCharacter';
import { Armor } from '../items/armor';
import { Skill } from '../items/skill';

export async function handleFateReroll(
    target: HTMLButtonElement
): Promise<unknown> {
    const actor = game.actors?.get(target.dataset.actorId || '') as BWActor;
    const accessor = (target.dataset.accessor || '').replace('system.', '');
    const name = target.dataset.rollName || '';
    const itemId = target.dataset.itemId || '';
    const rollArray =
        target.dataset.dice?.split(',').map((s) => parseInt(s, 10)) || [];
    const successes = parseInt(target.dataset.successes || '0', 10);
    const obstacleTotal = parseInt(target.dataset.difficulty || '0', 10);
    const splitRollArray =
        target.dataset.splitDice?.split(',').map((r) => parseInt(r)) || [];
    const splitSuccesses = parseInt(target.dataset.splitSuccesses || '0');

    if (actor.system.fate === 0) {
        return helpers.notifyError(
            game.i18n.localize('BW.roll.noFateTitle'),
            game.i18n.localize('BW.roll.noFateMessage')
        );
    }

    let rollStat: { shade: helpers.ShadeString; open: boolean };
    if (['stat', 'learning'].includes(target.dataset.rerollType || '')) {
        rollStat = foundry.utils.getProperty(actor, `system.${accessor}`);
    } else if (target.dataset.rerollType === 'armor') {
        const armorItem = actor.items.get(itemId) as Armor;
        rollStat = { shade: armorItem.system.shade, open: false };
    } else {
        rollStat = (actor.items.get(itemId) as Skill).system;
    }

    const successTarget =
        rollStat.shade === 'B' ? 3 : rollStat.shade === 'G' ? 2 : 1;

    let reroll: Roll | undefined;
    let splitReroll: Roll | undefined;
    let numDice = 0;
    let splitNumDice = 0;

    if (rollStat.open) {
        // only reroll dice if there were any traitors
        numDice = rollArray.some((r) => r <= successTarget) ? 1 : 0;
        splitNumDice = numDice
            ? 0
            : splitRollArray.some((r) => r <= successTarget)
            ? 1
            : 0;
    } else {
        numDice = rollArray.filter((s) => s === 6).length;
        splitNumDice = splitRollArray.filter((s) => s === 6).length;
    }

    if (numDice) {
        reroll = await rollDice(numDice, !rollStat.open, rollStat.shade);
    }
    if (splitNumDice) {
        splitReroll = await rollDice(
            splitNumDice,
            !rollStat.open,
            rollStat.shade
        );
    }

    if (!reroll && !splitReroll) {
        return getNoDiceErrorDialog(0);
    }
    let newSuccesses = 0;
    let success = false;
    if (reroll) {
        newSuccesses = reroll.total || 0;
        success = newSuccesses + successes >= obstacleTotal;

        if (actor.system.fate !== 0 && actor.type === 'character') {
            const char = actor as BWCharacter;
            if (target.dataset.rerollType === 'stat') {
                const fateSpent = parseInt(
                    foundry.utils.getProperty(
                        actor,
                        `system.${accessor}.fate`
                    ) || '0',
                    10
                );
                const updateData = {};
                updateData[`system.${accessor}.fate`] = fateSpent + 1;
                if (successes <= obstacleTotal && success) {
                    // we turned a failure into a success. we might need to retroactively award xp.
                    if (target.dataset.ptgsAction) {
                        // shrug/grit flags may need to be set.
                        updateData[`system.ptgs.${target.dataset.ptgsAction}`] =
                            true;
                    }
                    if (
                        actor.successOnlyRolls.indexOf(name.toLowerCase()) !==
                        -1
                    ) {
                        if (!helpers.isStat(name)) {
                            char.addAttributeTest(
                                foundry.utils.getProperty(
                                    actor,
                                    `system.${accessor}`
                                ) as TracksTests,
                                name,
                                accessor,
                                target.dataset.difficultyGroup as TestString,
                                true
                            );
                        } else {
                            char.addStatTest(
                                foundry.utils.getProperty(
                                    actor,
                                    `system.${accessor}`
                                ) as TracksTests,
                                name,
                                accessor,
                                target.dataset.difficultyGroup as TestString,
                                true
                            );
                        }
                    }
                }
                actor.update(updateData);
            } else if (target.dataset.rerollType === 'skill') {
                const skill = actor.items.get<Skill>(itemId);
                const fateSpent = skill?.system.fate || 0;
                skill?.update({ 'system.fate': fateSpent + 1 }, {});
            } else if (target.dataset.rerollType === 'learning') {
                const learningTarget = target.dataset.learningTarget || 'skill';
                const skill = actor.items.get<Skill>(itemId);
                if (learningTarget === 'skill') {
                    // learning roll went to the root skill
                    const fateSpent = skill?.system.fate || 0;
                    skill?.update({ 'system.fate': fateSpent + 1 }, {});
                } else {
                    if (successes <= obstacleTotal && success) {
                        if (actor.successOnlyRolls.includes(learningTarget)) {
                            (actor as BWCharacter).addStatTest(
                                foundry.utils.getProperty(
                                    actor,
                                    `system.${learningTarget}`
                                ) as TracksTests,
                                learningTarget.titleCase(),
                                `system.${learningTarget}`,
                                target.dataset.difficultyGroup as TestString,
                                true
                            );
                        }
                    }
                    const rootAccessor = `system.${learningTarget}.fate`;
                    const rootStatFate =
                        parseInt(
                            foundry.utils.getProperty(actor, rootAccessor),
                            10
                        ) || 0;
                    const updateData = {};
                    updateData[rootAccessor] = rootStatFate + 1;
                    actor.update(updateData);
                }
            }
        }
    }

    let newSplitSuccesses = 0;
    if (splitReroll) {
        newSplitSuccesses = splitReroll.total || 0;
    }

    const actorFateCount = actor.system.fate;
    actor.update({ 'system.fate': actorFateCount - 1 });

    const data: RerollMessageData = {
        title: game.i18n.localize('BW.roll.fateReroll'),
        rolls: rollArray.map((r) => {
            return { roll: r, success: r > successTarget };
        }),
        splitRolls: splitRollArray.map((r) => {
            return { roll: r, success: r > successTarget };
        }),
        splitRerolls:
            splitReroll?.dice[0].results.map((r) => {
                return { roll: r.result, success: r.success || false };
            }) || [],
        rerolls:
            reroll?.dice[0].results.map((r) => {
                return { roll: r.result, success: r.success || false };
            }) || [],
        successes,
        splitSuccesses,
        obstacleTotal,
        newSuccesses,
        newSplitSuccesses,
        success,
    };
    const html = await renderTemplate(templates.rerollChatMessage, data);
    return ChatMessage.create({
        content: html,
        speaker: ChatMessage.getSpeaker({ actor }),
    });
}
