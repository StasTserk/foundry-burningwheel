import { Skill } from "../items/skill";
import { Trait } from "../items/trait";
import { BWItem } from "../items/item";
import { skillImages } from "../constants";

export async function task063(): Promise<void> {
    const items: (BWItem)[] = Array.from(game.items?.values() || []).filter((i: BWItem) => i.type === "skill" || i.type === "trait") as (BWItem)[];
    const updateInfo = {};

    for (const item of items) {
        const updateData = updateItem(item, updateInfo);
        if (Object.values(updateData).length) {
            await item.update(updateData);
        }
    }

    const actors: Actor[] = Array.from(game.actors?.values() || []);
    for (const actor of actors) {
        for (const ownedItem of Array.from(actor.items.values()).filter((i: BWItem) => i.type === "skill" || i.type === "trait") as (BWItem)[]) {
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
            for (const item of Array.from(packItems.values()).filter((i: BWItem) => i.type === "skill" || i.type === "trait") as (BWItem)[]) {
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

function updateItem(item: BWItem, updateInfo: Record<string, number>): Record<string, string> {
    const data = {};
    if (item.img === "icons/svg/item-bag.svg") {
        if (item.type === "skill") {
            data["img"] = skillImages[(item as Skill).data.data.skilltype];
        } else {
            data["img"] = traitImages[(item as Trait).data.data.traittype];
        }
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

const traitImages = {
    "character": "icons/sundries/gaming/rune-card.webp",
    "die": "icons/sundries/gaming/dice-runed-brown.webp",
    "call-on": "icons/sundries/gaming/playing-cards.webp"
};
