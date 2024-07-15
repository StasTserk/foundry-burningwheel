import { Ability, TracksTests } from '../actors/BWActor';
import * as helpers from '../helpers';
import {
    buildRerollData,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    extractRollData,
    mergeDialogData,
} from './rolls';
import { BWCharacterSheet } from '../actors/sheets/BWCharacterSheet';
import { BWCharacter } from '../actors/BWCharacter';
import { translateWoundValue } from '../helpers';

export async function handleSpellTaxRoll(
    target: HTMLButtonElement,
    sheet: BWCharacterSheet,
    dataPreset: Partial<RollDialogData>
): Promise<unknown> {
    const obstacle = parseInt(target.dataset.obstacle || '0');
    const spellName = target.dataset.rollableName || 'Unknown Spell';

    if (!obstacle && !spellName) {
        return helpers.notifyError(
            game.i18n.localize('BW.dialog.missingSpell'),
            game.i18n.localize('BW.dialog.missingSpellTax')
        );
    } else
        return showSpellTaxDialog(obstacle, spellName, sheet.actor, dataPreset);
}

export async function showSpellTaxDialog(
    obstacle: number,
    spellName: string,
    actor: BWCharacter,
    dataPreset: Partial<RollDialogData>
): Promise<unknown> {
    const stat = foundry.utils.getProperty(actor.system, 'forte') as Ability;

    const rollModifiers = actor.getRollModifiers('forte');
    const tax = actor.system.forteTax;

    const data: StatDialogData = mergeDialogData<StatDialogData>(
        {
            name: game.i18n.format('BW.spell.taxTest', { name: spellName }),
            difficulty: obstacle,
            bonusDice: 0,
            arthaDice: 0,
            woundDice: actor.system.ptgs.woundDice,
            obPenalty: actor.system.ptgs.obPenalty,
            stat,
            tax,
            optionalDiceModifiers: rollModifiers.filter(
                (r) => r.optional && r.dice
            ),
            optionalObModifiers: rollModifiers.filter(
                (r) => r.optional && r.obstacle
            ),
            showDifficulty: true,
            showObstacles: true,
            useCustomDifficulty: true,
        },
        dataPreset
    );

    const html = await renderTemplate(templates.pcRollDialog, data);
    return new Promise((_resolve) =>
        new Dialog({
            title: game.i18n.format('BW.spell.taxTest', { name: spellName }),
            content: html,
            buttons: {
                roll: {
                    label: game.i18n.localize('BW.roll.roll'),
                    callback: async (dialogHtml: JQuery) =>
                        taxTestCallback(
                            dialogHtml,
                            stat,
                            actor,
                            tax,
                            spellName
                        ),
                },
            },
            default: 'roll',
        }).render(true)
    );
}

async function taxTestCallback(
    dialogHtml: JQuery,
    stat: Ability,
    actor: BWCharacter,
    tax: number,
    spellName: string
) {
    const {
        diceTotal,
        difficultyTotal,
        difficultyGroup,
        baseDifficulty,
        obSources,
        dieSources,
        persona,
        deeds,
    } = extractRollData(dialogHtml);

    const roll = await rollDice(diceTotal, stat.open, stat.shade);
    if (!roll) {
        return;
    }
    const isSuccessful = parseInt(roll.result) >= difficultyTotal;

    const fateReroll = buildRerollData({ actor, roll, accessor: 'forte' });
    const callons: RerollData[] = actor.getCallons('forte').map((s) => {
        return {
            label: s,
            ...(buildRerollData({
                actor,
                roll,
                accessor: 'forte',
            }) as RerollData),
        };
    });

    actor.updateArthaForStat('system.forte', persona, deeds);

    const data: RollChatMessageData = {
        name: game.i18n.format('BW.spell.taxTest', { name: spellName }),
        successes: roll.result,
        difficulty: baseDifficulty,
        obstacleTotal: difficultyTotal,
        nameClass: getRollNameClass(stat.open, stat.shade),
        success: isSuccessful,
        rolls: roll.dice[0].results,
        difficultyGroup: difficultyGroup,
        penaltySources: obSources,
        dieSources,
        fateReroll,
        callons,
    };
    data.extraInfo = game.i18n
        .localize('BW.dialog.spellSustain')
        .replace('{name}', spellName);
    if (actor.type === 'character') {
        actor.addStatTest(
            stat,
            'Forte',
            'forte',
            difficultyGroup,
            isSuccessful
        );
    }

    if (!isSuccessful) {
        const margin = difficultyTotal - parseInt(roll.result);
        const forteExp = stat.exp;
        if (forteExp < margin + tax) {
            // overtax.
            const baseWound = (margin + tax - forteExp) * difficultyTotal;
            data.extraInfo += ` ${game.i18n
                .localize('BW.dialog.spellTaxWoundInfo')
                .replace('{margin}', margin.toString())
                .replace('{wnd}', translateWoundValue('B', baseWound))}`;
            new Dialog({
                title: game.i18n.localize('BW.dialog.spellTaxWound'),
                content: `<p>
                        ${game.i18n
                            .localize('BW.dialog.spellTaxWoundText1')
                            .replace('{margin}', margin.toString())
                            .replace('{dice}', (forteExp - tax).toString())}</p>
                    <p>
                        ${game.i18n
                            .localize('BW.dialog.spellTaxWoundText2')
                            .replace(
                                '{wnd}',
                                translateWoundValue('B', baseWound)
                            )}</p>`,
                buttons: {
                    yes: {
                        label: game.i18n.localize('BW.dialog.ouch'),
                        callback: () => {
                            actor.update({ data: { forteTax: forteExp } });
                        },
                    },
                    no: {
                        label: game.i18n.localize('BW.dialog.idRatherNot'),
                        callback: () => {
                            return;
                        },
                    },
                },
                default: 'yes',
            }).render(true);
        } else {
            data.extraInfo += ` ${game.i18n
                .localize('BW.dialog.spellTaxInfo')
                .replace('{margin}', margin.toString())}`;
            new Dialog({
                title: game.i18n.localize('BW.dialog.spellTax'),
                content: `<p>
                    ${game.i18n
                        .localize('BW.dialog.spellTaxText1')
                        .replace('{margin}', margin.toString())
                        .replace('{dice}', (forteExp - tax).toString())}</p>
                <p>
                    ${game.i18n.localize('BW.dialog.spellTaxText2')}</p>`,
                buttons: {
                    yes: {
                        label: 'Ok',
                        callback: () => {
                            actor.update({ data: { forteTax: tax + margin } });
                        },
                    },
                    no: {
                        label: game.i18n.localize('BW.dialog.skipTax'),
                        callback: () => {
                            return;
                        },
                    },
                },
                default: 'yes',
            }).render(true);
        }
    }

    const messageHtml = await renderTemplate(templates.pcRollMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
    });
}

interface StatDialogData extends RollDialogData {
    tax?: number;
    stat: TracksTests;
}
