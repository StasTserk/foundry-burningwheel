import { test as testLoggedOut, testAsGm as testLoggedIn } from './gameFixture';
import { AffiliationFixture } from './parts/AffiliationFixture';
import { ArmorFixture } from './parts/ArmorFixture';
import { BeliefFixture } from './parts/BeliefFixture';
import { CharacterFixture } from './parts/CharacterFixture';
import { DoWDialog } from './parts/DoWDialog';
import { FightDialog } from './parts/FightDialog';
import { InstinctFixture } from './parts/InstinctFixture';
import { LifepathFixture } from './parts/LifepathFixture';
import { MeleeWeaponFixture } from './parts/MeleeWeaponFixture';
import { PossessionFixture } from './parts/PossessionFixture';
import { PropertyFixture } from './parts/PropertyFixture';
import { RangeAndCoverDialog } from './parts/RangeAndCoverDialog';
import { RangedWeaponFixture } from './parts/RangedWeaponFixture';
import { RelationshipFixture } from './parts/RelationshipFixture';
import { ReputationFixture } from './parts/ReputationFixture';
import { RollDialog } from './parts/RollDialog';
import { SkillFixture } from './parts/SkillFixture';
import { SpellFixture } from './parts/SpellFixture';
import { TraitFixture } from './parts/TraitFixture';

export type FixtureBase = typeof testLoggedOut & typeof testLoggedIn;

type BwFixture = {
    dowDialog: DoWDialog;
    fightDialog: FightDialog;
    rncDialog: RangeAndCoverDialog;
    rollDialog: RollDialog;
    char: CharacterFixture;
    items: {
        aff: AffiliationFixture;
        armor: ArmorFixture;
        belief: BeliefFixture;
        instinct: InstinctFixture;
        lp: LifepathFixture;
        melee: MeleeWeaponFixture;
        poss: PossessionFixture;
        prop: PropertyFixture;
        ranged: RangedWeaponFixture;
        rel: RelationshipFixture;
        rep: ReputationFixture;
        skill: SkillFixture;
        spell: SpellFixture;
        trait: TraitFixture;
    };
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
    items: async ({ page, gamePage }, use) =>
        await use({
            aff: new AffiliationFixture(page, gamePage, test),
            armor: new ArmorFixture(page, gamePage, test),
            belief: new BeliefFixture(page, gamePage, test),
            instinct: new InstinctFixture(page, gamePage, test),
            lp: new LifepathFixture(page, gamePage, test),
            melee: new MeleeWeaponFixture(page, gamePage, test),
            poss: new PossessionFixture(page, gamePage, test),
            prop: new PropertyFixture(page, gamePage, test),
            ranged: new RangedWeaponFixture(page, gamePage, test),
            rel: new RelationshipFixture(page, gamePage, test),
            rep: new ReputationFixture(page, gamePage, test),
            skill: new SpellFixture(page, gamePage, test),
            spell: new SkillFixture(page, gamePage, test),
            trait: new TraitFixture(page, gamePage, test),
        }),
};

export const test = testLoggedOut.extend<BwFixture>(extender);
export const testAsGm = testLoggedIn.extend<BwFixture>(extender);
