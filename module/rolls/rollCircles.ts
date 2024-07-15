import { Ability } from '../actors/BWActor';
import * as helpers from '../helpers';
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
} from './rolls';
import { Relationship } from '../items/relationship';
import { BWCharacter } from '../actors/BWCharacter';
import { buildHelpDialog } from '../dialogs/buildHelpDialog';

export async function handleCirclesRollEvent({
    target,
    sheet,
    dataPreset,
}: EventHandlerOptions): Promise<unknown> {
    const stat = foundry.utils.getProperty(
        sheet.actor.system,
        'circles'
    ) as Ability;
    let circlesContact: Relationship | undefined;
    if (target.dataset.relationshipId) {
        circlesContact = sheet.actor.items.get<Relationship>(
            target.dataset.relationshipId
        );
    }
    const actor = sheet.actor;

    return handleCirclesRoll({ actor, dataPreset, circlesContact, stat });
}

export async function handleCirclesRoll({
    actor,
    stat,
    dataPreset,
    circlesContact,
}: CirclesRollOptions): Promise<unknown> {
    if (dataPreset && dataPreset.addHelp) {
        // add a test log instead of testing
        return buildHelpDialog({
            exponent: stat.exp,
            path: 'data.circles',
            actor,
            helpedWith: 'Circles',
        });
    }

    const rollModifiers = actor.getRollModifiers('circles');
    const data: CirclesDialogData = mergeDialogData<CirclesDialogData>(
        {
            name: game.i18n.format('BW.xTest', {
                name: game.i18n.localize('BW.circles'),
            }),
            difficulty: 3,
            bonusDice: 0,
            arthaDice: 0,
            obPenalty: actor.system.ptgs.obPenalty,
            stat,
            circlesBonus: actor.circlesBonus,
            circlesMalus: actor.circlesMalus,
            circlesContact,
            optionalDiceModifiers: rollModifiers.filter(
                (r) => r.optional && r.dice
            ),
            optionalObModifiers: rollModifiers.filter(
                (r) => r.optional && r.obstacle
            ),
            showDifficulty: !game.burningwheel.useGmDifficulty,
            showObstacles: !game.burningwheel.useGmDifficulty,
        },
        dataPreset
    );

    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise((_resolve) =>
        new Dialog({
            title: data.name,
            content: html,
            buttons: {
                roll: {
                    label: game.i18n.localize('BW.roll.roll'),
                    callback: async (dialogHtml: JQuery) =>
                        circlesRollCallback(
                            dialogHtml,
                            stat,
                            actor,
                            circlesContact
                        ),
                },
            },
            default: 'roll',
        }).render(true)
    );
}

async function circlesRollCallback(
    dialogHtml: JQuery,
    stat: Ability,
    actor: BWCharacter,
    contact?: Relationship
) {
    const rollData = extractRollData(dialogHtml);

    if (contact) {
        rollData.dieSources['Named Contact'] = '+1';
        rollData.diceTotal++;
        rollData.difficultyDice++;
        rollData.difficultyGroup = helpers.difficultyGroup(
            rollData.difficultyDice,
            rollData.difficultyTestTotal
        );
    }

    const roll = await rollDice(rollData.diceTotal, stat.open, stat.shade);
    if (!roll) {
        return;
    }

    const fateReroll = buildRerollData({
        actor,
        roll,
        accessor: 'system.circles',
    });
    const callons: RerollData[] = actor.getCallons('circles').map((s) => {
        return {
            label: s,
            ...(buildRerollData({
                actor,
                roll,
                accessor: 'system.circles',
            }) as RerollData),
        };
    });

    await actor.addAttributeTest(
        stat,
        'Circles',
        'system.circles',
        rollData.difficultyGroup,
        true
    );
    if (rollData.addHelp) {
        game.burningwheel.modifiers.grantTests(
            rollData.difficultyTestTotal,
            parseInt(roll.result) >= rollData.difficultyTotal
        );
    }

    actor.updateArthaForStat(
        'system.circles',
        rollData.persona,
        rollData.deeds
    );

    const data: RollChatMessageData = {
        name: game.i18n.format('BW.xTest', {
            name: game.i18n.localize('BW.circles'),
        }),
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
        callons,
    };
    const messageHtml = await renderTemplate(templates.pcRollMessage, data);

    // increment relationship tracking values...
    if (contact && contact.system.building) {
        const progress = (contact.system.buildingProgress || 0) + 1;
        contact.update({ 'data.buildingProgress': progress });
        if (progress >= 10 - (contact.system.aptitude || 10)) {
            Dialog.confirm({
                title: 'Relationship Building Complete',
                content: `<p>Relationship with ${contact.name} has been built enough to advance. Do so?</p>`,
                // TODO review data vs. system here.
                yes: () => {
                    contact.update({ 'system.building': false });
                },
                no: () => {
                    return;
                },
            });
        }
    }

    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor }),
    });
}

export interface CirclesDialogData extends AttributeDialogData {
    circlesBonus?: { name: string; amount: number }[];
    circlesMalus?: { name: string; amount: number }[];
    circlesContact?: Item;
}

export interface CirclesRollOptions {
    actor: BWCharacter;
    stat: Ability;
    circlesContact?: Relationship;
    dataPreset?: Partial<CirclesDialogData>;
}
