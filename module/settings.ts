import * as constants from "./constants.js";

export function registerSystemSettings(): void {
    game.settings.register(constants.systemName, constants.settings.version, {
        name: "Current World Version",
        scope: "world",
        config: false,
        type: String,
        default: "0.0.0"
    });
    game.settings.register(constants.systemName, constants.settings.duelData, {
        name: "Serialized Duel of Wits dialog data.",
        scope: "world",
        config: false,
        type: String,
        default: "{}"
    });
    game.settings.register(constants.systemName, constants.settings.fightData, {
        name: "Serialized Fight! dialog data.",
        scope: "world",
        config: false,
        type: String,
        default: "{}"
    });

    game.settings.register(constants.systemName, constants.settings.useGmDifficulty, {
        name: "Use GM set difficulty for tests.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => location.reload()
    });

    game.settings.register(constants.systemName, constants.settings.gmDifficulty, {
        name: "Persisted GM difficulty value",
        scope: "world",
        config: false,
        type: Number,
        default: 3
    });

    game.settings.register(constants.systemName, constants.settings.obstacleList, {
        name: "Persisted Obstacle Modifier List",
        scope: "world",
        config: false,
        type: String,
        default: "[]"
    });

    game.settings.register(constants.systemName, constants.settings.rangeData, {
        name: "Serialized Range and Cover dialog data.",
        scope: "world",
        config: false,
        type: String,
        default: "{}"
    });

    game.settings.register(constants.systemName, constants.settings.itemImages, {
        name: "Display Images in Item Sheet.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });
}
