import { Ability, BWActor } from "../actor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import * as helpers from "../helpers.js";
import {
    AttributeDialogData,
    buildDiceSourceObject,
    buildFateRerollData,
    extractBaseData,
    getRollNameClass,
    RollChatMessageData,
    rollDice,
    templates
} from "../rolls.js";

export async function handleShrugRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    return handlePtgsRoll(target, sheet, true);
}
export async function handleGritRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    return handlePtgsRoll(target, sheet, false);
}

async function handlePtgsRoll(target: HTMLButtonElement, sheet: BWActorSheet, shrugging: boolean): Promise<unknown> {
    const actor = sheet.actor as BWActor;
    const stat = getProperty(actor.data, "data.health" || "") as Ability;
    const data: AttributeDialogData = {
        name: shrugging ? "Shrug It Off" : "Grit Your Teeth",
        difficulty: shrugging ? 2 : 4,
        bonusDice: 0,
        arthaDice: 0,
        stat
    };

    const buttons: Record<string, DialogButton> = {};
    buttons.roll = {
        label: "Roll",
        callback: async (dialogHtml: JQuery<HTMLElement>) =>
            ptgsRollCallback(dialogHtml, stat, sheet, shrugging)
    };
    const updateData = {};
    const accessor = shrugging ? "data.ptgs.shrugging" : "data.ptgs.gritting";
    updateData[accessor] = true;
    buttons.doIt = {
        label: "Just do It",
        callback: async (_: JQuery<HTMLElement>) => actor.update(updateData)
    };

    if (!shrugging && parseInt(actor.data.data.persona, 10)) {
        // we're gritting our teeth and have persona points. give option
        // to spend persona.
        buttons.withPersona = {
            label: "Spend Persona",
            callback: async (_: JQuery<HTMLElement>) => {
                updateData["data.persona"] = parseInt(actor.data.data.persona, 10) - 1;
                updateData["data.health.persona"] = (parseInt(actor.data.data.health.persona, 10) || 0) + 1;
                return actor.update(updateData);
            }
        };
    }
    if (shrugging && parseInt(actor.data.data.fate, 10)) {
        // we're shrugging it off and have fate points. give option
        // to spend fate.
        buttons.withFate = {
            label: "Spend Fate",
            callback: async (_: JQuery<HTMLElement>) => {
                updateData["data.fate"] = parseInt(actor.data.data.fate, 10) - 1;
                updateData["data.health.fate"] = (parseInt(actor.data.data.health.fate, 10) || 0) + 1;
                return actor.update(updateData);
            }
        };
    }

    const html = await renderTemplate(templates.attrDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${target.dataset.rollableName} Test`,
            content: html,
            buttons
        }).render(true)
    );
}

async function ptgsRollCallback(
        dialogHtml: JQuery<HTMLElement>,
        stat: Ability,
        sheet: BWActorSheet,
        shrugging: boolean) {
    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = parseInt(stat.exp, 10);
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, 0, 0, 0);
    const dg = helpers.difficultyGroup(exp + baseData.bDice, baseData.diff);
    const numDice = exp + baseData.bDice + baseData.aDice - baseData.woundDice;

    const roll = rollDice(numDice, stat.open, stat.shade);
    if (!roll) { return; }

    const isSuccessful = parseInt(roll.result, 10) >= (baseData.diff);
    const fateReroll = buildFateRerollData(sheet.actor, roll, "data.health");
    if (fateReroll) { fateReroll.ptgsAction = shrugging? "shrugging" : "gritting"; }

    const data: RollChatMessageData = {
        name: shrugging ? "Shrug It Off Health" : "Grit Your Teeth Health",
        successes: roll.result,
        difficulty: baseData.diff,
        nameClass: getRollNameClass(stat.open, stat.shade),
        obstacleTotal: baseData.obstacleTotal -= baseData.obPenalty,
        success: isSuccessful,
        rolls: roll.dice[0].rolls,
        difficultyGroup: dg,
        dieSources,
        fateReroll
    };
    if (isSuccessful) {
        const accessor = shrugging ? "data.ptgs.shrugging" : "data.ptgs.gritting";
        const updateData = {};
        updateData[accessor] = true;
        sheet.actor.update(updateData);
    }
    sheet.actor.addAttributeTest(stat, "Health", "data.health", dg, isSuccessful);
    const messageHtml = await renderTemplate(templates.attrMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}