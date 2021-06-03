import { Skill } from "../items/skill.js";
import { MeleeDragData } from "../helpers.js";
import { getImage, getMacroRollPreset, MacroData } from "./Macro.js";
import { BWActor } from "../actors/BWActor.js";
import { BWCharacter } from "../actors/BWCharacter.js";
import { handleNpcWeaponRoll } from "../rolls/npcSkillRoll.js";
import { Npc } from "../actors/Npc.js";
import { RollDialogData } from "../rolls/rolls.js";
import { MeleeWeapon } from "../items/meleeWeapon.js";
import { handleWeaponRoll } from "../rolls/rollWeapon.js";

export function CreateMeleeRollMacro(data: MeleeDragData): MacroData | null {
    if (!data.actorId) {
        return null;
    }

    return {
        name: `Attack with ${data.data.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollMelee("${data.actorId}", "${data.id}", ${data.data.index});`,
        img: getImage(data.data.img, "melee weapon")
    };
}

export function RollMeleeMacro(actorId: string, weaponId: string, attackIndex: number): void {
    const actor = game.actors?.find(a => a.id === actorId) as BWActor;
    if (!actor) {
        ui.notifications?.notify("Unable to find actor linked to this macro. Were they deleted?", "error");
        return;
    }

    const weapon = actor.items.get(weaponId) as MeleeWeapon | null;
    if (!weapon) {
        ui.notifications?.notify("Unable to find weapon linked to this macro. Was it deleted?", "error");
        return;
    }

    const skill = actor.items.get(weapon.data.data.skillId) as Skill | null;
    if (!skill) {
        ui.notifications?.notify("Unable to find skill linked to the weapon in this macro. Ensure a martial skill is linked with this weapon.", "error");
        return;
    }

    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);
    if (actor.data.type === "character") {
        handleWeaponRoll({actor: actor as BWCharacter, weapon, attackIndex, skill, dataPreset});
    } else {
        handleNpcWeaponRoll({ actor: actor as Npc, weapon, skill, attackIndex, dataPreset });
    }
}