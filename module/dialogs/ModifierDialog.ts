import { BWActor } from "../actors/BWActor.js";
import { TestString } from "../helpers.js";
import * as constants from "../constants.js";

export class ModifierDialog extends Application {

    mods: {name: string, amount: number }[];
    help: HelpRecord[];
    editable: boolean;

    constructor(mods?: {name: string, amount: number}[], help?: HelpRecord[] ) {
        super({
            template: "systems/burningwheel/templates/dialogs/mods-and-help.hbs",
            popOut: false
        });

        this.mods = mods || [];
        this.help = help || [];
        this.editable = game.user.isGM;
    }

    addHelp({ dice, skillId, path, difficulty, title, actor }: AddHelpOptions): void {
        const entry: HelpRecord = {
            title,
            dice: dice >= 5 ? 2 : 1,
            skillId,
            path,
            difficulty,
            actorId: actor.id
        };
        this.help.push(entry);
        this.persistData();
        this.syncData();
    }

    activateListeners(html: JQuery): void {
        html.find('input[name="newMod"]').on('change', e => {
            const target = $(e.target);
            const name = target.val() as string;
            target.val("");
            this.mods.push({ name, amount: 0});
            this.render();
        });

        html.find('input.mod-name').on('change', e => {
            const target = $(e.target);
            const name = target.val() as string;
            const index = parseInt(e.target.dataset.index || "0");
            if (name) {
                this.mods[index].name = name;
            } else {
                this.mods.splice(index, 1);
            }
            this.persistData();
            this.syncData();
            this.render();
        });

        html.find('input.mod-amount').on('change', e => {
            const target = $(e.target);
            const amount = parseInt(target.val() as string) || 0;
            const index = parseInt(e.target.dataset.index || "0");
            this.mods[index].amount = amount;
            this.persistData();
            this.syncData();
            this.render();
        });

        game.socket.on(constants.socketName, ({type, mods}) => {
            if (type === "obstacleMods") {
                this.mods = mods;
                this.render(true);
            }
        });

        game.socket.on(constants.socketName, ({type, help}) => {
            if (type === "helpDice") {
                this.help = help;
                this.syncData();
                this.persistData();
                this.render(true);
            }
        });
    }
    
    persistData(): void {
        if (game.user.isGM) {
            game.settings.set(constants.systemName, constants.settings.obstacleList, JSON.stringify({ mods: this.mods, help: this.help }));
        }
        
    }

    syncData(): void {
        game.socket.emit(constants.socketName, { type: "obstacleMods", mods: this.mods });
    }

    getData(): DifficultyDialogData {
        const data = super.getData() as DifficultyDialogData;
        data.editable = this.editable;
        data.modifiers = this.mods;
        data.help = this.help;
        data.showHelp = !!this.mods.length;

        return data;
    }
}

interface DifficultyDialogData {
    editable: boolean;
    extendedTest: boolean;
    modifiers: { name: string; amount: number; }[];
    help: HelpRecord[];
    showHelp: boolean;
}

interface HelpRecord {
    title: string;
    path?: string;
    skillId?: string;
    difficulty: TestString;
    dice: number;
    actorId: string;
}

export interface AddHelpOptions {
    actor: BWActor,
    title: string,
    path?: string;
    skillId?: string,
    difficulty: TestString,
    dice: number
}
