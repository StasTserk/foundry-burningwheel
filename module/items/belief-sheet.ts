import { Belief } from "./belief.js";

export class BeliefSheet extends ItemSheet {
    getData() {
        const data = super.getData();
        (data.item as Belief).updateProperties();
        return data;
    }
}