import { BWCharacter } from "../actors/BWCharacter";
import { Skill } from "../items/skill";
import { Spell } from "../items/spell";
import * as helpers from "../helpers";
import { handleLearningRoll } from "./rollLearning";
import { EventHandlerOptions, RollDialogData, RollOptions } from "./rolls";
import { handleSkillRoll } from "./rollSkill";
import { showSpellTaxDialog } from "./rollSpellTax";

export async function handleSpellRollEvent({ target, sheet, dataPreset }: EventHandlerOptions): Promise<unknown> {
    const actor = sheet.actor as BWCharacter;
    const sorcerySkillId = target.dataset.skillId;
    if (!sorcerySkillId) {
        return helpers.notifyError(
            game.i18n.localize('BW.dialog.noSkillSpecified'),
            game.i18n.localize('BW.dialog.spellMissingSkill'));
    }
    const skill = actor.items.get(sorcerySkillId) as Skill;
    const spellId = target.dataset.spellId;
    if (!spellId) {
        throw Error("Malformed spell roll button. Must specify spell Id");
    }
    const spell = sheet.actor.items.get(spellId) as Spell;
    return handleSpellRoll({ actor, spell, skill, dataPreset });
}

export async function handleSpellRoll({ actor, spell, skill, dataPreset }: SpellRollOptions): Promise<unknown> {
    if (!spell) {
        return helpers.notifyError(
            game.i18n.localize('BW.dialog.missingSpell'),
            game.i18n.localize('BW.dialog.missingSpellText'));
    }
    const spellData = await spell.getSpellMessageData();

    if (skill) {
        const obstacle = spell.system.variableObstacle ? 3 : spell.system.obstacle;
        let practicalsPenalty = 0;
        const spellPreset: Partial<RollDialogData> = { difficulty: obstacle };
        if (spell.system.inPracticals) {
            practicalsPenalty = (spell.system.aptitude || 9) - spell.system.learningProgress || 0;
            spellPreset.obModifiers = [
                { label: game.i18n.localize('BW.roll.inPracticals'), obstacle: practicalsPenalty, optional: false }
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
            showSpellTaxDialog(obstacle, spell.name, actor, dataPreset || {});
            if (spell.system.inPracticals) {
                const amount = spell.system.learningProgress || 0;
                const aptitude = spell.system.aptitude || 9;
                spell.update({ "data.learningProgress": amount + 1 }, {});
                if (amount + 1 >= aptitude) {
                    return Dialog.confirm({
                        title: game.i18n.localize('BW.dialog.practicalsDone'),
                        content: `<p>${game.i18n.localize('BW.dialog.practicalsDoneText1')}</p><p>${game.i18n.localize('BW.dialog.practicalsDoneText2')}</p>`,
                        yes: () => {
                            spell.update({ "data.inPracticals": false, "data.learningProgress": 0 }, {});
                        },
                        no: () => void 0
                    });
                }
            }
        };

        return skill.system.learning ? 
            handleLearningRoll({ actor, skill, extraInfo: spellData, dataPreset, onRollCallback }) :
            handleSkillRoll({ actor, skill, extraInfo: spellData, dataPreset, onRollCallback });
    }
    throw Error("The designated skill no longer exists on the character");
}

interface SpellRollOptions extends RollOptions {
    spell: Spell,
    skill: Skill,
    actor: BWCharacter;
}