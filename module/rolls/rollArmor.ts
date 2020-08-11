import { BWActorSheet } from "../bwactor-sheet.js";
import { Armor, AssignDamage } from "../items/item.js";
import { rollDice, RollDialogData, templates, RollChatMessageData, extractNumber, getRollNameClass, buildRerollData, extractBaseData, buildDiceSourceObject } from "./rolls.js";
import { BWActor } from "../actor.js";
import { StringIndexedObject } from "module/helpers.js";

export async function handleArmorRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const actor = sheet.actor;
    const armorId = target.dataset.itemId || "";
    const armorItem = actor.getOwnedItem(armorId) as Armor;
    const location = target.dataset.location || "";
    const damage = armorItem.data.data[`damage${location}`];

    const dialogData: ArmorDialogData = {
        difficulty: 1,
        name: "Armor Roll",
        arthaDice: 0,
        bonusDice: 0,
        armor: armorItem.data.data.dice,
        damage
    };
    const html = await renderTemplate(templates.armorDialog, dialogData);

    return new Dialog({
        title: "Roll Armor Dice",
        content: html,
        buttons: {
            roll: {
                label: "Roll",
                callback: (html: JQuery) => armorRollCallback(armorItem, html, sheet, location)
            }
        }

    }).render(true);

}

export async function armorRollCallback(armorItem: Armor, html: JQuery, sheet: BWActorSheet, location: string): Promise<unknown> {   
    const dice = parseInt(armorItem.data.data.dice);
    const damage = parseInt(armorItem.data.data[`damage${location}`]);
    const va = extractNumber(html, "vsArmor");
    const actor = armorItem.actor as BWActor;
    const baseData = extractBaseData(html, sheet);
    const dieSources: StringIndexedObject<string> = {
        Armor: `+${dice}`,
    };
    if (damage) {
        dieSources.Damage = `-${damage}`;
    }


    const numDice = dice - damage;
    const roll = await rollDice(numDice, false, "B");
    if (!roll) { return; }
    const damageAssigned = await AssignDamage(armorItem, roll, location);
    const isSuccess = roll.total > 1 + va;
    const rerollData = buildRerollData(actor, roll, undefined, armorItem._id);
    rerollData.type = "armor";
    const messageData: RollChatMessageData = {
        name: "Armor Roll",
        successes: "" + roll.dice[0].total,
        success: isSuccess,
        rolls: roll.dice[0].rolls,
        difficulty: 1 + va,
        nameClass: getRollNameClass(false, "B"),
        difficultyGroup: "N/A",
        obstacleTotal: 1 + va,
        callons: [],
        fateReroll: rerollData,
        dieSources: {
            ...dieSources,
            ...buildDiceSourceObject(0, baseData.aDice, baseData.bDice, 0, 0, 0)
        }
    };
    console.log(`Armor took ${damageAssigned} damage`);

    const messageHtml = await renderTemplate(templates.armorMessage, messageData);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: armorItem.actor as BWActor})
    });

}

interface ArmorDialogData extends RollDialogData {
    damage: string;
    armor: string;
}