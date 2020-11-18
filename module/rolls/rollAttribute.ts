import { Ability } from "../bwactor.js";
import {
    AttributeDialogData,
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    rollDice,
    templates,
    extractRollData,
    EventHandlerOptions,
    mergeDialogData
} from "./rolls.js";
import { BWCharacterSheet } from "../character-sheet.js";

export async function handleAttrRollEvent({ target, sheet, dataPreset }: EventHandlerOptions): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, target.dataset.accessor || "") as Ability;
    const actor = sheet.actor;
    const attrName = target.dataset.rollableName || "Unknown Attribute";
    const rollModifiers = sheet.actor.getRollModifiers(attrName);
    dataPreset = dataPreset || {};
    const woundDice = attrName === "Steel" ? actor.data.data.ptgs.woundDice : undefined;
    const obPenalty = attrName === "Steel" ? actor.data.data.ptgs.obPenalty : undefined;
    if (attrName.toLowerCase() === "steel") {
        dataPreset.useCustomDifficulty = true;
        dataPreset.showDifficulty = true;
        dataPreset.showObstacles = true;
        dataPreset.difficulty = actor.data.data.hesitation || 0;
    }
    const data: AttributeDialogData =  mergeDialogData<AttributeDialogData>({
        name: `${attrName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice,
        obPenalty,
        stat,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: (!game.burningwheel.useGmDifficulty) || !!obPenalty
    }, dataPreset);

    const html = await renderTemplate(templates.pcRollDialog, data);
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
        sheet: BWCharacterSheet,
        name: string,
        accessor: string) {
    const rollData = extractRollData(dialogHtml);

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) { return; }

    const isSuccessful = parseInt(roll.result) >= (rollData.difficultyTotal);

    const fateReroll = buildRerollData({ actor: sheet.actor, roll, accessor });
    const callons: RerollData[] = sheet.actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData({ actor: sheet.actor, roll, accessor }) as RerollData };
    });

    sheet.actor.updateArthaForStat(accessor, rollData.persona, rollData.deeds);

    const data: RollChatMessageData = {
        name: `${name}`,
        successes: roll.result,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccessful,
        rolls: roll.dice[0].results,
        difficultyGroup: rollData.difficultyGroup,
        penaltySources: rollData.obSources,
        dieSources: { ...rollData.dieSources },
        fateReroll,
        callons
    };
    if (sheet.actor.data.type === "character" && !rollData.skipAdvancement) {
        sheet.actor.addAttributeTest(stat, name, accessor, rollData.difficultyGroup, isSuccessful);
    }
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}