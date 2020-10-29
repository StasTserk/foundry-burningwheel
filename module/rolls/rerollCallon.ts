import { TestString } from "../helpers.js";
import { Ability, TracksTests, BWCharacter } from "../bwactor.js";
import * as helpers from "../helpers.js";
import { Skill, SkillData } from "../items/item.js";
import { rollDice, templates } from "./rolls.js";

export async function handleCallonReroll(target: HTMLButtonElement): Promise<unknown> {
    const actor = game.actors.get(target.dataset.actorId || "") as BWCharacter;
    const accessor = target.dataset.accessor || '';
    const name = target.dataset.rollName || '';
    const itemId = target.dataset.itemId || '';
    const rollArray = target.dataset.dice?.split(',').map(r => parseInt(r)) || [];
    const splitRollArray = target.dataset.splitDice?.split(',').map(r => parseInt(r)) || [];
    const successes = parseInt(target.dataset.successes || "0");
    const obstacleTotal = parseInt(target.dataset.difficulty || "0");
    const splitSuccesses = parseInt(target.dataset.splitSuccesses || "0");

    let rollStat: Ability | SkillData;
    if (target.dataset.rerollType === "stat") {
        rollStat = getProperty(actor, `data.${accessor}`);
    } else {
        rollStat = (actor.getOwnedItem(itemId) as Skill).data.data;
    }

    const successTarget = rollStat.shade === "B" ? 3 : (rollStat.shade === "G" ? 2 : 1);

    const numDice = rollArray.filter(r => r <= successTarget).length || 0;
    const numSplitDice = splitRollArray.filter(r => r <= successTarget).length || 0;
    
    const reroll = numDice ? await rollDice(numDice, rollStat.open, rollStat.shade) : undefined;
    const splitReroll = numSplitDice ? await rollDice(numSplitDice, rollStat.open, rollStat.shade) : undefined;

    let newSuccesses = 0;
    let success = false;

    if (!numDice && !numSplitDice) { return; }
    if (reroll) {
        newSuccesses = reroll.total || 0;
        success = (newSuccesses + successes) >= obstacleTotal;
        if (actor.data.type === "character") {
            // only characters worry about turning failures into successes.
            // NPCs don't track things closely enough.
            if (target.dataset.rerollType === "stat") {
                if (successes <= obstacleTotal && success) {
                    // we turned a failure into a success. we might need to retroactively award xp.
                    if (target.dataset.ptgsAction) { // shrug/grit flags may need to be set.
                        const updateData = {};
                        updateData[`data.ptgs.${target.dataset.ptgsAction}`] = true;
                        actor.update(updateData);
                    }
                    if (actor.data.successOnlyRolls.indexOf(name.toLowerCase()) !== -1) {
                        if (!helpers.isStat(name)) {
                            actor.addAttributeTest(
                                getProperty(actor, `data.${accessor}`) as TracksTests,
                                name,
                                accessor,
                                target.dataset.difficultyGroup as TestString,
                                true);
                        }
                        else {
                            actor.addStatTest(
                                getProperty(actor, `data.${accessor}`) as TracksTests,
                                name,
                                accessor,
                                target.dataset.difficultyGroup as TestString,
                                true);
                        }
                    }
                }

            } else if (target.dataset.rerollType === "learning") {
                const learningTarget = target.dataset.learningTarget || 'skill';
                if (learningTarget === 'perception' && successes <= obstacleTotal && success) {
                    // we need to give perception a success that was not counted
                    actor.addStatTest(
                        getProperty(actor, "data.data.perception") as TracksTests,
                        "Perception",
                        "data.perception",
                        target.dataset.difficultyGroup as TestString,
                        true);
                }
            }
        }
    }

    let newSplitSuccesses = 0;
    if (splitReroll) {
        newSplitSuccesses = splitReroll.total || 0;
    }

    const data: RerollMessageData = {
        title: "Call-on Reroll",
        rolls: rollArray.map(r => { return { roll: r, success: r > successTarget }; }),
        splitRolls: splitRollArray.map(r => { return { roll: r, success: r > successTarget }; }),
        rerolls: reroll?.dice[0].results.map(r => { return { roll: r.result, success: r.success || false }; }) || [],
        splitRerolls: splitReroll?.dice[0].results.map(r => { return { roll: r.result, success: r.success || false }; }) || [],
        successes,
        obstacleTotal,
        newSuccesses,
        success,
        splitSuccesses,
        newSplitSuccesses
    };
    const html = await renderTemplate(templates.rerollChatMessage, data);
    return ChatMessage.create({
        content: html,
        speaker: ChatMessage.getSpeaker({actor})
    });
}


export interface RerollMessageData {
    title: string;
    rolls: { roll: number, success: boolean }[];
    splitRolls: { roll: number, success: boolean }[];
    rerolls: { roll: number, success: boolean }[];
    splitRerolls: { roll: number, success: boolean }[];
    success: boolean;
    successes: number;
    newSuccesses: number;
    splitSuccesses: number;
    newSplitSuccesses: number;
    obstacleTotal: number;
}
