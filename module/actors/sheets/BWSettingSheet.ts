import { BWItem } from "../../items/item.js";
import { Lifepath, LifepathRootData } from "../../items/lifepath.js";
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
        data.lifepaths = (Array.from(this.actor.items.values()) as Lifepath[]).map(i => i.data).sort((a, b) => a.data.order - b.data.order);
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

        
        html.find('.lifepath').each((_, element) => {
            let dragCounter = 0;
            $(element).on('click', (e) => {
                const id = e.currentTarget.dataset.id || "";
                this.actor.getOwnedItem(id)?.sheet.render(true);
            }).on('dragenter', ev => {
                $(ev.currentTarget).addClass("show-drop");
                dragCounter ++;
            }).on('dragleave', ev => {
                dragCounter --;
                if (dragCounter === 0) {
                    $(ev.currentTarget).removeClass("show-drop");
                }
            }).on('drop', ev => {
                dragCounter === 0;
                $(ev.currentTarget).removeClass("show-drop");
                $(element).show();
            });
        });

        html.find('.drop-area').on('drop', ev => {
            $(ev.currentTarget).parents('.lifepath').removeClass("show-drop");
            ev.stopPropagation();
            const element = ev.currentTarget;
            const index = parseInt(element.dataset.index || "0");
            const event = ev.originalEvent;
            if (event) {
                this.insertItemAtIndex(event, index);
            }
        });
    }

    async insertItemAtIndex(event: DragEvent, index: number): Promise<void> {
        console.log(`trying to add item at ${index}`);

        let dragData: helpers.DragData;
        try {
            dragData = JSON.parse(event.dataTransfer?.getData('text/plain') || "");
        }
        catch (err) {
            console.log(err);
            return;
        }
        
        if (dragData.type !== "Item") {
            return;
        }

        const sortedItems = (Array.from(this.actor.items.values()) as Lifepath[]).sort((a, b) => a.data.data.order - b.data.data.order);
        if (dragData.actorId === this.actor.id) {
            // we need to just update the index of the entry
            const item = this.actor.getOwnedItem(dragData.id || "") as Lifepath;
            await item.update({ "data.order": index }, {});
        } else {
            // we need to get the item data and add it to the setting sheet
            let itemData: LifepathRootData | undefined;
            if (dragData.data) {
                itemData = dragData.data as LifepathRootData;
            } else if (dragData.pack) {
                itemData = (await (game.packs.find(p => p.collection === dragData.pack) as Compendium).getEntity(dragData.id || "")).data as LifepathRootData;
            } else if (dragData.actorId) {
                itemData = (game.actors.find((a: BWSetting) => a._id === dragData.actorId)).getOwnedItem(dragData.id).data as LifepathRootData;
            } else {
                itemData = game.items.find((i: BWItem) => i.id === dragData.id).data as LifepathRootData;
            }

            // if our item is actually a lifepath we need to add it, otherwise abort.
            if (itemData.type === "lifepath") {
                itemData.data.order = index;
                await this.actor.createOwnedItem(itemData);
            } else {
                return;
            }
        }

        const updateData: Record<string, string | number>[] = [];

        for(let i = 0; i < index; i ++) {
            const item = sortedItems[i];
            if (item.id !== dragData.id) {
                updateData.push( { "_id": sortedItems[i]._id, 'data.order': i });
            }
        }
        for (let i = index; i < sortedItems.length; i ++) {
            const item = sortedItems[i];
            if (item.id !== dragData.id) {
                updateData.push( { "_id": sortedItems[i]._id, 'data.order': i + 1 });
            }
        }
        this.actor.updateEmbeddedEntity("OwnedItem", updateData);
    }
}

export interface BWSettingData extends ActorSheetData {
    lifepaths: LifepathRootData[];
}