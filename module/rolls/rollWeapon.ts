import { handleLearningRoll } from './rollLearning';
import { handleSkillRoll } from './rollSkill';
import * as helpers from '../helpers';
import {
    EventHandlerOptions,
    mergePartials,
    RollDialogData,
    RollOptions,
} from './rolls';
import { BWCharacter } from '../actors/BWCharacter';
import { RangedWeapon } from '../items/rangedWeapon';
import { MeleeWeapon } from '../items/meleeWeapon';
import { Skill } from '../items/skill';

export function handleWeaponRollEvent({
    target,
    sheet,
    dataPreset,
}: EventHandlerOptions): unknown {
    const actor = sheet.actor as BWCharacter;
    const weaponId = target.dataset.weaponId;
    if (!weaponId) {
        throw Error(
            'Malformed weapon roll button. Weapon ID must be specified'
        );
    }
    const weapon = sheet.actor.items.get<MeleeWeapon | RangedWeapon>(weaponId);
    if (!weapon) {
        return helpers.notifyError(
            game.i18n.localize('BW.dialog.missingWeapon'),
            game.i18n.localize('BW.dialog.missingWeaponText')
        );
    }

    const skillId = target.dataset.skillId;
    if (!skillId) {
        return helpers.notifyError(
            game.i18n.localize('BW.dialog.noSkillSpecified'),
            game.i18n.localize('BW.dialog.weaponMissingSkill')
        );
    }
    const skill = sheet.actor.items.get<Skill>(skillId);
    if (!skill) {
        throw Error('Provided skillID did not correspond to an owned skill.');
    }
    return handleWeaponRoll({
        actor,
        weapon,
        attackIndex: parseInt(target.dataset.attackIndex || '0'),
        skill,
        dataPreset,
    });
}

export async function handleWeaponRoll({
    actor,
    weapon,
    attackIndex,
    skill,
    dataPreset,
}: WeaponRollOptions): Promise<unknown> {
    const quality = (weapon as MeleeWeapon | RangedWeapon).system.quality;

    let weaponPreset: Partial<RollDialogData> = {};
    if (quality === 'superior') {
        weaponPreset = {
            diceModifiers: [
                {
                    dice: 1,
                    label: game.i18n.localize('BW.weapon.superiorQuality'),
                    optional: false,
                },
            ],
        };
    } else if (quality === 'poor') {
        weaponPreset = {
            obModifiers: [
                {
                    obstacle: 1,
                    label: game.i18n.localize('BW.weapon.poorQuality'),
                    optional: false,
                },
            ],
        };
    }

    dataPreset = mergePartials(weaponPreset, dataPreset);

    let weaponExtraData: string | undefined;
    if (weapon.type === 'melee weapon') {
        weaponExtraData = await (weapon as MeleeWeapon).getWeaponMessageData(
            attackIndex || 0
        );
    } else {
        weaponExtraData = await (weapon as RangedWeapon).getWeaponMessageData();
    }

    return skill.system.learning
        ? handleLearningRoll({
              actor,
              skill,
              extraInfo: weaponExtraData,
              dataPreset,
          })
        : handleSkillRoll({
              actor,
              skill,
              extraInfo: weaponExtraData,
              dataPreset,
          });
}

interface WeaponRollOptions extends RollOptions {
    actor: BWCharacter;
    skill: Skill;
    weapon: MeleeWeapon | RangedWeapon;
    attackIndex?: number;
}
