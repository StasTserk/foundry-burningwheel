import { BWActorSheet } from "../bwactor-sheet.js";
import { Armor } from "module/items/item.js";
import { rollDice } from "./rolls.js";

export function handleArmorRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const actor = sheet.actor;
    const armorId = target.dataset.itemId || "";
    const armorItem = actor.getOwnedItem(armorId) as Armor;
    const location = target.dataset.location || "";
    const dice = parseInt(armorItem.data.data.dice);
    const damage = parseInt(armorItem.data.data[`damage${location.charAt(0).toUpperCase() + location.slice(1)}`]);
    const numDice = dice - damage;
    return rollDice(numDice, false, "B");
}