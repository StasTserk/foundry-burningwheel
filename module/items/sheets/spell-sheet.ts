import { spellLengthSelect } from '../../constants';
import { StringIndexedObject } from '../../helpers';
import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class SpellSheet extends BWItemSheet {
    static get defaultOptions(): BaseEntitySheet.Options {
        return mergeObject(super.defaultOptions, {});
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/spell.hbs';
    }

    getData(): TraitSheetData {
        const data = super.getData() as TraitSheetData;
        data.spellLengths = spellLengthSelect;
        return data;
    }
}

interface TraitSheetData extends BWItemSheetData {
    spellLengths: StringIndexedObject<string>;
}
