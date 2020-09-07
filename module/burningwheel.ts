import { BWActor } from "./bwactor.js";
import { BWCharacterSheet } from "./character-sheet.js";
import {
    BWItem,
    RegisterItemSheets
} from "./items/item.js";

import { hideChatButtonsIfNotOwner, onChatLogRender } from "./chat.js";
import { slugify } from "./helpers.js";
import { migrateData } from "./migration.js";
import { registerSystemSettings } from "./settings.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { NpcSheet } from "./npc-sheet.js";

Hooks.once("init", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CONFIG.Actor.entityClass = BWActor as any;
    CONFIG.Item.entityClass = BWItem;
    game.burningwheel = {};

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("burningwheel", BWCharacterSheet, {
        types: ["character"],
        makeDefault: true
    });
    Actors.registerSheet("burningwheel", NpcSheet, {
        types: ["npc"],
        makeDefault: true
    });
    
    RegisterItemSheets();

    registerSystemSettings();
    preloadHandlebarsTemplates();
    registerHelpers();
});

Hooks.once("ready", async() => {
    migrateData();
});

function registerHelpers() {
    Handlebars.registerHelper('multiboxes', function(selected, options) {
        let html = options.fn(this);
        let testsAllowed = -1;
        if (options.hash.exp) {
            testsAllowed = 11 - parseInt(options.hash.exp, 10);
        }
        else if (Object.prototype.hasOwnProperty.call(options.hash, "needed")) {
            testsAllowed = parseInt(options.hash.needed, 10) + 1;
        }

        if (testsAllowed !== -1) {
            const rgx = new RegExp(' value="' + testsAllowed + '"');
            html = html.replace(rgx, "$& disabled=\"disabled\"");
        }
        if (!selected) {
            selected = [ 0 ];
        } else if (!(selected instanceof Array)) {
            selected = [ selected ];
        }
        selected.forEach((selectedValue: string) => {
            if (selectedValue) {
                const escapedValue = Handlebars.escapeExpression(selectedValue);
                const rgx = new RegExp(' value="' + escapedValue + '"');
                html = html.replace(rgx, "$& checked=\"checked\"");
            }
        });
        return html;
    });

    Handlebars.registerHelper("disabled", (value: boolean) => {
        if (value) {
            return " disabled ";
        }
        return "";
    });

    Handlebars.registerHelper("titlecase", (value: string) => {
        if (value) {
            return value.titleCase();
        }
        return "";
    });

    Handlebars.registerHelper("plusone", (value: number) => {
        return value + 1;
    });

    Handlebars.registerHelper("slugify", (value: string) => {
        return slugify(value.toLowerCase());
    });

    Handlebars.registerHelper("add", (...args): number => {
        return (Array.prototype.slice.call(args, 0, -1) as (string|number)[]).reduce<number>((acc: number, val) => {
            if (typeof val === "number") {
                return acc + val as number;
            }
            return acc + parseInt(val as string);
        }, 0);
    });

    Handlebars.registerHelper("sub", (a: string, b: string): number => {
        return parseInt(a) - parseInt(b);
    });
}


Hooks.on("renderChatLog", (_app, html: JQuery, _data) => onChatLogRender(html));
Hooks.on("renderChatMessage", (app, html, data) => hideChatButtonsIfNotOwner(app, html, data));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Hooks.on("createOwnedItem", (actor: BWActor, item: ItemData, _options: any, userId: string) => actor.processNewItem(item, userId));

Hooks.on('renderDialog', (dialog, html: JQuery) => {
    if (dialog.data.id && dialog.data.id === 'import-item') {
        html.find('input.new-item-dialog-search').on('input', (e) => {
            const searchTerm = $(e.target).val() as string;
            html.find('.search-grid > .search-entry').each((_, item) => {
                if ((item.dataset.skillName || "").toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) { 
                    $(item).show();
                } else {
                    $(item).hide();
                }
            });
        });
    }
});