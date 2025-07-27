import { DuelOfWitsDialog } from './DuelOfWitsDialog';
import { FightDialog } from './FightDialog';
import { RangeAndCoverDialog } from './RangeAndCoverDialog';
import * as constants from '../constants';
import { DifficultyDialog } from './DifficultyDialog';
import { ModifierDialog } from './ModifierDialog';
import { TypeMissing } from '../../types/index';

export * from './buildHelpDialog';
export * from './CharacterBurnerDialog';
export * from './DifficultyDialog';
export * from './DuelOfWitsDialog';
export * from './FightDialog';
export * from './ModifierDialog';
export * from './RangeAndCoverDialog';

export async function initializeExtendedTestDialogs(): Promise<void> {
    let dowData = {};
    let fightData = {};
    let rncData = {};
    try {
        dowData = await JSON.parse(
            game.settings.get(
                constants.systemName,
                constants.settings.duelData
            ) as string
        );
    } catch (err) {
        ui.notifications?.warn('Error parsing serialized Duel of Wits data');
        console.error(err);
    }
    try {
        fightData = await JSON.parse(
            game.settings.get(
                constants.systemName,
                constants.settings.fightData
            ) as string
        );
    } catch (err) {
        ui.notifications?.warn('Error parsing serialized Fight data');
        console.error(err);
    }
    try {
        rncData = await JSON.parse(
            game.settings.get(
                constants.systemName,
                constants.settings.rangeData
            ) as string
        );
    } catch (err) {
        ui.notifications?.warn('Error parsing serialized Range and Cover data');
        console.error(err);
    }

    game.burningwheel.dow = new DuelOfWitsDialog({
        title: 'Duel of Wits',
        buttons: {},
        data: dowData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    game.burningwheel.dow.activateSocketListeners();

    game.burningwheel.fight = new FightDialog({
        title: 'Fight!',
        buttons: {},
        data: fightData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    game.burningwheel.fight.activateSocketListeners();

    game.burningwheel.rangeAndCover = new RangeAndCoverDialog({
        title: 'Range and Cover',
        buttons: {},
        data: rncData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    game.burningwheel.rangeAndCover.activateSocketListeners();
}

export async function initializeRollPanels(): Promise<void> {
    game.burningwheel.useGmDifficulty = (await game.settings.get(
        constants.systemName,
        constants.settings.useGmDifficulty
    )) as boolean;
    const difficulty = (await game.settings.get(
        constants.systemName,
        constants.settings.gmDifficulty
    )) as number;
    const testData = await JSON.parse(
        game.settings.get(
            constants.systemName,
            constants.settings.extendedTestData
        ) as string
    );
    game.burningwheel.gmDifficulty = new DifficultyDialog(
        difficulty,
        game.burningwheel.useGmDifficulty,
        testData
    );
    game.burningwheel.gmDifficulty.activateSocketListeners();
    game.burningwheel.gmDifficulty.render(true);

    let modData = { mods: undefined, help: undefined };
    try {
        modData = await JSON.parse(
            game.settings.get(
                constants.systemName,
                constants.settings.obstacleList
            ) as string
        );
    } catch (err) {
        ui.notifications?.warn('Error parsing serialized Modifier data');
        console.error(err);
    }
    game.burningwheel.modifiers = new ModifierDialog(
        modData.mods,
        modData.help
    );
    game.burningwheel.modifiers.activateSocketListeners();
    game.burningwheel.modifiers.render(true);
}

Hooks.on(
    'renderAbstractSidebarTab',
    async (data: TypeMissing, html: JQuery) => {
        if (data.id === 'combat') {
            // this is the combat tab
            DuelOfWitsDialog.addSidebarControl(html);
            FightDialog.addSidebarControl(html);
            RangeAndCoverDialog.addSidebarControl(html);
        }
    }
);
