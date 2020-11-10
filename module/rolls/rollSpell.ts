import { BWActor } from "module/bwactor.js";
import { BWCharacter } from "module/character.js";
import * as helpers from "../helpers.js";
import { Skill, Spell } from "../items/item.js";
import { handleLearningRoll } from "./rollLearning.js";
import { EventHandlerOptions, RollDialogData, RollOptions } from "./rolls.js";
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
    return handleSpellRoll({ actor, spell, skill });
}

export async function handleSpellRoll({ actor, spell, skill, dataPreset }: SpellRollOptions): Promise<unknown> {
    if (!spell) {
        return helpers.notifyError("Missing Spell",
            "The spell being cast seems to be missing from the character sheet.");
    }
    const spellData = Spell.GetSpellMessageData(spell);

    if (skill) {
        
        const obstacle = spell.data.data.variableObstacle ? 3 : spell.data.data.obstacle;
        let practicalsPenalty = 0;
        const spellPreset: Partial<RollDialogData> = { difficulty: obstacle };
        if (spell.data.data.inPracticals) {
            practicalsPenalty = (spell.data.data.aptitude || 9) - parseInt(spell.data.data.learningProgress || "0");
            spellPreset.obModifiers = [
                { label: "In Practicals", obstacle: practicalsPenalty, optional: false }
            ];
        }

        if (dataPreset) {
            dataPreset.difficulty = obstacle;
            dataPreset.obModifiers = (dataPreset.obModifiers || []).concat(...(spellPreset.obModifiers || []));
        } else {
            dataPreset = spellPreset;
        }

        dataPreset.showDifficulty = true;
        dataPreset.showObstacles = true;
        dataPreset.useCustomDifficulty = true;

        const onRollCallback = async () => {
            showSpellTaxDialog(obstacle, spell.name, actor);
            if (spell.data.data.inPracticals) {
                const amount = parseInt(spell.data.data.learningProgress || "0");
                const aptitude = spell.data.data.aptitude || 9;
                spell.update({ "data.learningProgress": amount + 1 }, {});
                if (amount + 1 >= aptitude) {
                    return Dialog.confirm({
                        title: "Spell Practicals Complete!",
                        content: "<p>The spell practicals process is complete. Time for a second reading.</p><p>Set the spell as no longer in practicals?</p>",
                        yes: () => {
                            spell.update({ "data.inPracticals": false, "data.learningProgress": 0 }, {});
                        },
                        no: () => void 0
                    });
                }
            }
        };

        return skill.data.data.learning ? 
            handleLearningRoll({ actor, skill, extraInfo: spellData, dataPreset, onRollCallback }) :
            handleSkillRoll({ actor, skill, extraInfo: spellData, dataPreset, onRollCallback });
    }
    throw Error("The designated skill no longer exists on the character");
}

interface SpellRollOptions extends RollOptions {
    spell: Spell,
    skill: Skill,
    actor: BWActor & BWCharacter;
}