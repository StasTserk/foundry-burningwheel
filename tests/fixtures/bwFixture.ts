import { test as testLoggedOut, testAsGm as testLoggedIn } from './gameFixture';
import { CharacterFixture } from './parts/CharacterFixture';
import { DoWDialog } from './parts/DoWDialog';
import { FightDialog } from './parts/FightDialog';
import { RangeAndCoverDialog } from './parts/RangeAndCoverDialog';
import { RollDialog } from './parts/RollDialog';

export type FixtureBase = typeof testLoggedOut & typeof testLoggedIn;

type BwFixture = {
    dowDialog: DoWDialog;
    fightDialog: FightDialog;
    rncDialog: RangeAndCoverDialog;
    rollDialog: RollDialog;
    char: CharacterFixture;
};

const extender: Parameters<typeof testLoggedIn.extend<BwFixture>>[0] = {
    dowDialog: async ({ page, gamePage }, use) =>
        await use(new DoWDialog(page, gamePage, test)),
    fightDialog: async ({ page, gamePage }, use) =>
        await use(new FightDialog(page, gamePage, test)),
    rollDialog: async ({ page }, use) => await use(new RollDialog(page)),
    rncDialog: async ({ page, gamePage }, use) =>
        await use(new RangeAndCoverDialog(page, gamePage, test)),
    char: async ({ page, gamePage }, use) =>
        await use(new CharacterFixture(page, gamePage, test)),
};

export const test = testLoggedOut.extend<BwFixture>(extender);
export const testAsGm = testLoggedIn.extend<BwFixture>(extender);
