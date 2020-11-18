import { BWItem } from "./items/item.js";
import { AttackData } from "./items/meleeWeapon.js";

export async function migrateData(): Promise<void> {
    if (!game.user.isGM) {
        // players can't do this stuff anyhow.
        return;
    }
    const latest = game.system.data.version;
    const recentVersion = await game.settings.get("burningwheel", "version") || "0.0.0";
    await game.settings.set("burningwheel", "version", latest);

    const patchVersions = Object.keys(migrationRoutines);
    for (const version of patchVersions) {
        if (isNewerVersion(version, recentVersion)) {
            // we need to do some updates.
            await migrationRoutines[version]();
            ui.notifications.notify(`Applied ${version} data migration.`, 'info');
        }
    }
}

const migrationRoutines: {[i:string]: () => Promise<void>} = {
    "0.2.1": async () => {
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
    },
    "0.2.2": async () => {
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
    },
    "0.4.1": async () => {
        // add attack array to all weapons
        const actors: Actor[] = Array.from(game.actors.values());
        for (const actor of actors) {
            for (const ownedItem of Array.from(actor.items.values())) {
                if (["melee weapon"].indexOf(ownedItem.type) !== -1) {
                    const attackData: AttackData = {
                        attackName: "",
                        power: parseInt(ownedItem.data.data.power),
                        add: parseInt(ownedItem.data.data.add),
                        vsArmor: parseInt(ownedItem.data.data.vsArmor),
                        weaponSpeed: ownedItem.data.data.weaponSpeed,
                        weaponLength: ownedItem.data.data.weaponLength
                    };
                    await ownedItem.update({ data: { attacks: [attackData] }}, {});
                }
            }
        }
        const packs = Array.from(game.packs.values());
        for (const pack of packs) {
            if (pack.cls === BWItem) {
                const packItems = await pack.getContent();
                for (const item of Array.from(packItems.values()) as Item[]) {
                    if (["melee weapon"].indexOf(item.type) !== -1) {
                        const attackData: AttackData = {
                            attackName: "",
                            power: parseInt(item.data.data.power),
                            add: parseInt(item.data.data.add),
                            vsArmor: parseInt(item.data.data.vsArmor),
                            weaponSpeed: item.data.data.weaponSpeed,
                            weaponLength: item.data.data.weaponLength
                        };
                        await item.update({ data: { attacks: [attackData] }}, {});
                    }
                }
            }
        }
    }
};
