import { handleLearningRoll } from "./rollLearning.js";
import { handleSkillRoll } from "./rollSkill.js";
import * as helpers from "../helpers.js";
import { Skill, MeleeWeapon, RangedWeapon } from "../items/item.js";
import { RollOptions, RollDialogData } from "./rolls.js";

export function handleWeaponRoll({ target, sheet }: RollOptions): Promise<unknown> {
    const weaponId = target.dataset.weaponId;
    if (!weaponId) {
        throw Error("Malformed weapon roll button. Weapon ID must be specified");
    }
    const weapon = sheet.actor.getOwnedItem(weaponId);
    if (!weapon) {
        return helpers.notifyError("No Matching Weapon",
            "The weapon used to roll this attack appears to no longer be present on the character.");
    }

    let weaponExtraData: string | undefined;
    if (weapon.type === "melee weapon") {
        const index = parseInt(target.dataset.attackIndex as string);
        weaponExtraData = MeleeWeapon.GetWeaponMessageData(weapon as MeleeWeapon, index);
    } else {
        weaponExtraData = RangedWeapon.GetWeaponMessageData(weapon as RangedWeapon);
    }
    
    const quality = (weapon as MeleeWeapon | RangedWeapon).data.data.quality;
    let dataPreset: Partial<RollDialogData> | undefined;
    if (quality === "superior") {
        dataPreset = { diceModifiers: [ { dice: 1, label: "Superior Quality", optional: false }]};
    } else if (quality === "poor") {
        dataPreset = { obModifiers: [ { obstacle: 1, label: "Poor Quality", optional: false }]};
    }

    const skillId = target.dataset.skillId;
    if (!skillId) {
        return helpers.notifyError("No Skill Specified",
            "A skill must be specified in order for the weapon attack to be rolled. Please pick from a list of martial skills of the character.");
    }
    const skill: Skill | null = sheet.actor.getOwnedItem(skillId) as Skill;
    if (skill) {
        return skill.data.data.learning ? 
            handleLearningRoll({ target, sheet, extraInfo: weaponExtraData, dataPreset }) :
            handleSkillRoll({ target, sheet, extraInfo: weaponExtraData, dataPreset });
    }
    throw Error("Provided skillID did not correspond to an owned skill.");
}