import { DuelOfWitsDialog } from "./DuelOfWitsDialog.js";
import { FightDialog } from "./FightDialog.js";
import { RangeAndCoverDialog } from "./RangeAndCoverDialog.js";
import * as constants from "../constants.js";
import { DifficultyDialog } from "./DifficultyDialog.js";
import { ModifierDialog } from "./ModifierDialog.js";

export * from "./buildHelpDialog.js";
export * from "./CharacterBurnerDialog.js";
export * from "./DifficultyDialog.js";
export * from "./DuelOfWitsDialog.js";
export * from "./FightDialog.js";
export * from "./ModifierDialog.js";
export * from "./RangeAndCoverDialog.js";

export async function initializeExtendedTestDialogs(): Promise<void> {
    let dowData = {};
    let fightData = {};
    let rncData = {};
    try {
        dowData = await JSON.parse(game.settings.get(constants.systemName, constants.settings.duelData));
    } catch (err) {
        ui.notifications.warn("Error parsing serialized Duel of Wits data");
        console.log(err);
    }
    try {
        fightData = await JSON.parse(game.settings.get(constants.systemName, constants.settings.fightData));
    } catch (err) {
        ui.notifications.warn("Error parsing serialized Fight data");
        console.log(err);
    }
    try {
        rncData = await JSON.parse(game.settings.get(constants.systemName, constants.settings.rangeData));
    } catch (err) {
        ui.notifications.warn("Error parsing serialized Range and Cover data");
        console.log(err);
    }
    
    game.burningwheel.dow = new DuelOfWitsDialog({
        title: "Duel of Wits",
        buttons: {},
        data: dowData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    game.burningwheel.dow.activateSocketListeners();

    game.burningwheel.fight = new FightDialog({
        title: "Fight!",
        buttons: {},
        data: fightData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    game.burningwheel.fight.activateSocketListeners();

    game.burningwheel.rangeAndCover = new RangeAndCoverDialog({
        title: "Range and Cover",
        buttons: {},
        data: rncData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    game.burningwheel.rangeAndCover.activateSocketListeners();
}

export async function initializeRollPanels(): Promise<void> {
    game.burningwheel.useGmDifficulty = await game.settings.get(constants.systemName, constants.settings.useGmDifficulty);
    if (game.burningwheel.useGmDifficulty) {
        const difficulty = await game.settings.get(constants.systemName, constants.settings.gmDifficulty);
        const testData = await JSON.parse(game.settings.get(constants.systemName, constants.settings.extendedTestData));
        game.burningwheel.gmDifficulty = new DifficultyDialog(difficulty, testData);
        game.burningwheel.gmDifficulty.activateSocketListeners();
        game.burningwheel.gmDifficulty.render(true);
    }

    let modData = { mods: undefined, help: undefined };
    try {
        modData = await JSON.parse(game.settings.get(constants.systemName, constants.settings.obstacleList));
    } catch (err) {
        ui.notifications.warn("Error parsing serialized Modifier data");
        console.log(err);
    }
    game.burningwheel.modifiers = new ModifierDialog(game.burningwheel.useGmDifficulty, modData.mods, modData.help);
    game.burningwheel.modifiers.activateSocketListeners();
    game.burningwheel.modifiers.render(true);
}

Hooks.on("renderSidebarTab", async (_data, html: JQuery) => {
    if (html.prop("id") === "combat") { // this is the combat tab
        DuelOfWitsDialog.addSidebarControl(html);
        FightDialog.addSidebarControl(html);
        RangeAndCoverDialog.addSidebarControl(html);
    }
});