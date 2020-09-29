import { StringIndexedObject } from "module/helpers";

export class DuelOfWitsDialog extends Dialog {
    constructor(d: DialogData, o?: ApplicationOptions) {
        super(d, o);
        
        this.data.actionOptions = options;
        this.data.data.showV1 = this.data.data.showV1 || false;
        this.data.data.showV2 = this.data.data.showV2 || false;
        this.data.data.showV3 = this.data.data.showV3 || false;
        this.data.data.blindS1 = this.data.data.blindS1 || false;
        this.data.data.blindS2 = this.data.data.blindS2 || false;
    }

    get template(): string {
        return "systems/burningwheel/templates/dialogs/duel-of-wits.hbs";
    }

    data: {
        data: DuelOfWitsData;
        actionOptions: StringIndexedObject<string[]>;
    };

    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, { width: 600, height: 600, resizable: true }, { overwrite: true });
    }

    _getHeaderButtons(): { label: string, icon: string, class: string, onclick: (e: JQuery.ClickEvent) => void; }[] {
        let buttons = super._getHeaderButtons();
        if (game.user.isGM) {
            buttons = [{
                label: "Show",
                icon: "fas fa-eye",
                class: "force-show-dow",
                onclick: (_) => {
                    game.socket.emit("system.burningwheel", { type: "showDuel" });
                }
            }].concat(buttons);
        }
        return buttons;
    }

    activateListeners(html: JQuery): void {
        html.submit((e) => { e.preventDefault(); });
        html.find("input, select, textarea").on('change', (e) => this._propagateChange(e));
        html.find("button[data-action='reset-round']").on('click', (_) => this.clearRound());
        html.find("button[data-action='reset-everything']").on('click', (_) => this.clearEverything());
    }

    getData(): unknown {
        const data = Object.assign(super.getData(), this.data.data ) as DuelOfWitsData;
        const actors = game.actors.entities;
        data.actionOptions = this.data.actionOptions;

        data.side1Options = actors.filter(a => a._id !== data.side2ActorId);
        data.side2Options = actors.filter(a => a._id !== data.side1ActorId);

        data.actor1 = actors.find(a => a._id === data.side1ActorId);
        data.actor2 = actors.find(a => a._id === data.side2ActorId);

        data.side1ReadOnly = !data.actor1 || !data.actor1.owner;
        data.side2ReadOnly = !data.actor2 || !data.actor2.owner;

        data.gmView = game.user.isGM;

        data.showS1Select = (data.gmView && !data.blindS1) || (!data.side1ReadOnly && !data.gmView);
        data.showS2Select = (data.gmView && !data.blindS2) || (!data.side2ReadOnly && !data.gmView);

        data.showV1S1Card = data.showV1 || (data.gmView && !data.blindS1) || (!data.side1ReadOnly && !data.gmView);
        data.showV1S2Card = data.showV1 || (data.gmView && !data.blindS2) || (!data.side2ReadOnly && !data.gmView);
        data.showV2S1Card = data.showV2 || (data.gmView && !data.blindS1) || (!data.side1ReadOnly && !data.gmView);
        data.showV2S2Card = data.showV2 || (data.gmView && !data.blindS2) || (!data.side2ReadOnly && !data.gmView);
        data.showV3S1Card = data.showV3 || (data.gmView && !data.blindS1) || (!data.side1ReadOnly && !data.gmView);
        data.showV3S2Card = data.showV3 || (data.gmView && !data.blindS2) || (!data.side2ReadOnly && !data.gmView);
    
        return data;
    }

    private _propagateChange(e: JQuery.ChangeEvent): void {
        const newValue = e.target.type ==="checkbox" ? e.target.checked : e.target.value;
        const dataPath = e.target.name;
        
        const data = {};
        data[dataPath] = newValue;

        mergeObject(this.data.data, data);
        if (game.user.isGM) {
            game.settings.set("burningwheel", "dow-data", JSON.stringify(this.data.data));
        }
        game.socket.emit("system.burningwheel", { type: "updateDuel", data });
        this.render(true);
        e.target.focus();
    }

    async clearEverything(): Promise<void> {
        await this.clearRound();
        const data = this.data.data;
        data.blindS1 = false;
        data.blindS2 = false;
        data.boa1 = 0;
        data.boa1Max = 0;
        data.boa2 = 0;
        data.boa2Max = 0;
        data.side1ActorId = "";
        data.side2ActorId = "";
        data.statement1 = "";
        data.statement2 = "";

        await game.settings.set("burningwheel", "dow-data", JSON.stringify(this.data.data));
        game.socket.emit("system.burningwheel", { type: "updateDuel", data});
        this.render(true);
    }

    async clearRound(): Promise<void> {
        const data = this.data.data;
        data.v1s1 = "?";
        data.v1s2 = "?";
        data.v2s1 = "?";
        data.v2s2 = "?";
        data.v3s1 = "?";
        data.v3s2 = "?";

        data.showV1 = false;
        data.showV2 = false;
        data.showV3 = false;
        await game.settings.set("burningwheel", "dow-data", JSON.stringify(this.data.data));
        game.socket.emit("system.burningwheel", { type: "updateDuel", data});
        this.render(true);
    }

    activateSocketListeners(): void {
        game.socket.on("system.burningwheel", ({type, data}) => {
            if (type === "updateDuel") {
                mergeObject(this.data.data, data);
                if (game.user.isGM) {
                    game.settings.set("burningwheel", "dow-data", JSON.stringify(this.data.data));
                }
                if (this.rendered) { this.render(true); }
            } else if (type === "showDuel") {
                this.render(true);
            }
        });
    }

    static addSidebarControl(html: JQuery): void {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = "Duel of Wits";
        buttonElement.className = "dow-sidebar-button";
        buttonElement.onclick = () => game.burningwheel.dow.render(true);
        const combatHeader = $(html).find("header");
        combatHeader.prepend(buttonElement);
    }
}

interface DuelOfWitsData {
    side1ActorId: string;
    side2ActorId: string;
    boa1: number;
    boa2: number;
    boa1Max: number;
    boa2Max: number;
    statement1: string;
    statement2: string;
    actor1?: Actor;
    actor2?: Actor;

    side1Options: Actor[];
    side2Options: Actor[];
    side1ReadOnly: boolean;
    side2ReadOnly: boolean;
    gmView: boolean;

    showV1: boolean;
    showV2: boolean;
    showV3: boolean;

    blindS1: boolean;
    blindS2: boolean;

    v1s1: string;
    v1s2: string;
    v2s1: string;
    v2s2: string;
    v3s1: string;
    v3s2: string;

    showV1S1Card: boolean;
    showV1S2Card: boolean;
    showV2S1Card: boolean;
    showV2S2Card: boolean;
    showV3S1Card: boolean;
    showV3S2Card: boolean;
    showS1Select: boolean;
    showS2Select: boolean;

    actionOptions: StringIndexedObject<string[]>;
}

const options = {
    "Verbal Attack": [
        "Point", "Dismiss"
    ],
    "Verbal Defense": [
        "Avoid", "Obfuscate", "Rebuttal"
    ],
    "Verbal Special": [
        "Feint", "Incite"
    ],
    "Magic": [
        "Cast Spell", "Command Spirit", "Drop Spell", "Sing, Howl, Pray"
    ],
    "Hesitation": [
        "Fall Prone", "Run Screaming", "Stand & Drool", "Swoon"
    ]
};