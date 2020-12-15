import { BWActor } from "./actors/BWActor.js";
import { BWCharacterSheet } from "./actors/sheets/BWCharacterSheet.js";
import { RegisterItemSheets } from "./items/item.js";

import { hideChatButtonsIfNotOwner, onChatLogRender } from "./chat.js";
import { ShadeString, slugify, translateWoundValue } from "./helpers.js";
import { migrateData } from "./migration/migration.js";
import { registerSystemSettings } from "./settings.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { NpcSheet } from "./actors/sheets/NpcSheet.js";

import { actorConstructor, itemConstructor } from "./factory.js";

import * as constants from "./constants.js";
import { CreateBurningWheelMacro, RegisterMacros } from "./macros/Macro.js";
import { BWSettingSheet } from "./actors/sheets/BWSettingSheet.js";
import * as dialogs from "./dialogs/index.js";

Hooks.once("init", async () => {
    CONFIG.Actor.entityClass = actorConstructor;
    CONFIG.Item.entityClass = itemConstructor;
    game.burningwheel = {};

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet(constants.systemName, BWCharacterSheet, {
        types: ["character"],
        makeDefault: true
    });
    Actors.registerSheet(constants.systemName, NpcSheet, {
        types: ["npc"],
        makeDefault: true
    });
    Actors.registerSheet(constants.systemName, BWSettingSheet, {
        types: ["setting"],
        makeDefault: true
    });
    
    RegisterItemSheets();

    registerSystemSettings();
    preloadHandlebarsTemplates();
    registerHelpers();
    dialogs.initializeExtendedTestDialogs();
});

Hooks.once("ready", async() => {
    await migrateData();
    await dialogs.initializeRollPanels();
    RegisterMacros();
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
        if (!(selected instanceof Array)) {
            if (Number.isNaN(selected)) {
                selected = [ 0 ];
            } else {
                selected = [ selected ];
            }
        }
        selected.forEach((selectedValue: string) => {
            const escapedValue = Handlebars.escapeExpression(selectedValue);
            const rgx = new RegExp(' value="' + escapedValue + '"');
            html = html.replace(rgx, "$& checked=\"checked\"");
        });
        return html;
    });

    Handlebars.registerHelper("itemProgressTicks", (id: string, value: string, path: string, idLabel: string, numActive: number, numInactive: number) => {
        const progressHtml: string[] = [];
        progressHtml.push(`<div class="test-tracking">`);
        progressHtml.push(`<input type="radio" data-item-id="${id}" value="0" id="${id}-${idLabel}-0" data-binding="${path}" ${Number.isNaN(parseInt(value)) || value.toString() === "0" ? "checked" : ""}>`);
        progressHtml.push(`<label for="${id}-${idLabel}-0" class="progress-clear"><i class="fas fa-times-circle"></i></label>`);
        
        for (let i = 1; i <= numActive + numInactive; i ++) {
            progressHtml.push(`<input type="radio" data-item-id="${id}" value="${i}" id="${id}-${idLabel}-${i}" data-binding="${path}"${value.toString() === i.toString() ? " checked" : ""}${i > numActive ? " disabled" : ""}>`);
            progressHtml.push(`<label for="${id}-${idLabel}-${i}" class="progress-tick"></label>`);
        }
        progressHtml.push("</div>");
        return progressHtml.join('\n');
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

    Handlebars.registerHelper("plusone", (value: string | number) => {
        return parseInt(value.toString()) + 1;
    });

    Handlebars.registerHelper("disabled", (value: boolean) => {
        if (value) {
            return "disabled";
        }
        return "";
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

    Handlebars.registerHelper("clampWound", (shade: ShadeString, value: string | number): string => {
        return translateWoundValue(shade, value);
    });
}


Hooks.on("renderChatLog", (_app, html: JQuery, _data) => onChatLogRender(html));
Hooks.on("renderChatMessage", (app, html, data) => hideChatButtonsIfNotOwner(app, html, data));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Hooks.on("createOwnedItem", (actor: BWActor, item: ItemData, _options: any, userId: string) => {
    if (actor.data.type !== "setting") { actor.processNewItem(item, userId); }
});
Hooks.on("hotbarDrop", (_bar, data, slot) => CreateBurningWheelMacro(data, slot));