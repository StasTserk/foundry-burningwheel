export class ExtendedTestDialog<T> extends Dialog {
    constructor(d: DialogData, o?: ApplicationOptions) {
        super(d, o);
        this.data.topic = "unknown";
        this.data.settingName = "";
    }

    data: ExtendedTestData<T>;

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.on('submit', (e) => { e.preventDefault(); });
    }

    propagateChange(e: JQuery.ChangeEvent): void {
        const newValue = e.target.type ==="checkbox" ? e.target.checked : e.target.value;
        const dataPath = e.target.name;
        
        const data = {};
        data[dataPath] = newValue;

        mergeObject(this.data.data, data);
        this.persistState(this.data.data);
        this.syncData(data);
        this.render(true);
        e.target.focus();
    }

    activateSocketListeners(): void {
        game.socket.on("system.burningwheel", ({type, data}) => {
            if (type === `update${this.data.topic}`) {
                mergeObject(this.data.data, data);
                this.persistState(this.data.data);
                if (this.rendered) { this.render(true); }
            } else if (type === `show${this.data.topic}`) {
                this.render(true);
            }
        });
    }

    _getHeaderButtons(): { label: string, icon: string, class: string, onclick: (e: JQuery.ClickEvent) => void; }[] {
        let buttons = super._getHeaderButtons();
        if (game.user.isGM) {
            buttons = [{
                label: "Show",
                icon: "fas fa-eye",
                class: "force-show-dow",
                onclick: (_) => {
                    game.socket.emit("system.burningwheel", { type: `show${this.data.topic}` });
                }
            }].concat(buttons);
        }
        return buttons;
    }

    syncData(data: Partial<T>): void {
        game.socket.emit("system.burningwheel", { type: `update${this.data.topic}`, data});
    }

    async persistState(data: Partial<T>): Promise<void> {
        if (game.user.isGM) {
            game.settings.set("burningwheel", this.data.settingName, JSON.stringify(data));
        }
    }
}

export interface ExtendedTestData<T> {
    settingName: string;
    topic: string;
    data: T;
}