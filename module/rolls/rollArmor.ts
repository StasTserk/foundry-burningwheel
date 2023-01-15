import {
    rollDice,
    RollDialogData,
    templates,
    RollChatMessageData,
    extractNumber,
    getRollNameClass,
    buildRerollData,
    extractBaseData,
    buildDiceSourceObject,
    ArmorEventHandlerOptions
} from "./rolls.js";
import { BWActor } from "../actors/BWActor.js";
import { StringIndexedObject } from "../helpers.js";
import * as helpers from "../helpers.js";
import { BWCharacterSheet } from "../actors/sheets/BWCharacterSheet.js";
import { NpcSheet } from "../actors/sheets/NpcSheet.js";
import { Armor } from "../items/armor.js";

export async function handleArmorRollEvent({ target, sheet }: ArmorEventHandlerOptions): Promise<unknown> {
    const actor = sheet.actor;
    const armorId = target.dataset.itemId || "";
    const armorItem = actor.items.get<Armor>(armorId);
    const location = target.dataset.location || "";
    const chestBonus = location.toLowerCase() === "torso" ? 1 : 0;
    const damage = armorItem?.system[`damage${location}`];

    const dialogData: ArmorDialogData = {
        difficulty: 1,
        name: "Armor",
        arthaDice: 0,
        bonusDice: 0,
        armor: (armorItem?.system.dice || 0) + chestBonus,
        damage,
        showObstacles: true,
        showDifficulty: true,
    };
    const html = await renderTemplate(templates.armorDialog, dialogData);

    return new Dialog({
        title: "Roll Armor Dice",
        content: html,
        buttons: {
            roll: {
                label: game.i18n.localize("BW.roll.roll"),
                callback: (html: JQuery) => armorRollCallback(armorItem as Armor, html, sheet, location)
            }
        },
        default: "roll"
    }).render(true);

}

export async function armorRollCallback(armorItem: Armor, html: JQuery, sheet: BWCharacterSheet | NpcSheet, location: string): Promise<unknown> {   
    const dice = extractNumber(html, "armor");
    const damage = parseInt(armorItem.system[`damage${location}`]);
    const va = extractNumber(html, "vsArmor");
    const actor = armorItem.actor as unknown as BWActor;
    const baseData = extractBaseData(html, sheet);
    const dieSources: StringIndexedObject<string> = {
        Armor: `+${dice}`,
    };
    if (damage) {
        dieSources.Damage = `-${damage}`;
    }

    const numDice = dice - damage;
    const roll = await rollDice(numDice, false, armorItem.system.shade || "B");
    if (!roll) { return; }
    const damageAssigned = await armorItem.assignDamage(roll, location);
    const isSuccess = (roll.total || 0) >= 1 + va;
    const rerollData = buildRerollData({ actor, roll, itemId: armorItem.id });
    rerollData.type = "armor";
    const messageData: RollChatMessageData = {
        name: "Armor",
        successes: "" + roll.dice[0].total,
        success: isSuccess,
        rolls: roll.dice[0].results,
        difficulty: 1 + va,
        nameClass: getRollNameClass(false, armorItem.system.shade || "B"),
        difficultyGroup: "N/A",
        obstacleTotal: 1 + va,
        callons: [],
        fateReroll: rerollData,
        dieSources: {
            ...dieSources,
            ...buildDiceSourceObject(0, baseData.aDice, baseData.bDice, 0, 0, 0)
        },
        extraInfo: damageAssigned ? `${armorItem.name} ${helpers.deCamelCaseify(location).toLowerCase()} lost ${damageAssigned} ${damageAssigned > 1 ? 'dice' : 'die'} to damage.` : undefined
    };
    
    const messageHtml = await renderTemplate(templates.armorMessage, messageData);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: armorItem.actor as unknown as BWActor})
    });

}

interface ArmorDialogData extends RollDialogData {
    damage: string;
    armor: number;
}