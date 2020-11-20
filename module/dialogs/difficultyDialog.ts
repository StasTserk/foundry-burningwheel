export class DifficultyDialog extends Application {
    difficulty: number;
    editable: boolean;
    splitPool: boolean;
    customDiff: boolean;
    noTrack: boolean;
    mods: {name: string, amount: number }[];
    constructor(defaultDifficulty: number, mods?: {name: string, amount: number}[] ) {
        super({
            template: "systems/burningwheel/templates/dialogs/gm-difficulty.hbs",
            classes: ["gm-difficulty"],
            popOut: false
        });
        this.difficulty = defaultDifficulty;
        this.editable = game.user.isGM;

        this.splitPool = this.customDiff = this.noTrack = false;
        this.mods = mods || [];
    }

    activateListeners(html: JQuery): void {
        html.find("input.difficultyInput").on("input", (e) => {
            const input = e.currentTarget;
            const difficulty = parseInt($(input).val() as string);
            this.difficulty = difficulty;
            game.settings.set("burningwheel", "gmDifficulty", difficulty);
            game.socket.emit("system.burningwheel", { type: "difficulty", difficulty });
        });
        
        html.find("#gm-diff-sp").on('change', e => {
            this.splitPool = $(e.target).prop("checked") as boolean;
        });
        html.find("#gm-diff-custom").on('change', e => {
            this.customDiff = $(e.target).prop("checked") as boolean;
        });
        html.find("#gm-diff-track").on('change', e => {
            this.noTrack = $(e.target).prop("checked") as boolean;
        });

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

        game.socket.on("system.burningwheel", ({ type, difficulty }) => {
            if (type === "difficulty") {
                this.difficulty = difficulty;
                this.render(true);
            }
        });
        game.socket.on("system.burningwheel", ({type, mods}) => {
            if (type === "obstacleMods") {
                this.mods = mods;
                this.render(true);
            }
        });
    }
    
    persistMods(): void {
        game.settings.set("burningwheel", "obstacleList", JSON.stringify(this.mods));
        game.socket.emit("system.burningwheel", { type: "obstacleMods", mods: this.mods });
    }

    getData(): DifficultyDialogData {
        const data = super.getData() as DifficultyDialogData;
        data.difficulty = this.difficulty;
        data.editable = this.editable;
        data.splitPool = this.splitPool;
        data.noTrack = this.noTrack;
        data.customDiff = this.customDiff;
        data.modifiers = this.mods;
        return data;
    }
}

interface DifficultyDialogData {
    modifiers: { name: string; amount: number; }[];
    customDiff: boolean;
    noTrack: boolean;
    splitPool: boolean;
    difficulty: number;
    editable: boolean;
}
