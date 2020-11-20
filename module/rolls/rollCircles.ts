import { Ability } from "../actors/bwactor.js";
import * as helpers from "../helpers.js";
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
import { BWCharacterSheet } from "../actors/sheets/character-sheet.js";
import { Relationship } from "../items/relationship.js";

export async function handleCirclesRollEvent({ target, sheet, dataPreset }: EventHandlerOptions): Promise<unknown> {
    const stat = getProperty(sheet.actor.data, "data.circles") as Ability;
    let circlesContact: Relationship | undefined;
    if (target.dataset.relationshipId) {
        circlesContact = sheet.actor.getOwnedItem(target.dataset.relationshipId) as Relationship;
    }
    const actor = sheet.actor;
    const rollModifiers = sheet.actor.getRollModifiers("circles");
    const data: CirclesDialogData = mergeDialogData<CirclesDialogData>({
        name: target.dataset.rollableName || "Circles Test",
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        circlesBonus: actor.data.circlesBonus,
        circlesMalus: actor.data.circlesMalus,
        circlesContact,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty
    }, dataPreset);

    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `Circles Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        circlesRollCallback(dialogHtml, stat, sheet, circlesContact)
                }
            }
        }).render(true)
    );
}

async function circlesRollCallback(
        dialogHtml: JQuery,
        stat: Ability,
        sheet: BWCharacterSheet,
        contact?: Relationship) {
    const rollData = extractRollData(dialogHtml);

    if (contact) {
        rollData.dieSources["Named Contact"] = "+1";
        rollData.diceTotal ++;
        rollData.difficultyDice ++;
        rollData.difficultyGroup = helpers.difficultyGroup(rollData.difficultyDice, rollData.difficultyTestTotal);
    }

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) { return; }

    const fateReroll = buildRerollData({ actor: sheet.actor, roll, accessor: "data.circles" });
    const callons: RerollData[] = sheet.actor.getCallons("circles").map(s => {
        return { label: s, ...buildRerollData({ actor: sheet.actor, roll, accessor: "data.circles" }) as RerollData };
    });

    sheet.actor.updateArthaForStat("data.circles", rollData.persona, rollData.deeds);

    const data: RollChatMessageData = {
        name: `Circles`,
        successes: roll.result,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: parseInt(roll.result) >= rollData.difficultyTotal,
        rolls: roll.dice[0].results,
        difficultyGroup: rollData.difficultyGroup,
        dieSources: rollData.dieSources,
        penaltySources: rollData.obSources,
        fateReroll,
        callons
    };
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);

    if (!rollData.skipAdvancement) {
        // increment relationship tracking values...
        if (contact && contact.data.data.building) {
            const progress = (contact.data.data.buildingProgress || 0) + 1;
            contact.update({"data.buildingProgress": progress }, null);
            if (progress >= 10 - (contact.data.data.aptitude || 10)) {
                Dialog.confirm({
                    title: "Relationship Building Complete",
                    content: `<p>Relationship with ${contact.name} has been built enough to advance. Do so?</p>`,
                    yes: () => { contact.update({"data.building": false}, null); },
                    no: () => { return; }
                });
            }
        }
        if (sheet.actor.data.type === "character") {
            sheet.actor.addAttributeTest(stat, "Circles", "data.circles", rollData.difficultyGroup, true);
        }
    }

    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

export interface CirclesDialogData extends AttributeDialogData {
    circlesBonus?: {name: string, amount: number}[];
    circlesMalus?: {name: string, amount: number}[];
    circlesContact?: Item;
}