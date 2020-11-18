import { ArthaEarner, BWItem, BWItemData } from "./item.js";

export class Instinct extends BWItem {
    data: BWItemData & { data: InstinctData };
}

interface InstinctData extends ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
    text: string;
}