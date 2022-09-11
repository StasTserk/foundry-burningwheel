import { BWItem } from "../items/item";
import { Skill } from "../items/skill";

export async function task120(): Promise<void> {
    const items: (Skill)[] = Array.from(game.items?.values() || []).filter((i: BWItem) => i.type === "skill") as (Skill)[];
    const updateInfo = {};

    for (const item of items) {
        const updateData = updateItem(item, updateInfo);
        if (Object.values(updateData).length) {
            await item.update(updateData);
        }
    }

    const actors: Actor[] = Array.from(game.actors?.values() || []);
    for (const actor of actors) {
        for (const ownedItem of Array.from(actor.items.values()).filter((i: BWItem) => i.type === "skill") as (Skill)[]) {
            const updateData = updateItem(ownedItem, updateInfo);
            if (Object.values(updateData).length) {
                await ownedItem.update(updateData);
            }
        }
    }

    const packs = Array.from(game.packs?.values() || []);
    for (const pack of packs) {
        if (pack.documentName === "Item") {
            const packItems = await pack.getDocuments();
            for (const item of Array.from(packItems.values()).filter((i: BWItem) => i.type === "skill") as (Skill)[]) {
                const updateData = updateItem(item, updateInfo);
                if (Object.values(updateData).length) {
                    await item.update(updateData);
                }
            }
        }
    }

    const updatedTypes = Object.keys(updateInfo);
    const parts: string[] = [];
    for (const types of updatedTypes) {
        parts.push(`${updateInfo[types]} ${types}s`);
    }
    const message = updatedTypes.length ? `Updated ${parts.join(", ")}.` : "No entities needed to be updated.";
    ui.notifications?.notify(message, "info");
}

function updateItem(item: Skill, updateInfo: Record<string, number>): Record<string, string> {
    const data = {};
    if (item.system.training && ["military", "martial"].indexOf(item.system.skilltype) === -1) {
        data["data.training"] = false;
        data["data.magical"] = true;
    }
    if (Object.values(data).length) {
        if (updateInfo[item.type]) {
            updateInfo[item.type] ++;
        } else {
            updateInfo[item.type] = 1;
        }
    }
    return data;
}