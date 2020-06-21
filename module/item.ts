import { Skill } from "./items/skill.js";
import { Trait } from "./items/trait.js";

export class BWItem extends Item {
    prepareData() {
        super.prepareData();
        if (this.type === "trait") {
            Trait.prototype.prepareData.bind(this)();
        }
        if (this.type === "skill") {
            Skill.prototype.prepareData.bind(this)();
        }
    }
}

export interface ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
}