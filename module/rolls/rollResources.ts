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
    extractRollData,
    EventHandlerOptions
} from "./rolls.js";

export async function handleResourcesRollEvent({ sheet }: EventHandlerOptions): Promise<unknown> {
    const stat = sheet.actor.data.data.resources;
    const actor = sheet.actor as BWActor;
    const rollModifiers = sheet.actor.getRollModifiers("resources");
    const data: ResourcesDialogData = {
        name: "Resources Test",
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        tax: parseInt(actor.data.data.resourcesTax, 10),
        stat,
        cashDieOptions: Array.from(Array(parseInt(actor.data.data.cash, 10) || 0).keys()),
        fundDieOptions: Array.from(Array(parseInt(actor.data.data.funds, 10) || 0).keys()),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    };

    const html = await renderTemplate(templates.resourcesDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `Resources Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        resourcesRollCallback(dialogHtml, stat, sheet)
                }
            }
        }).render(true)
    );
}

async function resourcesRollCallback(
        dialogHtml: JQuery,
        stat: Ability,
        sheet: BWActorSheet) {
    const rollData = extractRollData(dialogHtml);

    if (rollData.cashDice) {
        const currentCash = parseInt(sheet.actor.data.data.cash) || 0;
        sheet.actor.update({"data.cash": currentCash - rollData.cashDice});
    }

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) { return; }

    const fateReroll = buildRerollData({ actor: sheet.actor, roll, accessor: "data.resources" });
    const isSuccess = parseInt(roll.result) >= rollData.difficultyTotal;
    const callons: RerollData[] = sheet.actor.getCallons("resources").map(s => {
        return { label: s, ...buildRerollData({ actor: sheet.actor, roll, accessor: "data.resources" }) as RerollData };
    });

    const data: RollChatMessageData = {
        name: 'Resources',
        successes: roll.result,
        difficulty: rollData.baseDifficulty,
        obstacleTotal: rollData.difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccess,
        rolls: roll.dice[0].results,
        difficultyGroup: rollData.difficultyGroup,
        dieSources: rollData.dieSources,
        penaltySources: rollData.obSources,
        fateReroll,
        callons
    };
    const messageHtml = await renderTemplate(templates.resourcesMessage, data);
    if (sheet.actor.data.type === "character") {
        if (!isSuccess) {
            const taxAmount = rollData.difficultyGroup === "Challenging" ? (rollData.difficultyTotal - parseInt(roll.result)) :
                (rollData.difficultyGroup === "Difficult" ? 2 : 1);
            const taxMessage = new Dialog({
                title: "Failed Resource Roll!",
                content: `<p>You have failed a ${rollData.difficultyGroup} Resource test.</p><p>How do you wish to be taxed?</p><hr/>`,
                buttons: {
                    full: {
                        label: `Full Tax (${taxAmount} tax)`,
                        callback: () => (sheet.actor as BWActor &  BWCharacter).taxResources(taxAmount, rollData.fundDice)
                    },
                    cut: {
                        label: "Cut your losses. (1 tax)",
                        callback: () => (sheet.actor as BWActor &  BWCharacter).taxResources(1, rollData.fundDice)
                    },
                    skip: {
                        label: "Skip for now"
                    }
                }
            });
            taxMessage.render(true);
        }
        (sheet.actor as BWActor & BWCharacter).addAttributeTest(stat, "Resources", "data.resources", rollData.difficultyGroup, isSuccess);
    }

    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

export interface ResourcesDialogData extends AttributeDialogData {
    cashDieOptions: number[];
    fundDieOptions: number[];
}