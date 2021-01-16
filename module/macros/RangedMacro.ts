import { Skill } from '../items/skill.js';
import { RangedDragData } from '../helpers.js';
import { getImage, getMacroRollPreset, MacroData } from './Macro.js';
import { BWActor } from '../actors/BWActor.js';
import { BWCharacter } from '../actors/BWCharacter.js';
import { handleNpcWeaponRoll } from '../rolls/npcSkillRoll.js';
import { Npc } from '../actors/Npc.js';
import { RollDialogData } from '../rolls/rolls.js';
import { handleWeaponRoll } from '../rolls/rollWeapon.js';
import { RangedWeapon } from '../items/rangedWeapon.js';

export function CreateRangedRollMacro(data: RangedDragData): MacroData | null {
    if (!data.actorId) {
        return null;
    }

    return {
        name: `Attack with ${data.data.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollRanged("${data.actorId}", "${data.id}");`,
        img: getImage(data.data.img, 'ranged weapon'),
    };
}

export function RollRangedMacro(actorId: string, weaponId: string): void {
    const actor = game.actors.find((a) => a.id === actorId) as BWActor | null;
    if (!actor) {
        ui.notifications.notify(
            'Unable to find actor linked to this macro. Were they deleted?',
            'error'
        );
        return;
    }

    const weapon = actor.getOwnedItem(weaponId) as RangedWeapon | null;
    if (!weapon) {
        ui.notifications.notify(
            'Unable to find weapon linked to this macro. Was it deleted?',
            'error'
        );
        return;
    }

    const skill = actor.getOwnedItem(weapon.data.data.skillId) as Skill | null;
    if (!skill) {
        ui.notifications.notify(
            'Unable to find skill linked to the weapon in this macro. Ensure a martial skill is linked with this weapon.',
            'error'
        );
        return;
    }

    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);
    if (actor.data.type === 'character') {
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
