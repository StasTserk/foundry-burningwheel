import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class RelationshipSheet extends BWItemSheet {
    static get defaultOptions(): BaseEntitySheet.Options {
        return super.defaultOptions;
    }

    getData(): RelationshipSheetData {
        const data = super.getData() as RelationshipSheetData;
        data.influenceOptions = {
            minor: 'BW.relationship.minor',
            significant: 'BW.relationship.significant',
            powerful: 'BW.relationship.powerful',
        };
        return data;
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/relationship.hbs';
    }
}

type RelationshipSheetData = BWItemSheetData & {
    influenceOptions: Record<string, string>;
};
