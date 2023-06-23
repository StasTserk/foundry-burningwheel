import { Skill } from '../items/skill';
import { RangedDragData } from '../helpers';
import { getImage, getMacroRollPreset, MacroData } from './Macro';
import { BWActor } from '../actors/BWActor';
import { BWCharacter } from '../actors/BWCharacter';
import { handleNpcWeaponRoll } from '../rolls/npcSkillRoll';
import { Npc } from '../actors/Npc';
import { RollDialogData } from '../rolls/rolls';
import { handleWeaponRoll } from '../rolls/rollWeapon';
import { RangedWeapon } from '../items/rangedWeapon';

export function CreateRangedRollMacro(
    dragData: RangedDragData
): MacroData | null {
    if (!dragData.actorId) {
        return null;
    }

    return {
        name: `Attack with ${dragData.data.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollRanged("${dragData.actorId}", "${dragData.id}");`,
        img: getImage(dragData.data.img, 'ranged weapon'),
    };
}

export function RollRangedMacro(actorId: string, weaponId: string): void {
    const actor = game.actors?.find((a) => a.id === actorId) as BWActor | null;
    if (!actor) {
        ui.notifications?.notify(
            'Unable to find actor linked to this macro. Were they deleted?',
            'error'
        );
        return;
    }

    const weapon = actor.items.get(weaponId) as RangedWeapon | null;
    if (!weapon) {
        ui.notifications?.notify(
            'Unable to find weapon linked to this macro. Was it deleted?',
            'error'
        );
        return;
    }

    const skill = actor.items.get(
        weapon.system.skillId
    ) as unknown as Skill | null;
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
            skill,
            dataPreset,
        });
    } else {
        handleNpcWeaponRoll({ actor: actor as Npc, weapon, skill, dataPreset });
    }
}
