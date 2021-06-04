import { BWItem } from "../items/item.js";

export class BWSetting extends Actor<Actor.Data<SettingData>, BWItem> {
    async createEmbeddedDocuments(type: "Item" | "ActiveEffect", data: Partial<FoundryDocument.Data>[], options?: FoundryDocument.ModificationContext): Promise<FoundryDocument[]> {
        data = data.filter(i => i.type === "lifepath");
        return super.createEmbeddedDocuments(type, data, options);
    }
}

export interface SettingData {
    stock: string;
}