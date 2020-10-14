import { BWActor } from "../bwactor.js";
import { weaponLengthSelect } from "../constants.js";
import { StringIndexedObject, DivOfText } from "../helpers.js";
import { HasPointCost, BWItemData } from "./item.js";

export class Spell extends Item<SpellData> {
    prepareData(): void {
        this.data.obstacleLabel = 
            `${this.data.data.variableObstacle ?
                this.data.data.variableObstacleDescription :
                this.data.data.obstacle}${this.data.data.upSpell?
                '^':''}`;
        if (this.data.data.isWeapon && this.data.hasOwner && this.actor) {
            const willScore = parseInt(this.actor.data.data.will.exp);
            if (this.data.data.halfWill) {
                this.data.data.mark = Math.floor(willScore / 2.0) + this.data.data.willDamageBonus;
            } else {
                this.data.data.mark = willScore + this.data.data.willDamageBonus;
            }
            
            this.data.data.incidental = Math.ceil(this.data.data.mark / 2.0);
            this.data.data.superb = Math.floor(this.data.data.mark * 1.5);
        }
        this.data.spellLengths = weaponLengthSelect;

        if (this.data.hasOwner && this.actor) {
            this.data.data.aptitude = 10 - parseInt(this.actor.data.data.perception.exp || "1")
                + this.actor.getAptitudeModifiers("perception")
                + this.actor.getAptitudeModifiers("spells");
        }
    }

    static GetSpellMessageData(spell: Spell): string {
        const element = document.createElement("div");
        element.className = "spell-extra-info";
        element.appendChild(DivOfText(spell.name, "spell-title"));
        if (spell.data.data.isWeapon) {
            const roll = new Roll("1d6").roll().dice[0].results[0].result;
            element.appendChild(DivOfText("I", "ims-header"));
            element.appendChild(DivOfText("M", "ims-header"));
            element.appendChild(DivOfText("S", "ims-header"));
            element.appendChild(DivOfText("Va", "ims-header"));
            element.appendChild(DivOfText("Act.", "ims-header"));
            element.appendChild(DivOfText("DoF", "ims-header"));
            element.appendChild(DivOfText("Length", "ims-header"));
        
            element.appendChild(DivOfText("B " + spell.data.data.incidental, roll < 3 ? "highlight" : undefined));
            element.appendChild(DivOfText("B " + spell.data.data.mark, [3,4].includes(roll) ? "highlight" : undefined));
            element.appendChild(DivOfText("B " + spell.data.data.superb, roll > 4 ? "highlight" : undefined));
            element.appendChild(DivOfText("" + spell.data.data.va));
            element.appendChild(DivOfText("" + spell.data.data.actions));
            element.appendChild(DivOfText(`${roll}`, "roll-die"));
            element.appendChild(DivOfText(spell.data.data.weaponLength));
        }
        

        return element.outerHTML;
    }

    data: SpellDataRoot;
    get actor(): BWActor | null {
        return super.actor as BWActor | null;
    }
}

export interface SpellDataRoot extends ItemData<SpellData>, BWItemData {
    spellLengths: StringIndexedObject<string>;
    obstacleLabel: string;
    type: "spell"
    data: SpellData
}

export interface SpellData extends HasPointCost {
    variableObstacle: boolean;
    variableObstacleDescription: string;
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

    inPracticals: boolean;
    learningProgress: string;

    isWeapon: boolean;
    halfWill: boolean;
    willDamageBonus: number;
    va: number;
    weaponLength: string;
    optimalRange: number;
    extremeRange: number;
    maxRange: string;
    collapsed: boolean;
    skillId: string;

    //derived values
    incidental?: number;
    superb?: number;
    mark?: number;
    aptitude?: number;
}