import { Ability, BWActor } from "../actors/BWActor.js";
import {
    AttributeDialogData,
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    rollDice,
    templates,
    extractRollData, EventHandlerOptions, mergeDialogData
} from "./rolls.js";
import { BWCharacterSheet } from "../actors/sheets/BWCharacterSheet.js";

export async function handleShrugRollEvent({ target, sheet, dataPreset}: EventHandlerOptions): Promise<unknown> {
    return handlePtgsRoll({ target, sheet, shrugging: true, dataPreset  });
}
export async function handleGritRollEvent({ target, sheet, dataPreset }: EventHandlerOptions): Promise<unknown> {
    return handlePtgsRoll({ target, sheet, shrugging: false, dataPreset });
}

async function handlePtgsRoll({ sheet, shrugging, dataPreset }: PtgsRollOptions): Promise<unknown> {
    const actor = sheet.actor as BWActor;
    const stat = getProperty(actor.system, "health") as Ability;
    const rollModifiers = sheet.actor.getRollModifiers("health");
    const data: AttributeDialogData = mergeDialogData<AttributeDialogData>({
        name: shrugging ?
            `${game.i18n.localize("BW.ptgs.shrug")} ${game.i18n.localize("BW.health")}` :
            `${game.i18n.localize("BW.ptgs.grit")} ${game.i18n.localize("BW.health")}`,
        difficulty: shrugging ? 2 : 4,
        bonusDice: 0,
        arthaDice: 0,
        stat,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: true,
        showObstacles: true,
        useCustomDifficulty: true
    }, dataPreset) ;

    const buttons: Record<string, DialogButton> = {};
    buttons.roll = {
        label: game.i18n.localize("BW.roll.roll"),
        callback: async (dialogHtml: JQuery) =>
            ptgsRollCallback(dialogHtml, stat, sheet, shrugging)
    };
    const updateData = {};
    const accessor = shrugging ? "data.ptgs.shrugging" : "data.ptgs.gritting";
    updateData[accessor] = true;
    buttons.doIt = {
        label: game.i18n.localize("BW.ptgs.justDoIt"),
        callback: async (_: JQuery) => actor.update(updateData)
    };

    if (!shrugging && actor.system.persona) {
        // we're gritting our teeth and have persona points. give option
        // to spend persona.
        buttons.withPersona = {
            label: game.i18n.localize("BW.ptgs.spendPersona"),
            callback: async (_: JQuery) => {
                updateData["data.persona"] = actor.system.persona - 1;
                updateData["data.health.persona"] = (actor.system.health.persona || 0) + 1;
                return actor.update(updateData);
            }
        };
    }
    if (shrugging && actor.system.fate) {
        // we're shrugging it off and have fate points. give option
        // to spend fate.
        buttons.withFate = {
            label: game.i18n.localize("BW.ptgs.spendFate"),
            callback: async (_: JQuery) => {
                updateData["data.fate"] = actor.system.fate - 1;
                updateData["data.health.fate"] = (actor.system.health.fate || 0) + 1;
                return actor.update(updateData);
            }
        };
    }

    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${data.name} ${game.i18n.localize('BW.test')}`,
            content: html,
            buttons,
            default: "roll"
        }).render(true)
    );
}

async function ptgsRollCallback(
        dialogHtml: JQuery,
        stat: Ability,
        sheet: BWCharacterSheet,
        shrugging: boolean) {
    const { diceTotal, baseDifficulty, difficultyTotal, difficultyGroup, dieSources, obSources, persona, deeds } = extractRollData(dialogHtml);

    const roll = await rollDice(diceTotal, stat.open, stat.shade);
    if (!roll) { return; }

    const fateReroll = buildRerollData({ actor: sheet.actor, roll, accessor: "health" });
    if (fateReroll) { fateReroll.ptgsAction = shrugging? "shrugging" : "gritting"; }
    const callons: RerollData[] = sheet.actor.getCallons("health").map(s => {
        return { label: s, ptgsAction: shrugging ? "shrugging" : "gritting", ...buildRerollData({ actor: sheet.actor, roll, accessor: "health" }) as RerollData };
    });
    const isSuccessful = parseInt(roll.result) >= difficultyTotal;

    const data: RollChatMessageData = {
        name: shrugging ? "Shrug It Off Health" : "Grit Your Teeth Health",
        successes: roll.result,
        difficulty: baseDifficulty,
        nameClass: getRollNameClass(stat.open, stat.shade),
        obstacleTotal: difficultyTotal,
        success: isSuccessful,
        rolls: roll.dice[0].results,
        difficultyGroup,
        dieSources,
        penaltySources: obSources,
        fateReroll,
        callons
    };
    sheet.actor.updateArthaForStat("system.health", persona, deeds);
    if (isSuccessful) {
        const accessor = shrugging ? "system.ptgs.shrugging" : "system.ptgs.gritting";
        const updateData = {};
        updateData[accessor] = true;
        sheet.actor.update(updateData);
    }
    if (sheet.actor.type === "character") {
        sheet.actor.addAttributeTest(stat, "Health", "system.health", difficultyGroup, isSuccessful);
    }
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

export interface PtgsRollOptions extends EventHandlerOptions {
    shrugging: boolean;
}