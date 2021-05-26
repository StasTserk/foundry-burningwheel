import { ItemDragData } from "../helpers.js";
import { getImage, MacroData } from "./Macro.js";
import { BWActor } from "../actors/BWActor.js";
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

export function RollEditMacro(actorId: string, itemId: string): void {
    const actor = game.actors?.find(a => a.id === actorId) as BWActor;
    if (!actor) {
        ui.notifications?.notify("Unable to find actor linked to this macro. Were they deleted?", "error");
        return;
    }

    const item = actor.getOwnedItem(itemId) as BWItem | null;
    if (!item) {
        ui.notifications?.notify("Unable to find item linked to this macro. Was it deleted?", "error");
        return;
    }
    item.sheet?.render(true);
}