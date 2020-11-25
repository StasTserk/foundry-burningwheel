import { Skill } from "../items/skill.js";
import { RangedDragData } from "../helpers.js";
import { getMacroRollPreset, MacroData } from "./Macro.js";
import { BWActor } from "../actors/bwactor.js";
import { BWCharacter } from "../actors/character.js";
import { handleNpcWeaponRoll } from "../rolls/npcSkillRoll.js";
import { Npc } from "../actors/npc.js";
import { RollDialogData } from "../rolls/rolls.js";
import { handleWeaponRoll } from "../rolls/rollWeapon.js";
import { RangedWeapon } from "module/items/rangedWeapon.js";

export function CreateRangedRollMacro(data: RangedDragData): MacroData | null {
    if (!data.actorId) {
        return null;
    }

    return {
        name: `Roll ${data.data.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollRanged("${data.actorId}", "${data.id}");`,
        img: data.data.img
    };
}

export function RollRangedMacro(actorId: string, weaponId: string): void {
    const actor = game.actors.find(a => a.id === actorId) as BWActor;
    const weapon = actor.getOwnedItem(weaponId) as RangedWeapon;
    const skill = actor.getOwnedItem(weapon.data.data.skillId) as Skill;

    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);
    if (actor.data.type === "character") {
        handleWeaponRoll({actor: actor as BWCharacter, weapon, skill, dataPreset});
    } else {
        handleNpcWeaponRoll({ actor: actor as Npc, weapon, skill, dataPreset });
    }
}