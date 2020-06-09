import { BWActor } from "./actor.js";
import { BWActorSheet } from "./actor-sheet.js";
import { BWItem } from "./item.js";
import { BeliefSheet } from "./items/belief-sheet.js";
import { Belief } from "./items/belief.js";
import { Instinct } from "./items/instinct.js"
import { Trait } from "./items/trait.js"
import { TraitSheet } from "./items/trait-sheet.js";

Hooks.once("init", async () => {
    (game as any).bw = {
        Belief,
        Instinct,
        Trait
    }

    console.info(" ... rebinding sheet ... ");
    CONFIG.Actor.entityClass = BWActor;
    CONFIG.Item.entityClass = BWItem;

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("burningwheel", BWActorSheet, {
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
})