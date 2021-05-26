import * as constants from "../../constants.js";
export class BWItemSheet extends ItemSheet<BWItemSheetData> {
    getData(): BWItemSheetData {
        const data = super.getData() as unknown as BWItemSheetData;
        data.showImage = game.settings.get(constants.systemName, constants.settings.itemImages) as boolean;
        return data;
    }

    static get defaultOptions(): BaseEntitySheet.Options {
        return mergeObject(super.defaultOptions, {
            classes:  ["bw-app"]
        });
    }
}

export interface BWItemSheetData extends ItemSheet.Data {
    showImage: boolean;
}