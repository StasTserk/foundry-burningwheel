import { ArthaEarner } from "./item.js";

export class Instinct extends Item {
    data: ItemData<InstinctData>;
}

interface InstinctData extends ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
    text: string;
}