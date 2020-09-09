import { Ability, BWActor, BWCharacter } from "../bwactor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import {
    AttributeDialogData,
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    rollDice,
    templates,
    RollOptions,
    extractRollData
} from "./rolls.js";

export async function handleAttrRoll({ target, sheet }: RollOptions): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor || "") as Ability;
    const actor = sheet.actor as BWActor;
    const attrName = target.dataset.rollableName || "Unknown Attribute";
    const rollModifiers = sheet.actor.getRollModifiers(attrName);
    const data: AttributeDialogData = {
        name: `${attrName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: attrName === "Steel" ? actor.data.data.ptgs.woundDice : undefined,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    };

    const html = await renderTemplate(templates.attrDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${target.dataset.rollableName} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        attrRollCallback(dialogHtml, stat, sheet, attrName, target.dataset.accessor || "")
                }
            }
        }).render(true)
    );
}

async function attrRollCallback(
        dialogHtml: JQuery,
        stat: Ability,
        sheet: BWActorSheet,
        name: string,
        accessor: string) {
    const rollData = extractRollData(dialogHtml);

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) { return; }

    const isSuccessful = parseInt(roll.result) >= (rollData.difficultyTotal);

    const fateReroll = buildRerollData(sheet.actor, roll, accessor);
    const callons: RerollData[] = sheet.actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData(sheet.actor, roll, accessor) as RerollData };
    });
    const data: RollChatMessageData = {
        name: `${name}`,
        successes: roll.result,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccessful,
        rolls: roll.dice[0].rolls,
        difficultyGroup: rollData.difficultyGroup,
        penaltySources: rollData.obSources,
        dieSources: { ...rollData.dieSources },
        fateReroll,
        callons
    };
    if (sheet.actor.data.type === "character") {
        (sheet.actor as BWActor & BWCharacter).addAttributeTest(stat, name, accessor, rollData.difficultyGroup, isSuccessful);
    }
    const messageHtml = await renderTemplate(templates.attrMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}