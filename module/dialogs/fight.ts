import { StringIndexedObject } from "../helpers.js";

export class FightDialog extends Dialog {
    constructor(d: DialogData, o?: ApplicationOptions) {
        super(d, o);
    }

    data: {
        data: FightDialogData;
        actionOptions: StringIndexedObject<string[]>;
    };

    get template(): string {
        return "systems/burningwheel/templates/dialogs/fight.hbs";
    }

    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, { width: 1000, height: 600, resizable: true }, { overwrite: true });
    }

    _getHeaderButtons(): { label: string, icon: string, class: string, onclick: (e: JQuery.ClickEvent) => void; }[] {
        let buttons = super._getHeaderButtons();
        if (game.user.isGM) {
            buttons = [{
                label: "Show",
                icon: "fas fa-eye",
                class: "force-show-fight",
                onclick: (_) => {
                    game.socket.emit("system.burningwheel", { type: "showFight" });
                }
            }].concat(buttons);
        }
        return buttons;
    }

    static addSidebarControl(html: JQuery): void {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = "Fight";
        buttonElement.className = "fight-sidebar-button";
        buttonElement.onclick = () => game.burningwheel.fight.render(true);
        const combatHeader = $(html).find("header");
        combatHeader.prepend(buttonElement);
    }

    // private _propagateChange(e: JQuery.ChangeEvent): void {
    //     const newValue = e.target.type ==="checkbox" ? e.target.checked : e.target.value;
    //     const dataPath = e.target.name;
        
    //     const data = {};
    //     data[dataPath] = newValue;

    //     mergeObject(this.data.data, data);
    //     if (game.user.isGM) {
    //         game.settings.set("burningwheel", "fight-data", JSON.stringify(this.data.data));
    //     }
    //     game.socket.emit("system.burningwheel", { type: "updateFight", data });
    //     this.render(true);
    //     e.target.focus();
    // }

    activateSocketListeners(): void {
        game.socket.on("system.burningwheel", ({type, data}) => {
            if (type === "updateFight") {
                mergeObject(this.data.data, data);
                if (game.user.isGM) {
                    game.settings.set("burningwheel", "fight-data", JSON.stringify(this.data.data));
                }
                if (this.rendered) { this.render(true); }
            } else if (type === "showFight") {
                this.render(true);
            }
        });
    }
}

export interface FightDialogData {
    participantIds: string[];
}