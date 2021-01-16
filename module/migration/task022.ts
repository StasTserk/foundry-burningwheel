import { BWItem } from '../items/item.js';

export async function task022(): Promise<void> {
    // add shade to all weapons
    const actors: Actor[] = Array.from(game.actors.values());
    for (const actor of actors) {
        for (const ownedItem of Array.from(actor.items.values())) {
            // also, the typo in the item type 'possession' has been fixed
            // any existing items need to be updated to match the new type
            if (
                ['melee weapon', 'ranged weapon', 'armor'].indexOf(
                    ownedItem.type
                ) !== -1
            ) {
                await ownedItem.update({ data: { shade: 'B' } }, {});
            }
        }
    }
    const packs = Array.from(game.packs.values());
    for (const pack of packs) {
        if (pack.cls === BWItem) {
            const packItems = await pack.getContent();
            for (const item of Array.from(packItems.values()) as Item[]) {
                if (
                    ['melee weapon', 'ranged weapon', 'armor'].indexOf(
                        item.type
                    ) !== -1
                ) {
                    item.data.type = 'possession';
                    await item.update({ data: { shade: 'B' } }, {});
                }
            }
        }
    }
}
