import { BWActor } from "../bwactor.js";
import { ItemType, BWItem } from "../items/item.js";
import * as helpers from "../helpers.js";

export async function addNewItem(options: AddItemOptions): Promise<Application> {
    if (!options.itemType && !options.itemTypes) {
        throw Error("Must provide one or more item types when adding new items");
    }
    if (options.itemType && !options.itemTypes) {
        options.itemTypes = [ options.itemType ];
    }

    const actor = options.actor;
    const loadExistingCallback = async (_html) => {
        // cache the current list of skills since it'll be used after for the actual skill data
        const items = (await helpers.getItemsOfTypes(options.itemTypes as ItemType[]))
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
                        const newItems = dialogHtml.find('input:checked')
                            .map((_, element: HTMLInputElement) => {
                                const itemRoot = (items.find((s: BWItem) => s._id === element.value) as BWItem).data;
                                Object.assign(itemRoot.data, options.forcedData);
                                return itemRoot;
                            }).toArray();
                        actor.createOwnedItem(newItems);
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

    const makeNewButtons: Record<string, DialogButton> = {};
    
    options.itemTypes?.forEach((i) => {
        makeNewButtons[i] = {
            label: `Make new ${i}`,
            callback: async () => {
                const item = await actor.createOwnedItem({
                    name: `New ${i}`,
                    type: i,
                    data: options.baseData
                });
                return actor.getOwnedItem(item._id)?.sheet.render(true);
            }
        };
    });
    makeNewButtons.loadExisting = {
        label: `Import existing ${options.itemType || "item"}`,
        callback: (html) => loadExistingCallback(html)
    };

    return new Dialog({
        title: options.searchTitle,
        content: options.popupMessage,
        buttons: makeNewButtons
    }
    , { classes: ["dialog", "import-dialog"]}
    ).render(true);
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
    itemType?: ItemType;
    itemTypes?: ItemType[];
    itemDataLeft: (item: Item) => string;
    itemDataMid: (item: Item) => string;
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