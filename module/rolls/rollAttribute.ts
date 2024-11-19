import { Ability } from '../actors/BWActor';
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
    RollOptions,
} from './rolls';
import { BWCharacter } from '../actors/BWCharacter';
import { buildHelpDialog } from '../dialogs/buildHelpDialog';
import { maybeLocalize } from '../helpers';

export async function handleAttrRollEvent({
    target,
    sheet,
    dataPreset,
}: EventHandlerOptions): Promise<unknown> {
    const stat = foundry.utils.getProperty(
        sheet.actor,
        target.dataset.accessor || ''
    ) as Ability;
    const actor = sheet.actor;
    let attrName = target.dataset.rollableName || 'Unknown Attribute';
    if (attrName.indexOf('BW.') !== -1) {
        attrName = attrName.slice(3);
    }
    return handleAttrRoll({
        actor,
        stat,
        attrName,
        dataPreset,
        accessor: target.dataset.accessor || '',
    });
}

export async function handleAttrRoll({
    actor,
    stat,
    attrName,
    accessor,
    dataPreset,
}: AttributeRollOptions): Promise<unknown> {
    const rollModifiers = actor.getRollModifiers(attrName);
    dataPreset = dataPreset || {};

    const isSteel = attrName.toLowerCase() === 'steel';
    const woundDice = isSteel ? actor.system.ptgs.woundDice : undefined;
    const obPenalty = isSteel ? actor.system.ptgs.obPenalty : undefined;
    if (isSteel) {
        dataPreset.useCustomDifficulty = true;
        dataPreset.showDifficulty = true;
        dataPreset.showObstacles = true;
        dataPreset.difficulty = actor.system.hesitation || 0;
    }
    const data: AttributeDialogData = mergeDialogData<AttributeDialogData>(
        {
            name: game.i18n.format('BW.xTest', {
                name: maybeLocalize(attrName),
            }),
            difficulty: 3,
            bonusDice: 0,
            arthaDice: 0,
            woundDice,
            obPenalty,
            stat,
            optionalDiceModifiers: rollModifiers.filter(
                (r) => r.optional && r.dice
            ),
            optionalObModifiers: rollModifiers.filter(
                (r) => r.optional && r.obstacle
            ),
            showDifficulty: !game.burningwheel.useGmDifficulty,
            showObstacles: !game.burningwheel.useGmDifficulty || !!obPenalty,
        },
        dataPreset
    );

    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: stat.exp,
            path: accessor,
            actor,
            helpedWith: attrName,
        });
    }

    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise((_resolve) =>
        new Dialog({
            title: data.name,
            content: html,
            buttons: {
                roll: {
                    label: game.i18n.localize('BW.roll.roll'),
                    callback: async (dialogHtml: JQuery) =>
                        attrRollCallback(
                            dialogHtml,
                            stat,
                            actor,
                            attrName,
                            accessor
                        ),
                },
            },
            default: 'roll',
        }).render(true)
    );
}

async function attrRollCallback(
    dialogHtml: JQuery,
    stat: Ability,
    actor: BWCharacter,
    name: string,
    accessor: string
) {
    const rollData = extractRollData(dialogHtml);

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) {
        return;
    }

    const isSuccessful = parseInt(roll.result) >= rollData.difficultyTotal;

    const fateReroll = buildRerollData({ actor, roll, accessor });
    const callons: RerollData[] = actor.getCallons(name).map((s) => {
        return {
            label: s,
            ...(buildRerollData({ actor, roll, accessor }) as RerollData),
        };
    });

    await actor.addAttributeTest(
        stat,
        name,
        accessor,
        rollData.difficultyGroup,
        isSuccessful
    );
    if (rollData.addHelp) {
        game.burningwheel.modifiers.grantTests(
            rollData.difficultyTestTotal,
            isSuccessful
        );
    }

    actor.updateArthaForStat(accessor, rollData.persona, rollData.deeds);

    const data: RollChatMessageData = {
        name,
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
        callons,
    };
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor }),
    });
}

interface AttributeRollOptions extends RollOptions {
    attrName: string;
    actor: BWCharacter;
    stat: Ability;
    accessor: string;
}
