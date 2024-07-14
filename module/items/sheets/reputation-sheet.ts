import { BWItemSheet } from './bwItemSheet';

export class ReputationSheet extends BWItemSheet {
    static get defaultOptions(): BaseEntitySheet.Options {
        return super.defaultOptions;
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/reputation.hbs';
    }
}
