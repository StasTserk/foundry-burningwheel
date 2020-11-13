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
    extractRollData, EventHandlerOptions, mergeDialogData
} from "./rolls.js";

export async function handleShrugRollEvent({ target, sheet, dataPreset}: EventHandlerOptions): Promise<unknown> {
    return handlePtgsRoll({ target, sheet, shrugging: true, dataPreset  });
}
export async function handleGritRollEvent({ target, sheet, dataPreset }: EventHandlerOptions): Promise<unknown> {
    return handlePtgsRoll({ target, sheet, shrugging: false, dataPreset });
}

async function handlePtgsRoll({ sheet, shrugging, dataPreset }: PtgsRollOptions): Promise<unknown> {
    const actor = sheet.actor as BWActor;
    const stat = getProperty(actor.data, "data.health") as Ability;
    const rollModifiers = sheet.actor.getRollModifiers("health");
    const data: AttributeDialogData = mergeDialogData<AttributeDialogData>({
        name: shrugging ? "Shrug It Off Health" : "Grit Your Teeth Health",
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
        label: "Roll",
        callback: async (dialogHtml: JQuery) =>
            ptgsRollCallback(dialogHtml, stat, sheet, shrugging)
    };
    const updateData = {};
    const accessor = shrugging ? "data.ptgs.shrugging" : "data.ptgs.gritting";
    updateData[accessor] = true;
    buttons.doIt = {
        label: "Just do It",
        callback: async (_: JQuery) => actor.update(updateData)
    };

    if (!shrugging && parseInt(actor.data.data.persona, 10)) {
        // we're gritting our teeth and have persona points. give option
        // to spend persona.
        buttons.withPersona = {
            label: "Spend Persona",
            callback: async (_: JQuery) => {
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
            callback: async (_: JQuery) => {
                updateData["data.fate"] = parseInt(actor.data.data.fate, 10) - 1;
                updateData["data.health.fate"] = (parseInt(actor.data.data.health.fate, 10) || 0) + 1;
                return actor.update(updateData);
            }
        };
    }

    const html = await renderTemplate(templates.attrDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${data.name} Test`,
            content: html,
            buttons
        }).render(true)
    );
}

async function ptgsRollCallback(
        dialogHtml: JQuery,
        stat: Ability,
        sheet: BWActorSheet,
        shrugging: boolean) {
    const { diceTotal, baseDifficulty, difficultyTotal, difficultyGroup, dieSources, obSources, skipAdvancement } = extractRollData(dialogHtml);

    const roll = await rollDice(diceTotal, stat.open, stat.shade);
    if (!roll) { return; }

    const fateReroll = buildRerollData({ actor: sheet.actor, roll, accessor: "data.health" });
    if (fateReroll) { fateReroll.ptgsAction = shrugging? "shrugging" : "gritting"; }
    const callons: RerollData[] = sheet.actor.getCallons("health").map(s => {
        return { label: s, ptgsAction: shrugging ? "shrugging" : "gritting", ...buildRerollData({ actor: sheet.actor, roll, accessor: "data.health" }) as RerollData };
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
    if (isSuccessful) {
        const accessor = shrugging ? "data.ptgs.shrugging" : "data.ptgs.gritting";
        const updateData = {};
        updateData[accessor] = true;
        sheet.actor.update(updateData);
    }
    if (sheet.actor.data.type === "character" && !skipAdvancement) {
        (sheet.actor as BWActor & BWCharacter).addAttributeTest(stat, "Health", "data.health", difficultyGroup, isSuccessful);
    }
    const messageHtml = await renderTemplate(templates.attrMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

export interface PtgsRollOptions extends EventHandlerOptions {
    shrugging: boolean;
}