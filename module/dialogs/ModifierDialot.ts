import { BWActor } from "../actors/BWActor.js";
import { TestString } from "../helpers.js";
import { Skill } from "../items/skill.js";
import * as constants from "../constants.js";
import { DifficultyDialog } from "./DifficultyDialog.js";

export class ModifierDialog extends Application {

    mods: {name: string, amount: number }[];
    help: HelpRecord[];
    editable: boolean;

    constructor(diff: DifficultyDialog, mods?: {name: string, amount: number}[], help?: HelpRecord[] ) {
        super({
            template: "systems/burningwheel/templates/dialogs/mods-and-help.hbs",
            popOut: false
        });

        this.mods = mods || [];
        this.help = help || [];
        this.editable = game.user.isGM;
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
            this.persistMods();
            this.render();
        });

        html.find('input.mod-amount').on('change', e => {
            const target = $(e.target);
            const amount = parseInt(target.val() as string) || 0;
            const index = parseInt(e.target.dataset.index || "0");
            this.mods[index].amount = amount;
            this.persistMods();
            this.render();
        });

        game.socket.on(constants.socketName, ({type, mods}) => {
            if (type === "obstacleMods") {
                this.mods = mods;
                this.render(true);
            }
        });
    }
    
    persistMods(): void {
        game.settings.set(constants.systemName, constants.settings.obstacleList, JSON.stringify({ mods: this.mods, help: this.help }));
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
    difficulty: "R" | "D" | "C";
    dice: number;
}

export interface AddDeferredTestOptions {
    actor: BWActor,
    name: string,
    path?: string;
    skill?: Skill,
    difficulty: TestString
}
