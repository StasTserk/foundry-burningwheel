import '../styles/burningwheel.scss';

import { BWActor } from './actors/BWActor';
import { BWCharacterSheet } from './actors/sheets/BWCharacterSheet';
import { BWCharacterTabbedSheet } from './actors/sheets/BWCharacterTabbedSheet';

import { BWItem, RegisterItemSheets } from './items/item';

import { hideChatButtonsIfNotOwner, onChatLogRender } from './chat';
import { DragData, ShadeString, slugify, translateWoundValue } from './helpers';
import { migrateData } from './migration/migration';
import { registerSystemSettings } from './settings';
import { preloadHandlebarsTemplates } from './templates';
import { NpcSheet } from './actors/sheets/NpcSheet';

import { actorConstructor, itemConstructor } from './factory';

import * as constants from './constants';
import { CreateBurningWheelMacro, RegisterMacros } from './macros/Macro';
import { BWSettingSheet } from './actors/sheets/BWSettingSheet';
import * as dialogs from './dialogs/index';
import { TypeMissing } from '../types/index';

import { BWRoll } from '../module/rolls/customRolls';

CONFIG.Dice.rolls = [BWRoll];

Hooks.once('init', async () => {
    CONFIG.Actor.documentClass = actorConstructor;
    CONFIG.Item.documentClass = itemConstructor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    game.burningwheel = {} as any;

    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet(constants.systemName, BWCharacterSheet, {
        types: ['character'],
        makeDefault: true,
        label: 'BW.sheet.character',
    });
    Actors.registerSheet(constants.systemName, BWCharacterTabbedSheet, {
        label: 'BW.sheet.characterTabbed',
        types: ['character'],
        makeDefault: false,
    });
    Actors.registerSheet(constants.systemName, NpcSheet, {
        types: ['npc'],
        makeDefault: true,
        label: 'BW.sheet.npc',
    });
    Actors.registerSheet(constants.systemName, BWSettingSheet, {
        types: ['setting'],
        makeDefault: true,
        label: 'BW.sheet.setting',
    });

    game.burningwheel.duelOfWitsActions = constants.DuelOfWitsActions;
    game.burningwheel.fightActions = constants.FightActions;
    game.burningwheel.rangeAndCoverActions = constants.RangeAndCoverActions;

    RegisterItemSheets();
    registerSystemSettings();
    preloadHandlebarsTemplates();
    registerHelpers();
});

Hooks.once('ready', async () => {
    await migrateData();
    await dialogs.initializeRollPanels();
    await dialogs.initializeExtendedTestDialogs();
    RegisterMacros();
});

function registerHelpers() {
    Handlebars.registerHelper('multiboxes', function (selected, options) {
        let html = options.fn(this);
        let testsAllowed = -1;
        if (options.hash.exp) {
            testsAllowed = 11 - parseInt(options.hash.exp, 10);
        } else if (
            Object.prototype.hasOwnProperty.call(options.hash, 'needed')
        ) {
            testsAllowed = parseInt(options.hash.needed, 10) + 1;
        }

        if (testsAllowed !== -1) {
            const rgx = new RegExp(' value="' + testsAllowed + '"');
            html = html.replace(rgx, '$& disabled="disabled"');
        }
        if (!(selected instanceof Array)) {
            if (Number.isNaN(selected)) {
                selected = [0];
            } else {
                selected = [selected];
            }
        }
        selected.forEach((selectedValue: string) => {
            const escapedValue = Handlebars.escapeExpression(selectedValue);
            const rgx = new RegExp(' value="' + escapedValue + '"');
            html = html.replace(rgx, '$& checked="checked"');
        });
        return html;
    });

    Handlebars.registerHelper(
        'itemProgressTicks',
        (
            id: string,
            value: string,
            path: string,
            idLabel: string,
            numActive: number,
            numInactive: number
        ) => {
            const progressHtml: string[] = [];
            progressHtml.push(`<div class="test-tracking">`);
            progressHtml.push(
                `<input type="radio" data-item-id="${id}" value="0" id="${id}-${idLabel}-0" data-binding="${path}" ${
                    Number.isNaN(parseInt(value)) || value.toString() === '0'
                        ? 'checked'
                        : ''
                }>`
            );
            progressHtml.push(
                `<label for="${id}-${idLabel}-0" class="progress-clear"><i class="fas fa-times-circle"></i></label>`
            );

            for (let i = 1; i <= numActive + numInactive; i++) {
                progressHtml.push(
                    `<input type="radio" data-item-id="${id}" value="${i}" id="${id}-${idLabel}-${i}" data-binding="${path}"${
                        value.toString() === i.toString() ? ' checked' : ''
                    }${i > numActive ? ' disabled' : ''}>`
                );
                progressHtml.push(
                    `<label for="${id}-${idLabel}-${i}" class="progress-tick"></label>`
                );
            }
            progressHtml.push('</div>');
            return progressHtml.join('\n');
        }
    );

    Handlebars.registerHelper('disabled', (value: boolean) => {
        if (value) {
            return ' disabled ';
        }
        return '';
    });

    Handlebars.registerHelper('titlecase', (value: string) => {
        if (value) {
            return value.toString().titleCase();
        }
        return '';
    });

    Handlebars.registerHelper('plusone', (value: string | number) => {
        return parseInt(value.toString()) + 1;
    });

    Handlebars.registerHelper('conc', (...values: TypeMissing[]) => {
        if (values) {
            return values.slice(0, -1).join('').toString();
        }
        return '';
    });

    Handlebars.registerHelper('slugify', (value: string) => {
        return slugify(value.toLowerCase());
    });

    Handlebars.registerHelper('add', (...args): number => {
        return (
            Array.prototype.slice.call(args, 0, -1) as (string | number)[]
        ).reduce<number>((acc: number, val) => {
            if (typeof val === 'number') {
                return (acc + val) as number;
            }
            return acc + parseInt(val as string);
        }, 0);
    });

    Handlebars.registerHelper('maybeLocalize', (value: string) => {
        if (game.i18n.translations.BW[value]) {
            return game.i18n.translations.BW[value];
        }
        return game.i18n.localize(value);
    });

    Handlebars.registerHelper('sub', (a: string, b: string): number => {
        return parseInt(a) - parseInt(b);
    });

    Handlebars.registerHelper(
        'clampWound',
        (shade: ShadeString, value: string | number): string => {
            return translateWoundValue(shade, value);
        }
    );

    Handlebars.registerHelper(
        'selectGroups',
        (selected: string, options: TypeMissing): string => {
            const escapedValue = RegExp.escape(
                Handlebars.escapeExpression(selected)
            );
            const rgx = new RegExp(` value=["']${escapedValue}["']`);
            const html = options.fn(this);
            return html.replace(rgx, '$& selected');
        }
    );
}

Hooks.on('renderChatLog', (_app, html: HTMLElement, _data) =>
    onChatLogRender(html)
);
Hooks.on('renderChatMessage', (app, html, data) =>
    hideChatButtonsIfNotOwner(app, html, data)
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Hooks.on('createItem', (item: BWItem, _options: any, userId: string) => {
    if (item.parent && (item.parent as TypeMissing).type !== 'setting') {
        (item.parent as BWActor).processNewItem(item.system, item.type, userId);
    }
});
Hooks.on('hotbarDrop', (_bar, data, slot) =>
    CreateBurningWheelMacro(data as DragData, slot)
);
