import { ItemDragData } from "../helpers.js";
import { MacroData } from "./Macro.js";
import { BWActor } from "../actors/bwactor.js";
import { BWItem, BWItemData } from "../items/item.js";

export function CreateEditMacro(data: ItemDragData): MacroData | null {
    if (!data.actorId) {
        return null;
    }
    const skillData = data.data as BWItemData & { _id: string };
    return {
        name: `Edit ${skillData.name}`,
        type: 'script',
        command: `game.burningwheel.macros.showOwnedItem("${data.actorId}", "${data.id}");`,
        img: skillData.img
    };
}

export function RollEditMacro(actorId: string, skillId: string): void {
    const actor = game.actors.find(a => a.id === actorId) as BWActor;
    const item = actor.getOwnedItem(skillId) as BWItem;
    item.sheet.render(true);
}