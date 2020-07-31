import { BWActor } from "./actor.js";
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

Hooks.once("init", async () => {
    CONFIG.Actor.entityClass = BWActor;
    CONFIG.Item.entityClass = BWItem;
    (game as any).burningwheel = {};

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("burningwheel", BWCharacterSheet, {
        types: ["character"],
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
        else if (options.hash.hasOwnProperty("needed")) {
            testsAllowed = parseInt(options.hash.needed, 10) + 1;
        }

        if (testsAllowed !== -1) {
            const rgx = new RegExp(' value=\"' + testsAllowed + '\"');
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
                const rgx = new RegExp(' value=\"' + escapedValue + '\"');
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
}


Hooks.on("renderChatLog", (_app, html: JQuery, _data) => onChatLogRender(html));
Hooks.on("renderChatMessage", (app, html, data) => hideChatButtonsIfNotOwner(app, html, data));
Hooks.on("createOwnedItem", (actor: BWActor, item: BaseEntityData, options: any) => actor.processNewItem(item));