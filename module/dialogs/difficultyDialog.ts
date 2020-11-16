export class DifficultyDialog extends Application {
    difficulty: number;
    editable: boolean;
    constructor(defaultDifficulty: number) {
        super({
            template: "systems/burningwheel/templates/dialogs/gm-difficulty.hbs",
            classes: ["gm-difficulty"],
            popOut: false
        });
        this.difficulty = defaultDifficulty;
        this.editable = game.user.isGM;
    }

    activateListeners(html: JQuery): void {
        html.find("input.difficultyInput").on("input", (e) => {
            const input = e.currentTarget;
            const difficulty = parseInt($(input).val() as string);
            this.difficulty = difficulty;
            game.settings.set("burningwheel", "gmDifficulty", difficulty);
            game.socket.emit("system.burningwheel", { type: "difficulty", difficulty });
        });

        game.socket.on("system.burningwheel", ({ type, difficulty }) => {
            if (type === "difficulty") {
                this.difficulty = difficulty;
                this.render(true);
            }
        });
    }

    getData(): DifficultyDialogData {
        const data = super.getData() as DifficultyDialogData;
        data.difficulty = this.difficulty;
        data.editable = this.editable;
        return data;
    }
}

interface DifficultyDialogData {
    difficulty: number;
    editable: boolean;
}
