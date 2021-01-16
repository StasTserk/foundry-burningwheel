import { BWItemSheet } from './bwItemSheet.js';

export class AffiliationSheet extends BWItemSheet {
    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {});
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/affiliation.hbs';
    }
}
