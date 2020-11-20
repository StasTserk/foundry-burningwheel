import { Skill } from "../items/skill.js";
import { Trait } from "../items/trait.js";
import { Armor } from "../items/armor.js";
import { BWItem } from "../items/item.js";
import { Spell } from "../items/spell.js";
import { RangedWeapon } from "../items/rangedWeapon.js";
import { Reputation } from "../items/reputation.js";
import { Affiliation } from "../items/affiliation.js";

export async function task061(): Promise<void> {
    const items: BWItem[] = Array.from(game.items.values()) as BWItem[];
    const updateInfo = {};
    for (const item of items) {
        const updateData = updateItem(item, updateInfo);
        if (Object.values(updateData).length) {
            await item.update(updateData, {});
        }
    }

    const actors: Actor[] = Array.from(game.actors.values());
    for (const actor of actors) {
        for (const ownedItem of Array.from(actor.items.values()) as BWItem[]) {
            const updateData = updateItem(ownedItem, updateInfo);
            if (Object.values(updateData).length) {
                await ownedItem.update(updateData, {});
            }
        }
    }

    const packs = Array.from(game.packs.values());
    for (const pack of packs) {
        if (pack.cls === BWItem) {
            const packItems = await pack.getContent();
            for (const item of Array.from(packItems.values()) as BWItem[]) {
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
    ui.notifications.notify(message, "info");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateToNumber(value: string | number | number[] | string[] | null, path: string, data: Record<string, any>): void {
    if (typeof value === "number") {
        return;
    }
    if (value === null) {
        value = 0;
    }
    if (typeof value === "object") {
        // this is an array
        value = value[0];
    }
    if (typeof value === "string") {
        value = parseInt(value);
    }
    data[path] = value;
}

function updateItem(item: BWItem, updateInfo: Record<string, number>): Record<string, number> {
    let updateData = {};
    switch (item.data.type) {
        case "armor":
            updateData = updateArmor(item as Armor);
            break;
        case "skill":
            updateData = updateSkill(item as Skill);
            break;
        case "trait":
            updateData = updateTrait(item as Trait);
            break;
        case "spell":
            updateData = updateSpell(item as Spell);
            break;
        case "ranged weapon":
            updateData = updateRanged(item as RangedWeapon);
            break;
        case "reputation":
            updateData = updateReputation(item as Reputation);
            break;
        case "affiliation":
            updateData = updateAffiliation(item as Affiliation);
    }

    if (Object.values(updateData).length) {
        if (updateInfo[item.data.type]) {
            updateInfo[item.data.type] ++;
        } else {
            updateInfo[item.data.type] = 1;
        }
        
    }

    return updateData;
}

function updateArmor(item: Armor): Record<string, number> {
    const data = {};
    updateToNumber(item.data.data.dice, "data.dice", data);
    updateToNumber(item.data.data.damageHelm, "data.damageHelm", data);
    updateToNumber(item.data.data.damageLeftArm, "data.damageLeftArm", data);
    updateToNumber(item.data.data.damageLeftLeg, "data.damageLeftLeg", data);
    updateToNumber(item.data.data.damageRightArm, "data.damageRightArm", data);
    updateToNumber(item.data.data.damageRightLeg, "data.damageRightLeg", data);
    updateToNumber(item.data.data.damageTorso, "data.damageTorso", data);
    updateToNumber(item.data.data.damageShield, "data.damageShield", data);
    return data;
}

function updateSkill(item: Skill): Record<string, number> {
    const data = {};
    updateToNumber(item.data.data.exp, "data.exp", data);
    updateToNumber(item.data.data.challenging, "data.challenging", data);
    updateToNumber(item.data.data.routine, "data.routine", data);
    updateToNumber(item.data.data.difficult, "data.difficult", data);
    updateToNumber(item.data.data.fate, "data.fate", data);
    updateToNumber(item.data.data.persona, "data.persona", data);
    updateToNumber(item.data.data.deeds, "data.deeds", data);
    updateToNumber(item.data.data.learningProgress, "data.learningProgress", data);
    return data;
}

function updateTrait(item: Trait): Record<string, number> {
    const data = {};
    updateToNumber(item.data.data.affiliationDice, "data.affiliationDice", data);
    updateToNumber(item.data.data.dieModifier, "data.dieModifier", data);
    updateToNumber(item.data.data.obModifier, "data.obModifier", data);
    updateToNumber(item.data.data.reputationDice, "data.reputationDice", data);
    updateToNumber(item.data.data.aptitudeModifier, "data.aptitudeModifier", data);
    return data;
}

function updateSpell(item: Spell): Record<string, number> {
    const data = {};
    updateToNumber(item.data.data.willDamageBonus, "data.willDamageBonus", data);
    updateToNumber(item.data.data.learningProgress, "data.learningProgress", data);
    updateToNumber(item.data.data.va, "data.va", data);
    updateToNumber(item.data.data.optimalRange, "data.optimalRange", data);
    updateToNumber(item.data.data.extremeRange, "data.extremeRange", data);
    return data;
}

function updateRanged(item: RangedWeapon): Record<string, number> {
    const data = {};
    updateToNumber(item.data.data.incidental, "data.incidental", data);
    updateToNumber(item.data.data.incidentalRoll, "data.incidentalRoll", data);
    updateToNumber(item.data.data.mark, "data.mark", data);
    updateToNumber(item.data.data.markRoll, "data.markRoll", data);
    updateToNumber(item.data.data.superb, "data.superb", data);
    updateToNumber(item.data.data.vsArmor, "data.vsArmor", data);
    updateToNumber(item.data.data.optimalRange, "data.optimalRange", data);
    updateToNumber(item.data.data.extremeRange, "data.extremeRange", data);
    return data;
}

function updateReputation(item: Reputation): Record<string, number> {
    const data = {};
    updateToNumber(item.data.data.dice, "data.dice", data);
    return data;
}

function updateAffiliation(item: Affiliation): Record<string, number> {
    const data = {};
    updateToNumber(item.data.data.dice, "data.dice", data);
    return data;
}
