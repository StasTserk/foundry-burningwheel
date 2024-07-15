import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class ReputationSheet extends BWItemSheet {
    getData(): ReputationSheetData {
        const data = super.getData() as ReputationSheetData;
        data.diceOptions = {
            0: game.i18n.localize('BW.none'),
            1: `1${game.i18n.localize('BW.diceAcronym')}`,
            2: `3${game.i18n.localize('BW.diceAcronym')}`,
            3: `3${game.i18n.localize('BW.diceAcronym')}`,
        };
        return data;
    }
    static get defaultOptions(): BaseEntitySheet.Options {
        return super.defaultOptions;
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/reputation.hbs';
    }
}

type ReputationSheetData = BWItemSheetData & {
    diceOptions: Record<string, string>;
};
