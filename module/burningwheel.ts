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
import { DuelOfWitsDialog } from "./dialogs/duel-of-wits.js";
import { FightDialog } from "./dialogs/fight.js";

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

    let dowData = {};
    let fightData = {};
    try {
        dowData = await JSON.parse(game.settings.get("burningwheel", "dow-data"));
        fightData = await JSON.parse(game.settings.get("burningwheel", "fight-data"));
    } catch (err) {
        console.log("Error parsing serialized duel of wits / fight data");
        console.log(err);
    }
    
    game.burningwheel.dow = new DuelOfWitsDialog({
        title: "Duel of Wits",
        buttons: {},
        data: dowData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    game.burningwheel.dow.activateSocketListeners();

    game.burningwheel.fight = new FightDialog({
        title: "Fight!",
        buttons: {},
        data: fightData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    game.burningwheel.fight.activateSocketListeners();
});

Hooks.once("ready", async() => {
    migrateData();
});

Hooks.on("renderSidebarTab", async (_data, html: JQuery) => {
    if (html.prop("id") === "combat") { // this is the combat tab
        DuelOfWitsDialog.addSidebarControl(html);
        FightDialog.addSidebarControl(html);
    }
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
        const containerDiv = document.createElement("div");
        containerDiv.className = "test-tracking";
        const clearButton = document.createElement("input");
        clearButton.type = "radio";
        clearButton.dataset.itemId = id;
        clearButton.value = "0";
        clearButton.dataset.binding = path;
        clearButton.name = `${id}-${idLabel}`;
        clearButton.id = `${id}-${idLabel}-0`;
        clearButton.checked = true;
        const clearLabel = document.createElement("label");
        clearLabel.htmlFor = `${id}-${idLabel}-0`;
        clearLabel.className = "progress-clear";
        const labelIcon = document.createElement("i");
        labelIcon.className = "fas fa-times-circle";
        clearLabel.appendChild(labelIcon);
        containerDiv.appendChild(clearButton);
        containerDiv.appendChild(clearLabel);

        for (let i = 1; i <= numActive + numInactive; i ++) {
            const button = document.createElement("input");
            button.type = "radio";
            button.dataset.itemId = id;
            button.value = "" + i;
            button.dataset.binding = path;
            button.name = `${id}-${idLabel}`;
            button.id = `${id}-${idLabel}-${i}`;
            button.disabled = i > numActive;
            const label = document.createElement("label");
            label.htmlFor = `${id}-${idLabel}-${i}`;
            label.className = "progress-tick";
            containerDiv.appendChild(button);
            containerDiv.appendChild(label);
        }
        if (Number.isNaN(parseInt(value))) {
            value = "0";
        }
        let html = containerDiv.outerHTML;
        const rgx = new RegExp(' value="' + value + '"');
        html = html.replace(rgx, "$& checked=\"checked\"");
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
}


Hooks.on("renderChatLog", (_app, html: JQuery, _data) => onChatLogRender(html));
Hooks.on("renderChatMessage", (app, html, data) => hideChatButtonsIfNotOwner(app, html, data));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Hooks.on("createOwnedItem", (actor: BWActor, item: ItemData, _options: any, userId: string) => actor.processNewItem(item, userId));