import { simpleBroadcast, SimpleBroadcastMessageData } from "../chat.js";
import { BWActor, RollModifier } from "../actors/BWActor.js";
import { HasPointCost, BWItem } from "./item.js";

export class Trait extends BWItem<TraitData> {
    type: "trait";
    
    prepareData(): void {
        super.prepareData();
        this.system.isCallonTrait = this.system.traittype === "call-on";
        this.system.isDieTrait = this.system.traittype === "die";
    }
    static asRollDieModifier(name: string, trait: TraitData): RollModifier {
        return {
            label: name,
            optional: true,
            dice: trait.dieModifier || 0
        };
    }

    static asRollObModifier(name: string, trait: TraitData): RollModifier {
        return {
            label: name,
            optional: true,
            obstacle: trait.obModifier || 0
        };
    }

    async generateChatMessage(actor: BWActor): Promise<ChatMessage | null> {
        const extraData: { title?: string, text?: string }[] = [];
        if (this.system.traittype === "call-on") {
            extraData.push({
                title: "Call-on For",
                text: this.system.callonTarget
            });
        } else if (this.system.traittype === "die") {
            if (this.system.hasAptitudeModifier) {
                extraData.push({
                    title: "Affects Aptitude",
                    text: `${this.system.aptitudeTarget.trim()} : ${this.system.aptitudeModifier}`
                });
            }
            if (this.system.hasDieModifier) {
                extraData.push({
                    title: "Adds Dice",
                    text: `${this.system.dieModifierTarget} : ${this.system.dieModifier >= 0 ? '+' + this.system.dieModifier : this.system.dieModifier}D`
                });
            }
            if (this.system.hasObModifier) {
                extraData.push({
                    title: "Changed Obstacle",
                    text: `${this.system.obModifierTarget} : ${this.system.obModifier >= 0 ? '+' + this.system.obModifier : this.system.obModifier} Ob`
                });
            }
            if (this.system.addsAffiliation) {
                extraData.push({
                    title: "Adds an Affiliation",
                    text: `${this.system.affiliationDice}D with ${this.system.affiliationName}`
                });
            }
            if (this.system.addsReputation) {
                extraData.push({
                    title: "Adds a Reputation",
                    text: `${this.system.reputationDice}D ${this.system.reputationInfamous ? "infamous " : ""}reputation as ${this.system.reputationName}`
                });
            }
        }
        extraData.push({
            title: `${this.system.traittype.titleCase()} Trait`
        });

        const data: SimpleBroadcastMessageData = {
            title: this.name,
            mainText: this.system.text || "No Description Given",
            extraData
        };
        return simpleBroadcast(data, actor);
    }
}

export interface TraitData extends HasPointCost {
    traittype: string;
    text: string;
    restrictions: string;

    hasDieModifier: boolean;
    dieModifier: number;
    dieModifierTarget: string;

    hasObModifier: boolean;
    obModifierTarget: string;
    obModifier: number;

    addsReputation: boolean;
    reputationName: string;
    reputationDice: number;
    reputationInfamous: boolean;

    addsAffiliation: boolean;
    affiliationName: string;
    affiliationDice: number;

    hasAptitudeModifier: boolean;
    aptitudeTarget: string;
    aptitudeModifier: number;

    callonTarget: string;

    isDieTrait: boolean;
    isCallonTrait: boolean;
}
