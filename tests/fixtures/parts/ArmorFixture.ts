import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

class ArmorDialog extends BaseItemDialog {
    constructor(fixture: ArmorFixture, name: SeededItems) {
        super(fixture, name);
    }

    get armorDice() {
        return this.locator.getByLabel(/armor dice/i);
    }

    get equipped() {
        return this.locator.getByLabel(/equipped/i);
    }

    get quality() {
        return this.locator.getByLabel(/armor quality/i);
    }

    get untrainedPenalty() {
        return this.locator.getByLabel(/untrained penalty/i);
    }

    get rpCost() {
        return this.locator.getByLabel(/resource point cost/i);
    }

    get hasHelm() {
        return this.locator.getByLabel(/has helm/i);
    }

    toggleHasHelm() {
        return this.locator.getByLabel(/has helm/i).dispatchEvent('click');
    }

    get helmDamage() {
        return this.locator.getByLabel(/helm damage/i);
    }

    get hasTorso() {
        return this.locator.getByLabel(/has helm/i);
    }

    toggleHasTorso() {
        return this.locator.getByText(/has helm/i).dispatchEvent('click');
    }

    get torsoDamage() {
        return this.locator.getByLabel(/torso damage/i);
    }

    get hasLeftArm() {
        return this.locator.getByLabel(/has helm/i);
    }
    get hasRightArm() {
        return this.locator.getByLabel(/has helm/i);
    }
    get hasLeftLeg() {
        return this.locator.getByLabel(/has helm/i);
    }
    get hasRightLeg() {
        return this.locator.getByLabel(/has helm/i);
    }
    get hasShield() {
        return this.locator.getByLabel(/has helm/i);
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
