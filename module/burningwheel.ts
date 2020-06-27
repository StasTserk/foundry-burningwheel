import { BWActor } from "./actor.js";
import { BWActorSheet } from "./bwactor-sheet.js"
import { BWCharacterSheet } from "./character-sheet.js";
import { BWItem } from "./item.js";
import { BeliefSheet } from "./items/belief-sheet.js";
import { Belief } from "./items/belief.js";
import { Instinct } from "./items/instinct.js"
import { RelationshipSheet } from "./items/relationship-sheet.js";
import { SkillSheet } from "./items/skill-sheet.js";
import { TraitSheet } from "./items/trait-sheet.js";
import { Trait } from "./items/trait.js"
import { preloadHandlebarsTemplates } from "./templates.js";

Hooks.once("init", async () => {
    (game as any).bw = {
        Belief,
        Instinct,
        Trait,
        BWActorSheet
    }

    console.info(" ... rebinding sheet ... ");
    CONFIG.Actor.entityClass = BWActor;
    CONFIG.Item.entityClass = BWItem;

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("burningwheel", BWCharacterSheet, {
        types: ["character"],
        makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("burningwheel", BeliefSheet, {
        types: ["belief"],
        makeDefault: true
    });
    Items.registerSheet("burningwheel", TraitSheet, {
        types: ["trait"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", SkillSheet, {
        types: ["skill"],
        makeDefault: true
    });

    Items.registerSheet("burningwheel", RelationshipSheet, {
        types: ["relationship"],
        makeDefault: true
    });

    preloadHandlebarsTemplates();
    registerHelpers();
});

function registerHelpers() {
    Handlebars.registerHelper('multiboxes', function(selected, options) {
        let html = options.fn(this);
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
}