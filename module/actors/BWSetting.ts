import { BWItem } from "../items/item.js";
// import { NewItemData } from "./BWActor.js";

export class BWSetting extends Actor<Actor.Data<SettingData>, BWItem> {
    // async createOwnedItem(itemData: NewItemData | NewItemData[], options?: Record<string, unknown>): Promise<BWItem> {
    //     // we only add lifepaths to setting actors. They are not meant to hold other actor data.
    //     if (Array.isArray(itemData)) {
    //         itemData = itemData.filter(id => id.type === "lifepath");
    //         return super.createOwnedItem(itemData, options) as Promise<BWItem>;
    //     }
    //     if (itemData.type === "lifepath") {
    //         return super.createOwnedItem(itemData, options) as Promise<BWItem>;
    //     }
    //     return super.createOwnedItem([], options) as Promise<BWItem>;
    // }

    // // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    // async createEmbeddedEntity(entityType: string, data: NewItemData | NewItemData[], options?: any): Promise<this> {
    //     if (Array.isArray(data)) {
    //         data = data.filter(id => id.type === "lifepath");
    //         return super.createEmbeddedEntity(entityType, data, options);
    //     }
    //     // we only add lifepaths to setting actors. They are not meant to hold other actor data.
    //     if (data.type === 'lifepath') {
    //         if ((!options || !options.keepOrder) && data.data) {
    //             data.data.order = Array.from(this.items.values()).length;
    //         }
    //         return super.createEmbeddedEntity(entityType, data, options);
    //     }
    //     return super.createEmbeddedEntity(entityType, [], options);
    // }
}

export interface SettingData {
    stock: string;
}