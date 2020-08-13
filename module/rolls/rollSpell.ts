import { BWActorSheet } from "../bwactor-sheet.js";
import * as helpers from "../helpers.js";
import { Skill, Spell } from "../items/item.js";
import { handleLearningRoll } from "./rollLearning.js";
import { handleSkillRoll } from "./rollSkill.js";

export async function handleSpellRoll(target: HTMLButtonElement, sheet: BWActorSheet): Promise<unknown> {
    const sorcerySkillId = target.dataset.skillId;
    if (!sorcerySkillId) {
        return helpers.notifyError("No Skill Specified",
            "A skill must be specified in order for the spell test to be rolled. Please pick from a list of sorcerous of the character.");
    }
    const spellId = target.dataset.spellId;
    if (!spellId) {
        throw Error("Malformed spell roll button. Must specify spell Id");
    }
    const spell = sheet.actor.getOwnedItem(spellId) as Spell;
    if (!spell) {
        return helpers.notifyError("Missing Spell",
            "The spell being cast seems to be missing from the character sheet.");
    }
    const spellData = Spell.GetSpellMessageData(spell);

    const sorcerySkill: Skill | null = sheet.actor.getOwnedItem(sorcerySkillId) as Skill;
    if (sorcerySkill) {
        return sorcerySkill.data.data.learning ? 
            handleLearningRoll(target, sheet, spellData) :
            handleSkillRoll(target, sheet, spellData);
    }
    throw Error("The designated skill no longer exists on the character");
}