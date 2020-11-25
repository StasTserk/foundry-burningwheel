import { ItemDragData } from "../helpers.js";
import { getImage, MacroData } from "./Macro.js";
import { BWActor } from "../actors/bwactor.js";
import { BWItem, BWItemData } from "../items/item.js";

export function CreateEditMacro(data: ItemDragData): MacroData | null {
    if (!data.actorId) {
        return null;
    }
    const itemData = data.data as BWItemData & { _id: string };
    return {
        name: `Edit ${itemData.name}`,
        type: 'script',
        command: `game.burningwheel.macros.showOwnedItem("${data.actorId}", "${data.id}");`,
        img: getImage(itemData.img, itemData.type)
    };
}

export function RollEditMacro(actorId: string, skillId: string): void {
    const actor = game.actors.find(a => a.id === actorId) as BWActor;
    const item = actor.getOwnedItem(skillId) as BWItem;
    item.sheet.render(true);
}