import { Ability } from "../actors/BWActor.js";
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
    mergeDialogData,
    RollOptions
} from "./rolls.js";
import { BWCharacter } from "../actors/BWCharacter.js";
import { buildHelpDialog } from "../dialogs/buildHelpDialog.js";

export async function handleResourcesRollEvent({ sheet, dataPreset }: EventHandlerOptions): Promise<unknown> {
    const stat = sheet.actor.system.resources;
    const actor = sheet.actor;
    return handleResourcesRoll({ actor, stat, dataPreset });
}

export async function handleResourcesRoll({actor, stat, dataPreset}: ResourcesRollOption): Promise<unknown> {
    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: stat.exp,
            path: "resources",
            actor,
            helpedWith: game.i18n.localize("BW.resources")
        });
    }
    const rollModifiers = actor.getRollModifiers("resources");
    const data: ResourcesDialogData = mergeDialogData<ResourcesDialogData>({
        name: game.i18n.format('BW.xTest', { name: game.i18n.localize("BW.resources")}),
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        tax: parseInt(actor.system.resourcesTax.toString()),
        stat,
        cashDieOptions: Array.from(Array(actor.system.cash || 0).keys()),
        fundDieOptions: Array.from(Array(actor.system.funds || 0).keys()),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty
    }, dataPreset);

    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: data.name,
            content: html,
            buttons: {
                roll: {
                    label: game.i18n.localize("BW.roll.roll"),
                    callback: async (dialogHtml: JQuery) =>
                        resourcesRollCallback(dialogHtml, stat, actor)
                }
            },
            default: "roll"
        }).render(true)
    );
}

async function resourcesRollCallback(
        dialogHtml: JQuery,
        stat: Ability,
        actor: BWCharacter) {
    const rollData = extractRollData(dialogHtml);

    if (rollData.cashDice) {
        const currentCash = actor.system.cash || 0;
        actor.update({"data.cash": currentCash - rollData.cashDice});
    }

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) { return; }

    const fateReroll = buildRerollData({ actor, roll, accessor: "resources" });
    const isSuccess = parseInt(roll.result) >= rollData.difficultyTotal;
    const callons: RerollData[] = actor.getCallons("resources").map(s => {
        return { label: s, ...buildRerollData({ actor, roll, accessor: "resources" }) as RerollData };
    });

    actor.updateArthaForStat("resources", rollData.persona, rollData.deeds);
    if (!isSuccess) {
        const taxAmount = rollData.difficultyGroup === "Challenging" ? (rollData.difficultyTotal - parseInt(roll.result)) :
            (rollData.difficultyGroup === "Difficult" ? 2 : 1);
        const taxMessage = new Dialog({
            title: game.i18n.localize('BW.dialog.failResources'),
            content: `<p>${game.i18n.localize('BW.dialog.failResourcesText1')
                    .replace("{diff}", rollData.difficultyGroup)
                }</p><p>${game.i18n.localize('BW.dialog.failResourcesText2')}</p><hr/>`,
            buttons: {
                full: {
                    label: `${game.i18n.localize('BW.dialog.fullTax').replace("{amt}", taxAmount.toString())}`,
                    callback: () => actor.taxResources(taxAmount, rollData.fundDice)
                },
                cut: {
                    label: game.i18n.localize('BW.dialog.cutLosses'),
                    callback: () => actor.taxResources(1, rollData.fundDice)
                },
                skip: {
                    label: game.i18n.localize('BW.dialog.skipTax')
                }
            },
            default: "full"
        });
        taxMessage.render(true);
    }
    await actor.addAttributeTest(stat, game.i18n.localize("BW.resources"), "resources", rollData.difficultyGroup, isSuccess);

    if (rollData.addHelp) {
        game.burningwheel.modifiers.grantTests(rollData.difficultyTestTotal, isSuccess);
    }

    const data: RollChatMessageData = {
        name: game.i18n.format('BW.xTest', { name: game.i18n.localize("BW.resources")}),
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
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);

    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor})
    });
}

export interface ResourcesDialogData extends AttributeDialogData {
    cashDieOptions: number[];
    fundDieOptions: number[];
}

export interface ResourcesRollOption extends RollOptions {
    dataPreset?: Partial<ResourcesDialogData>;
    actor: BWCharacter;
    stat: Ability;
}