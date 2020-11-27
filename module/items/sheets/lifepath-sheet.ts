import { BWActor } from "../../actors/bwactor.js";
import { DragData } from "../../helpers.js";
import { BWItem } from "../item.js";
import { BWItemSheet, BWItemSheetData } from "./bwItemSheet.js";

export class LifepathSheet extends BWItemSheet {
    getData(): BWItemSheetData {
        const data = super.getData();
        return data;
    }

    get template(): string {
        return "systems/burningwheel/templates/items/lifepath.hbs";
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.on('drop', (e) => this._onDrop(e.originalEvent as DragEvent));
    }

    
    protected async _onDrop(event: DragEvent): Promise<void> {
        super._onDrop(event);
        let data: DragData;
        try {
            data = JSON.parse(event.dataTransfer?.getData('text/plain') || "");
        }
        catch (err) {
            console.log(err);
            return;
        }
        if (data.type === "Item" && data.id) {
            let item: BWItem | undefined;
            if (data.pack) {
                item = await (game.packs.find(p => p.collection === data.pack) as Compendium).getEntity(data.id) as BWItem;
            } else if (data.actorId) {
                item = (game.actors.find((a: BWActor) => a._id === data.actorId) as BWActor).getOwnedItem(data.id) as BWItem;
            } else {
                item = game.items.find((i: BWItem) => i.id === data.id) as BWItem;
            }

            if (item) {
                if (item.type === "skill") {
                    const skillList = `${this.item.data.data.skillList}${this.item.data.data.skillList ? ', ' : ''}${item.name}`;
                    this.item.update({ "data.skillList": skillList }, {});
                } else if (item.type === "trait") {
                    const traitList = `${this.item.data.data.traitList}${this.item.data.data.traitList ? ', ' : ''}${item.name}`;
                    this.item.update({ "data.traitList": traitList }, {});
                }
            }
        }
    }
}