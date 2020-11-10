export class DifficultyDialog extends Application {
    difficulty: number;
    editable: boolean;
    constructor(defaultDifficulty: number) {
        super({
            template: "systems/burningwheel/templates/dialogs/gmDifficulty.hbs",
            width: 150,
            height: 150,
            // left: window.innerWidth - 500,
            top: 600, //top: window.innerHeight - 150,
            resizable: false,
            minimizable: false,
            classes: ["gm-difficulty"],
            popOut: false
        });
        this.difficulty = defaultDifficulty;
        this.editable = game.user.isGM;
    }

    activateListeners(html: JQuery): void {
        html.find("input.difficultyInput").on("change", (e) => {
            const input = e.currentTarget;
            const difficulty = parseInt($(input).val() as string);
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