import { BWItemSheet } from './bwItemSheet';

export class PropertySheet extends BWItemSheet {
    get template(): string {
        return 'systems/burningwheel/templates/items/property.hbs';
    }
}
