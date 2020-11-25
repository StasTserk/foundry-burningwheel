import { Skill } from "../items/skill.js";
import { MeleeDragData } from "../helpers.js";
import { getImage, getMacroRollPreset, MacroData } from "./Macro.js";
import { BWActor } from "../actors/bwactor.js";
import { BWCharacter } from "../actors/character.js";
import { handleNpcWeaponRoll } from "../rolls/npcSkillRoll.js";
import { Npc } from "../actors/npc.js";
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
    const actor = game.actors.find(a => a.id === actorId) as BWActor;
    const weapon = actor.getOwnedItem(weaponId) as MeleeWeapon;
    const skill = actor.getOwnedItem(weapon.data.data.skillId) as Skill;

    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);
    if (actor.data.type === "character") {
        handleWeaponRoll({actor: actor as BWCharacter, weapon, attackIndex, skill, dataPreset});
    } else {
        handleNpcWeaponRoll({ actor: actor as Npc, weapon, skill, attackIndex, dataPreset });
    }
}