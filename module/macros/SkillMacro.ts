import { Skill } from '../items/skill';
import { ItemDragData } from '../helpers';
import { getImage, getMacroRollPreset, MacroData } from './Macro';
import { BWActor } from '../actors/BWActor';
import { handleSkillRoll } from '../rolls/rollSkill';
import { BWCharacter } from '../actors/BWCharacter';
import { handleNpcSkillRoll } from '../rolls/npcSkillRoll';
import { Npc } from '../actors/Npc';
import { handleLearningRoll } from '../rolls/rollLearning';
import { RollDialogData } from '../rolls/rolls';

export function CreateSkillRollMacro(dragData: ItemDragData): MacroData | null {
    if (!dragData.actorId) {
        return null;
    }
    const skillData = dragData.data as Skill & { _id: string };
    return {
        name: `Test ${skillData.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollSkill("${dragData.actorId}", "${dragData.id}");`,
        img: getImage(skillData.img, 'skill'),
    };
}

export function RollSKillMacro(actorId: string, skillId: string): void {
    const actor = game.actors?.find((a) => a.id === actorId) as BWActor;
    if (!actor) {
        ui.notifications?.notify(
            'Unable to find actor linked to this macro. Were they deleted?',
            'error'
        );
        return;
    }

    const skill = actor.items.get(skillId) as Skill | null;
    if (!skill) {
        ui.notifications?.notify(
            'Unable to find skill linked in this macro. Was it deleted?',
            'error'
        );
        return;
    }

    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);
    if (actor.type === 'character') {
        if (skill.system.learning) {
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
