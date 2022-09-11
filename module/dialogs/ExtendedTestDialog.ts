import * as constants from "../constants.js";
import { gmOnly } from "../decorators.js";

export const changesState = (callback?: () => void): MethodDecorator => {
    return function (_target, _propertyKey, descriptor: PropertyDescriptor) {
        const functionCall = descriptor.value;
        descriptor.value = async function<T> (this: ExtendedTestDialog<T>, ...args) {
            await functionCall.apply(this, args);
            this.syncData(this.data);
            await this.persistState(this.data);
            this.render();
            await callback?.call(this);
        };
    };
};

export class ExtendedTestDialog<T> extends Dialog {
    constructor(d: Dialog.Data, o?: Dialog.Options) {
        super(d, o);
        this.data.topic = "unknown";
        this.data.settingName = "";
    }

    data: ExtendedTestData<T>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getData(): any {
        const data = Object.assign(super.getData(), this.data ) as T;
        return data;
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.on('submit', (e) => { e.preventDefault(); });
    }

    @changesState()
    propagateChange(e: JQuery.ChangeEvent): void {
        const newValue = e.target.type ==="checkbox" ? e.target.checked : e.target.value;
        const dataPath = e.target.name;
        
        const data = {};
        data[dataPath] = newValue;

        mergeObject(this.data, data);
    }

    
    @changesState() // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateCollection(e: JQuery.ChangeEvent, collection: any[]) : void {
        const index = parseInt(e.target.dataset.index || "0");
        const newValue = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        const dataPath = e.target.name;

        collection[index][dataPath] = newValue;
    }

    activateSocketListeners(): void {
        game.socket.on(constants.socketName, ({type, data}) => {
            if (type === `update${this.data.topic}`) {
                mergeObject(this.data, data);
                this.persistState(this.data);
                if (this.rendered) { this.render(true); }
            } else if (type === `show${this.data.topic}`) {
                this.render(true);
            }
        });
    }

    _getHeaderButtons(): Application.HeaderButton[] {
        let buttons = super._getHeaderButtons();
        const showAllButton: Application.HeaderButton = {
            label: "Show",
            icon: "fas fa-eye",
            class: "force-show-dow",
            onclick: () => {
                game.socket.emit(constants.socketName, { type: `show${this.data.topic}` });
            }
        };
        if (game.user?.isGM) {
            buttons = [showAllButton].concat(buttons);
        }
        return buttons;
    }

    syncData(data: Partial<T>): void {
        game.socket.emit(constants.socketName, { type: `update${this.data.topic}`, data});
    }

    @gmOnly
    async persistState(data: Partial<T>): Promise<void> {
        game.settings.set(constants.systemName, this.data.settingName, JSON.stringify(data));
    }
}

type ExtendedTestData<T> = Dialog.Data & T & {
    settingName: string;
    topic: string;
};