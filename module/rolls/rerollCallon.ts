import { TestString } from "module/helpers.js";
import { Ability, BWActor, TracksTests } from "../actor.js";
import * as helpers from "../helpers.js";
import { Skill, SkillData } from "../items/item.js";
import { rollDice, templates } from "./rolls.js";

export async function handleCallonReroll(target: HTMLButtonElement): Promise<unknown> {
    const actor = game.actors.get(target.dataset.actorId || "") as BWActor;
    const accessor = target.dataset.accessor || '';
    const name = target.dataset.rollName || '';
    const itemId = target.dataset.itemId || '';
    const rollArray = target.dataset.dice?.split(',').map(s => parseInt(s, 10)) || [];
    const successes = parseInt(target.dataset.successes || "0", 10);
    const obstacleTotal = parseInt(target.dataset.difficulty || "0", 10);

    let rollStat: Ability | SkillData;
    if (target.dataset.rerollType === "stat") {
        rollStat = getProperty(actor, `data.${accessor}`);
    } else {
        rollStat = (actor.getOwnedItem(itemId) as Skill).data.data;
    }

    const successTarget = rollStat.shade === "B" ? 3 : (rollStat.shade === "G" ? 2 : 1);

    let reroll: Roll | undefined;
    const numDice = rollArray.filter(r => r <= successTarget).length || 0;
    reroll = await rollDice(numDice, rollStat.open, rollStat.shade);

    if (!reroll) { return; }
    const newSuccesses = parseInt(reroll.result, 10);
    const success = (newSuccesses + successes) >= obstacleTotal;

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

    const data: RerollMessageData = {
        title: "Call-on Reroll",
        rolls: rollArray.map(r => { return { roll: r, success: r > successTarget }; }),
        rerolls: reroll.dice[0].rolls,
        successes,
        obstacleTotal,
        newSuccesses,
        success
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
    rerolls: { roll: number, success: boolean }[];
    success: boolean;
    successes: number;
    newSuccesses: number;
    obstacleTotal: number;
}
