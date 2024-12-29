import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class AffiliationSheet extends BWItemSheet {
    get template(): string {
        return 'systems/burningwheel/templates/items/affiliation.hbs';
    }

    getData(): BWItemSheetData & {
        affiliationOptions: Record<number, string>;
    } {
        const data = super.getData() as BWItemSheetData & {
            affiliationOptions: Record<number, string>;
        };
        data.affiliationOptions = {
            0: game.i18n.localize('BW.none'),
            1: `1${game.i18n.localize('BW.diceAcronym')}`,
            2: `2${game.i18n.localize('BW.diceAcronym')}`,
            3: `3${game.i18n.localize('BW.diceAcronym')}`,
        };
        return data;
    }
}
