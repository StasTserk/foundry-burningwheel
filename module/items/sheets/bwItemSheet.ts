import * as constants from "../../constants.js";
import { BWItem } from "../item.js";
export class BWItemSheet extends ItemSheet<BWItemSheetData, BWItem> {
    getData(): BWItemSheetData {
        const data = {
            showImage: game.settings.get(constants.systemName, constants.settings.itemImages) as boolean,
            data: this.item.data.data,
            item: this.item
        };
        return data;
    }

    static get defaultOptions(): BaseEntitySheet.Options {
        return mergeObject(super.defaultOptions, {
            classes:  ["bw-app"]
        });
    }
}

export interface BWItemSheetData<T = Item.Data['data']> {
    showImage: boolean;
    data: T;
    item: BWItem;
}