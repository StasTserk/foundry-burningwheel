import { Skill } from "../items/skill.js";
import { Trait } from "../items/trait.js";
import { BWItem } from "../items/item.js";

export async function task063(): Promise<void> {
    const items: (Skill | Trait)[] = Array.from(game.items?.values() || []).filter((i: BWItem) => i.type === "skill" || i.type === "trait") as (Skill | Trait)[];
    const updateInfo = {};

    for (const item of items) {
        const updateData = updateItem(item, updateInfo);
        if (Object.values(updateData).length) {
            await item.update(updateData, {});
        }
    }

    const actors: Actor[] = Array.from(game.actors?.values() || []);
    for (const actor of actors) {
        for (const ownedItem of Array.from(actor.items.values()).filter((i: BWItem) => i.type === "skill" || i.type === "trait") as (Skill | Trait)[]) {
            const updateData = updateItem(ownedItem, updateInfo);
            if (Object.values(updateData).length) {
                await ownedItem.update(updateData, {});
            }
        }
    }

    const packs = Array.from(game.packs?.values() || []);
    for (const pack of packs) {
        if (pack.documentName === "Item") {
            const packItems = await pack.getDocuments();
            for (const item of Array.from(packItems.values()).filter((i: BWItem) => i.type === "skill" || i.type === "trait") as (Skill | Trait)[]) {
                const updateData = updateItem(item, updateInfo);
                if (Object.values(updateData).length) {
                    await item.update(updateData, {});
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

function updateItem(item: Skill | Trait, updateInfo: Record<string, number>): Record<string, string> {
    const data = {};
    if (item.data.img === "icons/svg/item-bag.svg") {
        if (item.data.type === "skill") {
            data["img"] = skillImages[(item as Skill).data.data.skilltype];
        } else {
            data["img"] = traitImages[(item as Trait).data.data.traittype];
        }
    }
    if (Object.values(data).length) {
        if (updateInfo[item.data.type]) {
            updateInfo[item.data.type] ++;
        } else {
            updateInfo[item.data.type] = 1;
        }
    }
    return data;
}

const skillImages = {
    "academic": "icons/sundries/documents/document-official-capital.webp",
    "artist": "icons/tools/hand/brush-paint-brown-white.webp",
    "artisan": "icons/tools/hand/chisel-steel-brown.webp",
    "craftsman": "icons/tools/hand/hammer-and-nail.webp",
    "forester": "icons/tools/navigation/map-simple-tree.webp",
    "martial": "icons/equipment/shield/heater-steel-sword-yellow-black.webp",
    "medicinal": "icons/tools/laboratory/bowl-herbs-green.webp",
    "military": "icons/environment/people/infantry-armored.webp",
    "musical": "icons/tools/instruments/pipe-flute-brown.webp",
    "peasant": "icons/environment/settlement/scarecrow.webp",
    "physical": "icons/equipment/hand/gauntlet-plate-gold.webp",
    "schoolofthought": "icons/sundries/books/book-worn-blue.webp",
    "seafaring": "icons/tools/nautical/steering-wheel.webp",
    "special": "icons/commodities/treasure/broach-lightning-gold.webp",
    "social": "icons/environment/people/group.webp",
    "sorcerous": "icons/weapons/staves/staff-ornate-blue-jewel.webp",
    "training": "icons/environment/settlement/target.webp"
};

const traitImages = {
    "character": "icons/sundries/gaming/rune-card.webp",
    "die": "icons/sundries/gaming/dice-runed-brown.webp",
    "call-on": "icons/sundries/gaming/playing-cards.webp"
};
