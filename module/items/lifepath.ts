import { BWItem } from './item';

export class Lifepath extends BWItem<LifepathData> {
    type: 'lifepath';

    prepareData(): void {
        super.prepareData();
        const statSign =
            this.system.statBoost === 'none'
                ? ''
                : this.system.subtractStats
                ? '-'
                : '+';
        this.system.statString = statSign + statMap[this.system.statBoost];
    }

    _preCreate(
        data: Partial<LifepathData>,
        options: FoundryDocument.CreateOptions,
        user: User
    ): void {
        if (!data || data.leads === 'Any') {
            this.updateSource({
                'system.leads': game.i18n.localize('BW.lifepath.any'),
            });
        }
        return super._preCreate(data, options, user);
    }
}

export interface LifepathData {
    time: number;
    resources: number;
    statBoost:
        | 'none'
        | 'mental'
        | 'physical'
        | 'either'
        | 'both'
        | 'phystwo'
        | 'menttwo';
    subtractStats: boolean;
    leads: string;
    skillPoints: number;
    generalPoints: number;
    traitPoints: number;
    skillList: string;
    traitList: string;
    requirements: string;
    restrictions: string;
    note: string;

    order: number; // hidden property  for sorting in the setting sheet

    statString?: string;
}

const statMap = {
    none: '&mdash;',
    mental: '1 M',
    physical: '1 P',
    either: '1 M/P',
    both: '1 M,P',
    phystwo: '2 P',
    menttwo: '2 M',
};
