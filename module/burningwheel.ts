import { BWActor } from "./actor.js";
import { BWActorSheet } from "./actor-sheet.js";
import { BWItem } from "./item.js";
import { BeliefSheet } from "./items/belief-sheet.js";
import { Belief } from "./items/belief.js";

Hooks.once("init", async () => {
    (game as any).bw = {
        Belief
    }

    console.info(" ... rebinding sheet ... ");
    CONFIG.Actor.entityClass = BWActor;
    CONFIG.Item.entityClass = BWItem;
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("burningwheel", BWActorSheet, {
        types: ["character"],
        makeDefault: true
    });

    Actors.unregisterSheet("core", ItemSheet);
    Items.registerSheet("burningwheel", BeliefSheet, {
        types: ["Belief"],
        makeDefault: true
    })
})