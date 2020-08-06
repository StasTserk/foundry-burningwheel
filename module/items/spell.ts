import { BWActor } from "../actor.js";
import { weaponLengthSelect } from "../constants.js";
import { StringIndexedObject } from "../helpers.js";

export class Spell extends Item<SpellData> {
    prepareData(): void {
        this.data.obstacleLabel = 
            `${this.data.data.variableObstacle ?
                this.data.data.variableObstalceDescription :
                this.data.data.obstacle}${this.data.data.upSpell?
                '^':''}`;
        if (this.data.data.isWeapon && this.owner && this.actor) {
            this.data.hasOwner = true;
            const willScore = parseInt(this.actor.data.data.will.exp);
            this.data.data.mark = willScore + this.data.data.willDamageBonus;
            this.data.data.incidental = Math.ceil(this.data.data.mark / 2.0);
            this.data.data.superb = Math.floor(this.data.data.mark * 1.5);
        }
        this.data.spellLengths = weaponLengthSelect;
    }

    data: SpellDataRoot;
    actor: BWActor;
}

export interface SpellDataRoot extends ItemData<SpellData> {
    spellLengths: StringIndexedObject<string>;
    obstacleLabel: string;
    hasOwner: boolean;
}

export interface SpellData {
    variableObstacle: boolean;
    variableObstalceDescription: string;
    obstacle: number;
    upSpell: boolean;
    actions: number;
    obMultipliesActions: boolean;
    description: string;
    origin: string;
    areaOfEffect: string;
    element: string;
    impetus: string;
    duration: string;
    rpCost: number;
    isWeapon: boolean;
    willDamageBonus: number;
    va: number;
    weaponLength: string;
    optimalRange: number;
    extremeRange: number;
    maxRange: string;
    collapsed: boolean;

    //derived values
    incidental?: number;
    superb?: number;
    mark?: number;
}