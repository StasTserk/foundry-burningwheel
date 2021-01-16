import { Skill, SkillDataRoot } from '../items/skill.js';
import { ItemDragData } from '../helpers.js';
import { getImage, getMacroRollPreset, MacroData } from './Macro.js';
import { BWActor } from '../actors/BWActor.js';
import { handleSkillRoll } from '../rolls/rollSkill.js';
import { BWCharacter } from '../actors/BWCharacter.js';
import { handleNpcSkillRoll } from '../rolls/npcSkillRoll.js';
import { Npc } from '../actors/Npc.js';
import { handleLearningRoll } from '../rolls/rollLearning.js';
import { RollDialogData } from '../rolls/rolls.js';

export function CreateSkillRollMacro(data: ItemDragData): MacroData | null {
    if (!data.actorId) {
        return null;
    }
    const skillData = data.data as SkillDataRoot & { _id: string };
    return {
        name: `Test ${skillData.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollSkill("${data.actorId}", "${data.id}");`,
        img: getImage(skillData.img, 'skill'),
    };
}

export function RollSKillMacro(actorId: string, skillId: string): void {
    const actor = game.actors.find((a) => a.id === actorId) as BWActor;
    if (!actor) {
        ui.notifications.notify(
            'Unable to find actor linked to this macro. Were they deleted?',
            'error'
        );
        return;
    }

    const skill = actor.getOwnedItem(skillId) as Skill | null;
    if (!skill) {
        ui.notifications.notify(
            'Unable to find skill linked in this macro. Was it deleted?',
            'error'
        );
        return;
    }

    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);
    if (actor.data.type === 'character') {
        if (skill.data.data.learning) {
            handleLearningRoll({
                actor: actor as BWCharacter,
                skill,
                dataPreset,
            });
        } else {
            handleSkillRoll({ actor: actor as BWCharacter, skill, dataPreset });
        }
    } else {
        handleNpcSkillRoll({ actor: actor as Npc, skill, dataPreset });
    }
}
