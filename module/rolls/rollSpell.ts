import { BWActor } from "module/bwactor.js";
import { BWCharacter } from "module/character.js";
import * as helpers from "../helpers.js";
import { Skill, Spell } from "../items/item.js";
import { handleLearningRoll } from "./rollLearning.js";
import { EventHandlerOptions } from "./rolls.js";
import { handleSkillRoll } from "./rollSkill.js";
import { showSpellTaxDialog } from "./rollSpellTax.js";

export async function handleSpellRollEvent({ target, sheet }: EventHandlerOptions): Promise<unknown> {
    const actor = sheet.actor as BWActor & BWCharacter;
    const sorcerySkillId = target.dataset.skillId;
    if (!sorcerySkillId) {
        return helpers.notifyError("No Skill Specified",
            "A skill must be specified in order for the spell test to be rolled. Please pick from a list of sorcerous of the character.");
    }
    const skill = actor.getOwnedItem(sorcerySkillId) as Skill;
    const spellId = target.dataset.spellId;
    if (!spellId) {
        throw Error("Malformed spell roll button. Must specify spell Id");
    }
    const spell = sheet.actor.getOwnedItem(spellId) as Spell;
    return handleSpellRoll({ actor, spell, skill});
}

export async function handleSpellRoll({ actor, spell, skill }: SpellRollOptions): Promise<unknown> {
    if (!spell) {
        return helpers.notifyError("Missing Spell",
            "The spell being cast seems to be missing from the character sheet.");
    }
    const spellData = Spell.GetSpellMessageData(spell);

    if (skill) {
        const obstacle = spell.data.data.variableObstacle ? 3 : spell.data.data.obstacle;
        return skill.data.data.learning ? 
            handleLearningRoll({ actor, skill, extraInfo: spellData,
                dataPreset: { difficulty: obstacle },
                onRollCallback: () => showSpellTaxDialog(obstacle, spell.name, actor) }) :
            handleSkillRoll({ actor, skill, extraInfo: spellData, dataPreset: { difficulty: obstacle },
                onRollCallback: () => showSpellTaxDialog(obstacle, spell.name, actor) });
    }
    throw Error("The designated skill no longer exists on the character");
}

interface SpellRollOptions {
    spell: Spell,
    skill: Skill,
    actor: BWActor & BWCharacter;
}