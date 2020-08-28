import { BWActor } from "../actor.js";
import { ItemType, BWItem } from "../items/item.js";
import * as helpers from "../helpers.js";

export async function addNewItem(options: AddItemOptions): Promise<Application> {
    const actor = options.actor;
    const loadExistingCallback = async (_html) => {
        // cache the current list of skills since it'll be used after for the actual skill data
        const items = (await helpers.getItemsOfType(options.itemType))
            .sort((a, b) => a.name < b.name ? -1 : (a.name === b.name ? 0 : 1));
        
        const html = await renderTemplate("systems/burningwheel/templates/dialogs/new-item-dialog.hbs", { items: items.map((i) => ItemToRowData(i, options)) });
        const dialog = new Dialog({
            id: 'import-item',
            title: options.searchTitle,
            content: html,
            buttons: {
                add: {
                    label: "Add",
                    callback: (dialogHtml: JQuery) => {
                        dialogHtml.find('input:checked')
                            .each((_, element: HTMLInputElement) => {
                                const itemRoot = (items.find((s: BWItem) => s._id === element.value) as BWItem).data;
                                Object.assign(itemRoot.data, options.forcedData);
                                actor.createOwnedItem(itemRoot, {});
                            });
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            }
        } as DialogData & { id: string },
        { width: 530 });
        dialog.render(true);
    };

    return new Dialog({
        title: options.searchTitle,
        content: options.popupMessage,
        buttons: {
            makeNew: {
                label: `Make new ${options.itemType}`,
                callback: async () => {
                    const i = await actor.createOwnedItem({
                        name: `New ${options.itemType}`,
                        type: options.itemType,
                        data: options.baseData
                    });
                    return actor.getOwnedItem(i._id)?.sheet.render(true);
                }
            },
            loadExisting: {
                label: `Import existing ${options.itemType}`,
                callback: (html) => loadExistingCallback(html)
            }
        }
    }).render(true);
}

function ItemToRowData(item: BWItem & { itemSource?: string }, options: AddItemOptions): ItemRowData {
    return {
        name: item.name,
        itemDataLeft: options.itemDataLeft(item),
        itemDataMid: options.itemDataMid(item),
        itemSource: item.itemSource || "World",
        id: item.id
    };
}

interface AddItemOptions {
    actor: BWActor;
    searchTitle: string;
    itemType: ItemType;
    itemDataLeft: (item: BWItem) => string;
    itemDataMid: (item: BWItem) => string;
    baseData: helpers.StringIndexedObject<string | number | boolean>;
    forcedData?: helpers.StringIndexedObject<string | number | boolean>;
    popupMessage?: string;
}

interface ItemRowData {
    name: string;
    id: string;
    itemDataLeft: string;
    itemDataMid: string;
    itemSource?: string;
}