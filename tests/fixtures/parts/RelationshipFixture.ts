import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type LabelFields = never;
type CheckBoxFields =
    | 'Forbidden'
    | 'Immediate Family'
    | 'Other Family'
    | 'Romantic'
    | 'Hateful/Rival'
    | 'Building'
    | 'Enmity Clause';
type SelectFields = 'Influence';
class RelationshipDialog extends BaseItemDialog<
    LabelFields,
    CheckBoxFields,
    SelectFields
> {
    constructor(fixture: BaseItemFixture, name: SeededItems) {
        super(fixture, name);
    }
}
export class RelationshipFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'relationship'>) {
        await super.open(name);
        return new RelationshipDialog(this, name);
    }

    static getOpenDialog(
        page: Page,
        gamePage: GameFixture,
        test: FixtureBase,
        name: string
    ) {
        return new RelationshipDialog(
            new RelationshipFixture(page, gamePage, test),
            name as SeededItems
        );
    }
}
