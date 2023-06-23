import { Skill } from '../items/skill';
import { MeleeDragData } from '../helpers';
import { getImage, getMacroRollPreset, MacroData } from './Macro';
import { BWActor } from '../actors/BWActor';
import { BWCharacter } from '../actors/BWCharacter';
import { handleNpcWeaponRoll } from '../rolls/npcSkillRoll';
import { Npc } from '../actors/Npc';
import { RollDialogData } from '../rolls/rolls';
import { MeleeWeapon } from '../items/meleeWeapon';
import { handleWeaponRoll } from '../rolls/rollWeapon';

export function CreateMeleeRollMacro(
    dragData: MeleeDragData
): MacroData | null {
    if (!dragData.actorId) {
        return null;
    }

    return {
        name: `Attack with ${dragData.data.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollMelee("${dragData.actorId}", "${dragData.id}", ${dragData.data.index});`,
        img: getImage(dragData.data.img, 'melee weapon'),
    };
}

export function RollMeleeMacro(
    actorId: string,
    weaponId: string,
    attackIndex: number
): void {
    const actor = game.actors?.find((a) => a.id === actorId) as BWActor;
    if (!actor) {
        ui.notifications?.notify(
            'Unable to find actor linked to this macro. Were they deleted?',
            'error'
        );
        return;
    }

    const weapon = actor.items.get(weaponId) as MeleeWeapon | null;
    if (!weapon) {
        ui.notifications?.notify(
            'Unable to find weapon linked to this macro. Was it deleted?',
            'error'
        );
        return;
    }

    const skill = actor.items.get(weapon.system.skillId) as Skill | null;
    if (!skill) {
        ui.notifications?.notify(
            'Unable to find skill linked to the weapon in this macro. Ensure a martial skill is linked with this weapon.',
            'error'
        );
        return;
    }

    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);
    if (actor.type === 'character') {
        handleWeaponRoll({
            actor: actor as BWCharacter,
            weapon,
            attackIndex,
            skill,
            dataPreset,
        });
    } else {
        handleNpcWeaponRoll({
            actor: actor as Npc,
            weapon,
            skill,
            attackIndex,
            dataPreset,
        });
    }
}
