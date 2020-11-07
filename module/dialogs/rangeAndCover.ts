import { ExtendedTestData, ExtendedTestDialog } from "./extendedTestDialog.js";

export class RandAndCoverDialog extends ExtendedTestDialog<RangeAndCoverData> {
    constructor(d: DialogData, o?: ApplicationOptions) {
        super(d, o);
        this.data.topic = "range-and-cover";
        this.data.settingName = "rnc-data";
    }
    data: ExtendedTestData<RangeAndCoverData>;

    get template(): string {
        return "systems/burningwheel/templates/dialogs/range-and-cover.hbs";
    }

    activateSocketListeners(): void {
        super.activateSocketListeners();
    }

    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {
            width: 1000,
            height: 600,
            resizable: true,
            classes: [ "fight" ]
        }, { overwrite: true });
    }

    static addSidebarControl(html: JQuery): void {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = "Range and Cover";
        buttonElement.className = "rnc-sidebar-button";
        buttonElement.onclick = () => game.burningwheel.rangeAndCover.render(true);
        const combatHeader = $(html).find("header");
        combatHeader.prepend(buttonElement);
    }
}

interface RangeAndCoverData {
    teams: unknown[];
}

