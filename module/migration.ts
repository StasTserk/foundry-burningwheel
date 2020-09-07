import { BWItem } from "./items/item.js";

export async function migrateData(): Promise<void> {
    if (!game.user.isGM) {
        // players can't do this stuff anyhow.
        return;
    }
    const latest = game.system.data.version;
    const recentVersion = await game.settings.get("burningwheel", "version") || "0.0.0";
    await game.settings.set("burningwheel", "version", latest);

    if (isNewerVersion(latest, recentVersion)) {
        // we need to do some updates.
        if (isNewerVersion("0.2.1", recentVersion)) {
            // refactored initialization code to use a flag for actors
            // to initialize fists, beliefs and instincts on new characters
            // only if a flag was set.
            // these items will have already been initialized on existing
            // characters so avoid re-initalizing them by setting the flag to true.
            const actors: Actor[] = Array.from(game.actors.values());
            for (const actor of actors) {
                await actor.setFlag("burningwheel", "initialized", true);
                for (const ownedItem of Array.from(actor.items.values())) {
                    // also, the typo in the item type 'possession' has been fixed
                    // any existing items need to be updated to match the new type
                    if (ownedItem.type === "posession") {
                        await ownedItem.update({type: "possession"}, null);
                    }
                }
                const ms = getProperty(actor, "data.mountedstride");
                await actor.update({
                    "data.mountedstride": null,
                    "data.mountedStride": ms
                });
            }

            // possession item type updates need to happen in the world and all the
            // compendium packs as well.
            const items: Item[] = Array.from(game.items.values());
            for (const item of items) {
                if (item.type === "posession") {
                    await item.update({type: "possession"}, {});
                }
            }

            const packs = Array.from(game.packs.values());
            for (const pack of packs) {
                if (pack.cls === BWItem) {
                    const packItems = await pack.getContent();
                    for (const item of Array.from(packItems.values()) as Item[]) {
                        if (item.type === "posession") {
                            item.data.type = "possession";
                            await pack.updateEntity(item.data);
                        }
                    }
                }
            }
            ui.notifications.notify(`Applied 0.2.1 data migration.`, 'info');
        }

        if (isNewerVersion("0.2.2", recentVersion)) {
            // add shade to all weapons
            const actors: Actor[] = Array.from(game.actors.values());
            for (const actor of actors) {
                for (const ownedItem of Array.from(actor.items.values())) {
                    // also, the typo in the item type 'possession' has been fixed
                    // any existing items need to be updated to match the new type
                    if (["melee weapon", "ranged weapon", "armor"].indexOf(ownedItem.type) !== -1) {
                        await ownedItem.update({ data: { shade: "B" }}, {});
                    }
                }
            }
            const packs = Array.from(game.packs.values());
            for (const pack of packs) {
                if (pack.cls === BWItem) {
                    const packItems = await pack.getContent();
                    for (const item of Array.from(packItems.values()) as Item[]) {
                        if (["melee weapon", "ranged weapon", "armor"].indexOf(item.type) !== -1) {
                            item.data.type = "possession";
                            await item.update({ data: { shade: "B" }}, {});
                        }
                    }
                }
            }
            ui.notifications.notify(`Applied 0.2.2 data migration.`, 'info');
        }
    }
}
