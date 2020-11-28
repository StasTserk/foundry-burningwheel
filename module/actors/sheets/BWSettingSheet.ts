import { LifepathRootData } from "../../items/lifepath.js";
import { BWSetting } from "../BWSetting.js";

export class BWSettingSheet extends ActorSheet {
    get template(): string {
        return "systems/burningwheel/templates/setting-sheet.hbs";
    }
    get actor(): BWSetting {
        return super.actor as BWSetting;
    }

    getData(): BWSettingData {
        const data = super.getData() as BWSettingData;
        data.lifepaths = data.actor.items as unknown as LifepathRootData[];
        return data;
    }
}

export interface BWSettingData extends ActorSheetData {
    lifepaths: LifepathRootData[];
}