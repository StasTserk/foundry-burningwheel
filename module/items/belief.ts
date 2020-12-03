import { ArthaEarner, BWItem, BWItemData } from "./item.js";

export class Belief extends BWItem {
    data: BWItemData & { data: BeliefData };
}

interface BeliefData extends ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
    text: string;
}