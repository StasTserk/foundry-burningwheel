import { BWItem } from "../../items/item.js";
import { Lifepath, LifepathRootData } from "../../items/lifepath.js";
import { BWSetting, SettingData } from "../BWSetting.js";
import * as helpers from "../../helpers.js";

export class BWSettingSheet extends ActorSheet<BWSettingSheetData> {
    get template(): string {
        return "systems/burningwheel/templates/setting-sheet.hbs";
    }
    get actor(): BWSetting {
        return super.actor as BWSetting;
    }
    static get defaultOptions(): BaseEntitySheet.Options {
        return mergeObject(super.defaultOptions, {
            classes:  ["bw-app"],
            width: 600
        });
    }

    getData(): BWSettingSheetData {
        return {
            actor: this.actor,
            data: this.actor.data.data,
            lifepaths: (Array.from(this.actor.items.values()) as Lifepath[]).map(i => i.data).sort((a, b) => a.data.order - b.data.order),
            editable: this.isEditable
        };
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find('.lifepath[draggable="true"]').on('dragstart', (e) => {
            const actor = this.actor;
            const item = actor.items.get(e.target.dataset.id || "") as BWItem;
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
            this.actor.deleteEmbeddedDocuments("Item", [id]);
        });

        html.find('.lifepath').on('click', (e) => {
            const id = e.currentTarget.dataset.id || "";
            this.actor.items.get(id)?.sheet?.render(true);
        });

        const dropAreas = html.find('.drop-area').toArray().map(e => $(e));
        let activeDropArea: JQuery | undefined;
        let enterCount = 0;
        html.find('.lifepath-list').on('dragover', evt => {
            const yPos = evt.pageY || 0;
            if (activeDropArea) {
                const topLimit = (activeDropArea.offset()?.top || 0) - 30;
                const bottomLimit = (activeDropArea.offset()?.top || 0) + (activeDropArea.height() || 0) + 30;
                if (yPos < topLimit || yPos > bottomLimit) {
                    activeDropArea.removeClass("show-drop");
                    activeDropArea = undefined;
                }
            } else {
                for (const area of dropAreas) {
                    const top = area.offset()?.top || 0;
                    const topLimit = top - 20;
                    const bottomLimit = top + 20;
                    if (yPos <= bottomLimit && yPos >= topLimit) {
                        activeDropArea = $(area);
                        activeDropArea.addClass("show-drop");
                        return;
                    }
                }
            }
        }).on('dragenter', _ => {
            enterCount ++;
        }).on('dragleave', _ => {
            enterCount --;
            if (!enterCount) {
                activeDropArea?.removeClass("show-drop");
                activeDropArea = undefined;
            }
        }).on('drop', ev => {
            enterCount = 0;
            if (activeDropArea) {
                ev.stopPropagation();
                const index = parseInt(activeDropArea.data("index") || "0");
                const event = ev.originalEvent;
                if (event) {
                    this.insertItemAtIndex(event, index);
                }

                activeDropArea?.removeClass("show-drop");
                activeDropArea = undefined;
            }
        });
    }

    async insertItemAtIndex(event: DragEvent, index: number): Promise<void> {
        let dragData: helpers.DragData;
        try {
            dragData = JSON.parse(event.dataTransfer?.getData('text/plain') || "");
        }
        catch (err) {
            console.error(err);
            return;
        }
        
        if (dragData.type !== "Item") {
            return;
        }

        const sortedItems = (Array.from(this.actor.items.values()) as Lifepath[]).sort((a, b) => a.data.data.order - b.data.data.order);
        if (dragData.actorId === this.actor.id) {
            // we need to just update the index of the entry
            const item = this.actor.items.get(dragData.id || "") as Lifepath;
            await item.update({ "data.order": index }, {});
        } else {
            // we need to get the item data and add it to the setting sheet
            let itemData: LifepathRootData | undefined;
            if (dragData.data) {
                itemData = dragData.data as LifepathRootData;
            } else if (dragData.pack) {
                itemData = (await (game.packs?.find(p => p.collection === dragData.pack) as Compendium).getEntity(dragData.id || ""))?.data as LifepathRootData;
            } else if (dragData.actorId) {
                itemData = (game.actors?.find((a: FoundryDocument) => a.id === dragData.actorId))?.items.get(dragData.id || "")?.data as LifepathRootData;
            } else {
                itemData = game.items?.find((i: BWItem) => i.id === dragData.id)?.data as LifepathRootData;
            }

            // if our item is actually a lifepath we need to add it, otherwise abort.
            if (itemData.type === "lifepath") {
                itemData.data.order = index;
                await this.actor.createEmbeddedDocuments("Item", [itemData]);
            } else {
                return;
            }
        }

        const updateData: Record<string, string | number>[] = [];

        for(let i = 0; i < index; i ++) {
            const item = sortedItems[i];
            if (item.id !== dragData.id) {
                updateData.push( { "id": sortedItems[i].id, 'data.order': i });
            }
        }
        for (let i = index; i < sortedItems.length; i ++) {
            const item = sortedItems[i];
            if (item.id !== dragData.id) {
                updateData.push( { "id": sortedItems[i].id, 'data.order': i + 1 });
            }
        }
        this.actor.updateEmbeddedEntity("OwnedItem", updateData);
    }
}

export interface BWSettingSheetData {
    actor: BWSetting;
    data: SettingData;
    lifepaths: LifepathRootData[];
    editable: boolean;
}