import { handleLearningRoll } from "./rollLearning.js";
import { handleSkillRoll } from "./rollSkill.js";
import * as helpers from "../helpers.js";
import { EventHandlerOptions, mergePartials, RollDialogData, RollOptions } from "./rolls.js";
import { BWCharacter } from "../actors/BWCharacter.js";
import { RangedWeapon } from "../items/rangedWeapon.js";
import { MeleeWeapon } from "../items/meleeWeapon.js";
import { Skill } from "../items/skill.js";

export function handleWeaponRollEvent({ target, sheet, dataPreset }: EventHandlerOptions): unknown {
    const actor = sheet.actor as BWCharacter;
    const weaponId = target.dataset.weaponId;
    if (!weaponId) {
        throw Error("Malformed weapon roll button. Weapon ID must be specified");
    }
    const weapon = sheet.actor.items.get<MeleeWeapon | RangedWeapon>(weaponId);
    if (!weapon) {
        return helpers.notifyError("No Matching Weapon",
            "The weapon used to roll this attack appears to no longer be present on the character.");
    }

    const skillId = target.dataset.skillId;
    if (!skillId) {
        return helpers.notifyError("No Skill Specified",
            "A skill must be specified in order for the weapon attack to be rolled. Please pick from a list of martial skills of the character.");
    }
    const skill = sheet.actor.items.get<Skill>(skillId);
    if (!skill) {
        throw Error("Provided skillID did not correspond to an owned skill.");
    }
    return handleWeaponRoll({
        actor,
        weapon,
        attackIndex: parseInt(target.dataset.attackIndex || "0"),
        skill,
        dataPreset
    });

}

export async function handleWeaponRoll({ actor, weapon, attackIndex, skill, dataPreset}: WeaponRollOptions): Promise<unknown> {
    const quality = (weapon as MeleeWeapon | RangedWeapon).system.quality;

    let weaponPreset: Partial<RollDialogData> = {};
    if (quality === "superior") {
        weaponPreset = { diceModifiers: [ { dice: 1, label: "Superior Quality", optional: false }]};
    } else if (quality === "poor") {
        weaponPreset = { obModifiers: [ { obstacle: 1, label: "Poor Quality", optional: false }]};
    }

    dataPreset = mergePartials(weaponPreset, dataPreset);
    
    let weaponExtraData: string | undefined;
    if (weapon.type === "melee weapon") {
        weaponExtraData = await (weapon as MeleeWeapon).getWeaponMessageData(attackIndex || 0);
    } else {
        weaponExtraData = await (weapon as RangedWeapon).getWeaponMessageData();
    }

    return skill.system.learning ? 
        handleLearningRoll({ actor, skill, extraInfo: weaponExtraData, dataPreset }) :
        handleSkillRoll({ actor, skill, extraInfo: weaponExtraData, dataPreset });
    
}

interface WeaponRollOptions extends RollOptions {
    actor: BWCharacter;
    skill: Skill;
    weapon: MeleeWeapon | RangedWeapon;
    attackIndex?: number;
}