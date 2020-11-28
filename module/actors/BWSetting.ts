import { BWItem } from "../items/item.js";
import { NewItemData } from "./BWActor.js";

export class BWSetting extends Actor<SettingData> {
    async createOwnedItem(itemData: NewItemData | NewItemData[], options?: Record<string, unknown>): Promise<BWItem> {
        // we only add lifepaths to setting actors. They are not meant to hold other actor data.
        if (Array.isArray(itemData)) {
            itemData = itemData.filter(id => id.type === "lifepath");
            return super.createOwnedItem(itemData, options) as Promise<BWItem>;
        }
        if (itemData.type !== "lifepath") {
            return super.createOwnedItem(itemData) as Promise<BWItem>;
        }
        return super.createOwnedItem([], options) as Promise<BWItem>;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async createEmbeddedEntity(entityType: string, data: NewItemData, options?: any): Promise<this> {
        // we only add lifepaths to setting actors. They are not meant to hold other actor data.
        if (data.type === 'lifepath') {
            return super.createEmbeddedEntity(entityType, data, options);
        }
        return this;
    }
}

export interface SettingData {
    stock: string;
}