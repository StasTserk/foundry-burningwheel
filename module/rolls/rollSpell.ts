import * as helpers from "../helpers.js";
import { Skill, Spell } from "../items/item.js";
import { handleLearningRollEvent } from "./rollLearning.js";
import { handleSkillRollEvent } from "./rollSkill.js";
import { EventHandlerOptions } from "./rolls.js";
import { showSpellTaxDialog } from "./rollSpellTax.js";

export async function handleSpellRollEvent({ target, sheet }: EventHandlerOptions): Promise<unknown> {
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
        const obstacle = spell.data.data.variableObstacle ? 3 : spell.data.data.obstacle;
        return sorcerySkill.data.data.learning ? 
            handleLearningRollEvent({ target, sheet, extraInfo: spellData,
                dataPreset: { difficulty: obstacle },
                onRollCallback: () => showSpellTaxDialog(obstacle, spell.name, sheet) }) :
            handleSkillRollEvent({ target, sheet, extraInfo: spellData, dataPreset: { difficulty: obstacle },
                onRollCallback: () => showSpellTaxDialog(obstacle, spell.name, sheet) });
    }
    throw Error("The designated skill no longer exists on the character");
}