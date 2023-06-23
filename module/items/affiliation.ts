import { BWItem } from './item';

export class Affiliation extends BWItem<AffiliationData> {
    type: 'affiliation';
}

export interface AffiliationData {
    dice: number;
    description: string;
}
