import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class InstinctSheet extends BWItemSheet {
    getData(): BWItemSheetData {
        const data = super.getData();
        return data;
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/instinct.hbs';
    }
}
