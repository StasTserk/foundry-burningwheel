import * as constants from '../../constants';
import { BWItem } from '../item';
export class BWItemSheet<
    SD extends BWItemSheetData = BWItemSheetData,
    ID extends BWItem = BWItem
> extends ItemSheet<SD, ID> {
    getData(): SD {
        const data = {
            showImage: game.settings.get(
                constants.systemName,
                constants.settings.itemImages
            ) as boolean,
            system: this.item.system,
            item: this.item,
        };
        return data as unknown as SD;
    }

    static get defaultOptions(): BaseEntitySheet.Options {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['bw-app'],
        });
    }
}

export interface BWItemSheetData<T = Item.Data['data']> {
    showImage: boolean;
    data: T;
    item: BWItem;
}
