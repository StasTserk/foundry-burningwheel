import { BWItemSheet, BWItemSheetData } from "./bwItemSheet";

export class BeliefSheet extends BWItemSheet {
    getData(): BWItemSheetData {
        const data = super.getData();
        return data;
    }

    get template(): string {
        return "systems/burningwheel/templates/items/belief.hbs";
    }
}