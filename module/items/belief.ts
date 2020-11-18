import { ArthaEarner, BWItemData } from "./item.js";

export class Belief extends Item<BeliefData> {
    data: BWItemData & { data: BeliefData };
}

interface BeliefData extends ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
    text: string;
}