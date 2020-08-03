import { ArthaEarner } from "./item.js";

export class Belief extends Item<BeliefData> {
    data: ItemData<BeliefData>;
}

interface BeliefData extends ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
    text: string;
}