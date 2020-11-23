import * as constants from "../../constants.js";
export class BWItemSheet extends ItemSheet {
    getData(): BWItemSheetData {
        const data = super.getData() as BWItemSheetData;
        data.showImage = game.settings.get(constants.systemName, constants.settings.itemImages);
        return data;
    }
}

export interface BWItemSheetData extends ItemSheetData {
    showImage: boolean;
}