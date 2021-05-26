import { TestString } from "../helpers.js";
import { BWActor, TracksTests } from "../actors/BWActor.js";
import * as helpers from "../helpers.js";
import { getNoDiceErrorDialog, RerollMessageData, rollDice, templates } from "./rolls.js";
import { BWCharacter } from "../actors/BWCharacter.js";
import { Armor } from "../items/armor.js";
import { Skill } from "../items/skill.js";

export async function handleFateReroll(target: HTMLButtonElement): Promise<unknown> {
    const actor = game.actors?.get(target.dataset.actorId || "") as BWActor;
    const accessor = target.dataset.accessor || '';
    const name = target.dataset.rollName || '';
    const itemId = target.dataset.itemId || '';
    const rollArray = target.dataset.dice?.split(',').map(s => parseInt(s, 10)) || [];
    const successes = parseInt(target.dataset.successes || "0", 10);
    const obstacleTotal = parseInt(target.dataset.difficulty || "0", 10);
    const splitRollArray = target.dataset.splitDice?.split(',').map(r => parseInt(r)) || [];
    const splitSuccesses = parseInt(target.dataset.splitSuccesses || "0");

    if (actor.data.data.fate === 0) {
        return helpers.notifyError("No Fate Points", "The character does not have any fate points left with which to reroll.");
    }

    let rollStat: { shade: helpers.ShadeString, open: boolean };
    if (["stat", "learning"].includes(target.dataset.rerollType || "")) {
        rollStat = getProperty(actor, `data.${accessor}`);
    } else if (target.dataset.rerollType === "armor") {
        const armorItem = actor.getOwnedItem(itemId) as Armor;
        rollStat = { shade: armorItem.data.data.shade, open: false, };
    } else {
        rollStat = (actor.getOwnedItem(itemId) as Skill).data.data;
    }

    const successTarget = rollStat.shade === "B" ? 3 : (rollStat.shade === "G" ? 2 : 1);

    let reroll: Roll | undefined;
    let splitReroll: Roll | undefined;
    let numDice = 0;
    let splitNumDice = 0;

    if (rollStat.open) {
        // only reroll dice if there were any traitors
        numDice = rollArray.some(r => r <= successTarget) ? 1 : 0;
        splitNumDice = numDice ? 0 : (splitRollArray.some(r => r <= successTarget) ? 1 : 0);
    } else {
        numDice = rollArray.filter(s => s === 6).length;
        splitNumDice = splitRollArray.filter(s => s === 6).length;
    }

    if (numDice) { 
        reroll = await rollDice(numDice, !rollStat.open, rollStat.shade);
    }
    if (splitNumDice) {
        splitReroll = await rollDice(splitNumDice, !rollStat.open, rollStat.shade);
    }


    if (!reroll && !splitReroll) { return getNoDiceErrorDialog(0); }
    let newSuccesses = 0;
    let success = false;
    if (reroll) {
        newSuccesses = reroll.total || 0;
        success = (newSuccesses + successes) >= obstacleTotal;

        if (actor.data.data.fate !== 0 && actor.data.type === "character") {
            const char = actor as BWCharacter;
            if (target.dataset.rerollType === "stat") {
                const fateSpent = parseInt(getProperty(actor, `data.${accessor}.fate`) || "0", 10);
                const updateData = {};
                updateData[`${accessor}.fate`] = fateSpent + 1;
                if (successes <= obstacleTotal && success) {
                    // we turned a failure into a success. we might need to retroactively award xp.
                    if (target.dataset.ptgsAction) { // shrug/grit flags may need to be set.
                        updateData[`data.ptgs.${target.dataset.ptgsAction}`] = true;
                    }
                    if (actor.data.successOnlyRolls.indexOf(name.toLowerCase()) !== -1) {
                        if (!helpers.isStat(name)) {
                            char.addAttributeTest(
                                getProperty(actor, `data.${accessor}`) as TracksTests,
                                name,
                                accessor,
                                target.dataset.difficultyGroup as TestString,
                                true);
                        }
                        else {
                            char.addStatTest(
                                getProperty(actor, `data.${accessor}`) as TracksTests,
                                name,
                                accessor,
                                target.dataset.difficultyGroup as TestString,
                                true);
                        }
                    }
                }
                actor.update(updateData);
            } else if (target.dataset.rerollType === "skill") {
                const skill = actor.getOwnedItem(itemId) as Skill;
                const fateSpent = skill.data.data.fate || 0;
                skill.update({ 'data.fate': fateSpent + 1 }, {});
            } else if (target.dataset.rerollType === "learning") {
                const learningTarget = target.dataset.learningTarget || 'skill';
                const skill = actor.getOwnedItem(itemId) as Skill;
                if (learningTarget === 'skill') {
                    // learning roll went to the root skill
                    const fateSpent = skill.data.data.fate || 0;
                    skill.update({'data.fate': fateSpent + 1 }, {});
                } else {
                    if (successes <= obstacleTotal && success) {
                        if (actor.data.successOnlyRolls.includes(learningTarget)) {
                            (actor as BWActor & BWCharacter).addStatTest(
                                getProperty(actor, `data.data.${learningTarget}`) as TracksTests,
                                learningTarget.titleCase(),
                                `data.${learningTarget}`,
                                target.dataset.difficultyGroup as TestString,
                                true);
                        }
                    }
                    const rootAccessor = `data.${learningTarget}.fate`;
                    const rootStatFate = parseInt(getProperty(actor, `data.${rootAccessor}`), 10) || 0;
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

    const actorFateCount = actor.data.data.fate;
    actor.update({ 'data.fate': actorFateCount -1 });

    const data: RerollMessageData = {
        title: "Fate Reroll",
        rolls: rollArray.map(r => { return { roll: r, success: r > successTarget }; }),
        splitRolls: splitRollArray.map(r => { return { roll: r, success: r > successTarget }; }),
        splitRerolls: splitReroll?.dice[0].results.map(r => { return { roll: r.result, success: r.success || false }; }) || [],
        rerolls: reroll?.dice[0].results.map(r => { return { roll: r.result, success: r.success || false }; }) || [],
        successes,
        splitSuccesses,
        obstacleTotal,
        newSuccesses,
        newSplitSuccesses,
        success
    };
    const html = await renderTemplate(templates.rerollChatMessage, data);
    return ChatMessage.create({
        content: html,
        speaker: ChatMessage.getSpeaker({actor})
    });
}
