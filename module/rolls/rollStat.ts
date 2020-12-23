import { BWCharacter } from "../actors/BWCharacter.js";
import { Ability, TracksTests } from "../actors/BWActor.js";
import {
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    RollOptions,
    extractRollData, EventHandlerOptions, mergeDialogData, getSplitPoolText, getSplitPoolRoll
} from "./rolls.js";
import { buildHelpDialog } from "../dialogs/buildHelpDialog.js";

export async function handleStatRollEvent(options: EventHandlerOptions): Promise<unknown> {
    const accessor = options.target.dataset.accessor || "";
    const stat = getProperty(options.sheet.actor.data, accessor) as Ability;
    const actor = options.sheet.actor;
    const statName = options.target.dataset.rollableName || "Unknown Stat";
    return handleStatRoll({ actor, statName, stat, accessor, ...options });
}

export async function handleStatRoll({ actor, statName, stat, accessor, dataPreset }: StatRollOptions): Promise<unknown> {
    const rollModifiers = actor.getRollModifiers(statName);

    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: stat.exp,
            path: accessor,
            actor,
            helpedWith: statName
        });
    }

    let tax = 0;
    if (statName.toLowerCase() === "will") {
        tax = actor.data.data.willTax;
    } else if (statName.toLowerCase() === "forte") {
        tax = actor.data.data.forteTax;
    }

    const data = mergeDialogData<StatDialogData>({
        name: `${statName} Test`,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        stat,
        tax,
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle),
        showDifficulty: !game.burningwheel.useGmDifficulty,
        showObstacles: !game.burningwheel.useGmDifficulty || !!actor.data.data.ptgs.obPenalty
    }, dataPreset);

    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise(_resolve =>
        new Dialog({
            title: `${statName} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        statRollCallback(dialogHtml, stat, actor, statName, accessor)
                }
            }
        }).render(true)
    );
}

async function statRollCallback(
        dialogHtml: JQuery,
        stat: Ability,
        actor: BWCharacter,
        name: string,
        accessor: string) {
    const { diceTotal, difficultyGroup, baseDifficulty, difficultyTotal, obSources, dieSources, splitPool, persona, deeds, addHelp, difficultyTestTotal } = extractRollData(dialogHtml);

    const roll = await rollDice(diceTotal,
        stat.open,
        stat.shade);
    if (!roll) { return; }
    const isSuccessful = parseInt(roll.result) >= difficultyTotal;

    let extraInfo: string | undefined;
    let splitPoolRoll: Roll | undefined;
    if (splitPool) {
        splitPoolRoll = await getSplitPoolRoll(splitPool, stat.open, stat.shade);
        extraInfo = getSplitPoolText(splitPoolRoll);
    }

    const fateReroll = buildRerollData({ actor, roll, accessor, splitPoolRoll });
    const callons: RerollData[] = actor.getCallons(name).map(s => {
        return { label: s, ...buildRerollData({ actor, roll, accessor, splitPoolRoll }) as RerollData };
    });

    await actor.addStatTest(stat, name, accessor, difficultyGroup, isSuccessful);
    if (addHelp) {
        game.burningwheel.modifiers.grantTests(difficultyTestTotal, isSuccessful);
    }

    actor.updateArthaForStat(accessor, persona, deeds);

    const data: RollChatMessageData = {
        name: `${name}`,
        successes: roll.result,
        splitSuccesses: splitPoolRoll ? splitPoolRoll.result : undefined,
        difficulty: baseDifficulty,
        obstacleTotal: difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccessful,
        rolls: roll.dice[0].results,
        difficultyGroup,
        penaltySources: obSources,
        dieSources,
        fateReroll,
        callons,
        extraInfo
    };

    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor })
    });
}

interface StatDialogData extends RollDialogData {
    tax?: number;
    stat: TracksTests;
}

export interface StatRollOptions extends RollOptions {
    actor: BWCharacter;
    statName: string;
    stat: Ability;
    accessor: string;
}