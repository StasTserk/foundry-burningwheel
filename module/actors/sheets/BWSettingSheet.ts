import { BWItem } from "module/items/item.js";
import { LifepathRootData } from "../../items/lifepath.js";
import { BWSetting } from "../BWSetting.js";
import * as helpers from "../../helpers.js";

export class BWSettingSheet extends ActorSheet {
    get template(): string {
        return "systems/burningwheel/templates/setting-sheet.hbs";
    }
    get actor(): BWSetting {
        return super.actor as BWSetting;
    }
    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {
            width: 600
        });
    }

    getData(): BWSettingData {
        const data = super.getData() as BWSettingData;
        data.lifepaths = (data.actor.items as unknown as LifepathRootData[]).sort((a, b) => a.data.order - b.data.order);
        return data;
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find('.lifepath[draggable="true"]').on('dragstart', (e) => {
            const actor = this.actor;
            const item = actor.getOwnedItem(e.target.dataset.id || "") as BWItem;
            const dragData: helpers.ItemDragData = {
                actorId: actor.id,
                id: item.id,
                type: "Item",
                data: item.data,
                pack: actor.compendium ? actor.compendium.collection : undefined
            };

            if (e.originalEvent?.dataTransfer) {
                e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            }
        });

        html.find('i[data-action="delete"]').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.target.dataset.id || "";
            this.actor.deleteOwnedItem(id);
        });

        html.find('.lifepath').on('click', (e) => {
            const id = e.currentTarget.dataset.id || "";
            this.actor.getOwnedItem(id)?.sheet.render(true);
        });
    }
}

export interface BWSettingData extends ActorSheetData {
    lifepaths: LifepathRootData[];
}