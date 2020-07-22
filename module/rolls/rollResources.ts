import { Ability, BWActor } from "module/actor.js";
import { BWActorSheet } from "module/bwactor-sheet.js";
import * as helpers from "../helpers.js";
import {
    AttributeDialogData,
    buildDiceSourceObject,
    buildFateRerollData,
    extractBaseData,
    extractSelectNumber,
    getRollNameClass,
    RollChatMessageData,
    rollDice,
    templates,
} from "../rolls.js";

export async function handleResourcesRoll(_target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const stat = sheet.actor.data.data.resources;
    const actor = sheet.actor as BWActor;
    const data: ResourcesDialogData = {
        name: "Resources Test",
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        tax: parseInt(actor.data.data.resourcesTax, 10),
        stat,
        cashDieOptions: Array.from(Array(parseInt(actor.data.data.cash, 10) || 0).keys()),
        fundDieOptions: Array.from(Array(parseInt(actor.data.data.funds, 10) || 0).keys())
    };

    const html = await renderTemplate(templates.resourcesDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `Resources Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery<HTMLElement>) =>
                        resourcesRollCallback(dialogHtml, stat, sheet)
                }
            }
        }).render(true)
    );
}

async function resourcesRollCallback(
        dialogHtml: JQuery<HTMLElement>,
        stat: Ability,
        sheet: BWActorSheet) {
    const baseData = extractBaseData(dialogHtml, sheet);
    const cash = extractSelectNumber(dialogHtml, "cashDice");
    const funds = extractSelectNumber(dialogHtml, "fundDice");
    const tax = parseInt(sheet.actor.data.data.resourcesTax, 10) || 0;
    const exp = parseInt(stat.exp, 10);
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, 0, tax);

    if (cash) {
        dieSources["Cash Dice"] = `+${cash}`;
        const currentCash = parseInt(sheet.actor.data.data.cash, 10) || 0;
        sheet.actor.update({"data.cash": currentCash - cash});
    }
    if (funds) {
        dieSources["Fund Dice"] = `+${funds}`;
    }
    const dg = helpers.difficultyGroup(
        exp + baseData.bDice + cash + funds - tax,
        baseData.diff + baseData.obPenalty);

    const roll = rollDice(exp + baseData.bDice + baseData.aDice + cash + funds - tax, stat.open, stat.shade);
    if (!roll) { return; }
    const fateReroll = buildFateRerollData(sheet.actor, roll, "data.resources");
    const isSuccess = parseInt(roll.result, 10) >= baseData.obstacleTotal;

    const data: RollChatMessageData = {
        name: 'Resources',
        successes: roll.result,
        difficulty: baseData.diff,
        obstacleTotal: baseData.obstacleTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccess,
        rolls: roll.dice[0].rolls,
        difficultyGroup: dg,
        dieSources,
        penaltySources: baseData.penaltySources,
        fateReroll
    };
    const messageHtml = await renderTemplate(templates.resourcesMessage, data);

    if (!isSuccess) {
        const taxAmount = dg === "Challenging" ? (baseData.obstacleTotal - parseInt(roll.result, 10)) :
            (dg === "Difficult" ? 2 : 1);
        const taxMessage = new Dialog({
            title: "Failed Resource Roll!",
            content: `<p>You have failed a ${dg} Resource test.</p><p>How do you wish to be taxed?</p><hr/>`,
            buttons: {
                full: {
                    label: `Full Tax (${taxAmount} tax)`,
                    callback: () => sheet.actor.taxResources(taxAmount, funds)
                },
                cut: {
                    label: "Cut your losses. (1 tax)",
                    callback: () => sheet.actor.taxResources(1, funds)
                },
                skip: {
                    label: "Skip for now"
                }
            }
        });
        taxMessage.render(true);
    }

    sheet.actor.addAttributeTest(stat, "Resources", "data.resources", dg, isSuccess);

    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

export interface ResourcesDialogData extends AttributeDialogData {
    cashDieOptions: number[];
    fundDieOptions: number[];
}