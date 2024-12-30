import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type InputFields =
    | 'armor dice'
    | 'resource point cost'
    | 'helm damage'
    | 'observation penalty'
    | 'torso damage'
    | 'fatigue penalty'
    | 'stealthy penalty'
    | 'swimming penalty'
    | 'left arm damage'
    | 'right arm damage'
    | 'agility penalty'
    | 'climbing penalty'
    | 'shooting penalty'
    | 'left leg damage'
    | 'right leg damage'
    | 'speed obstacle penalty'
    | 'shield damage';

type CheckboxFields =
    | 'equipped'
    | 'has helm'
    | 'has torso'
    | 'has left arm'
    | 'has right arm'
    | 'has left leg'
    | 'has right leg'
    | 'has shield';

type SelectFields = 'armor quality' | 'shade' | 'untrained penalty';

class ArmorDialog extends BaseItemDialog<
    InputFields,
    CheckboxFields,
    SelectFields
> {
    constructor(fixture: ArmorFixture, name: SeededItems) {
        super(fixture, name);
    }
}

export class ArmorFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'armor'>) {
        await this.open(name);
        return new ArmorDialog(this, name);
    }
}
