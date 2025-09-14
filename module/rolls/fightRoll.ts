import { BWItem } from '../items/item';
import { Ability, BWActor } from '../actors/BWActor';
import { handleStatRoll } from './rollStat';
import { notifyError, ShadeString } from '../helpers';
import { handleNpcStatRoll } from './npcStatRoll';
import { Npc } from '../actors/Npc';
import { RollDialogData } from './rolls';
import { handleSpellRoll } from './rollSpell';
import { BWCharacter } from '../actors/BWCharacter';
import { handleNpcSpellRoll, handleNpcWeaponRoll } from './npcSkillRoll';
import { handleWeaponRoll } from './rollWeapon';
import { MeleeWeapon } from '../items/meleeWeapon';
import { RangedWeapon } from '../items/rangedWeapon';
import { Skill } from '../items/skill';
import { Spell } from '../items/spell';
import { handleAttrRoll } from './rollAttribute';
import { FightAttr } from '../dialogs/index';

export async function handleFightRoll({
    actor,
    type,
    itemId,
    attackIndex,
    positionPenalty,
    engagementBonus,
    dataPreset,
}: FightRollOptions): Promise<unknown> {
    dataPreset = dataPreset || {};
    dataPreset.optionalDiceModifiers = dataPreset.optionalDiceModifiers || [];
    dataPreset.optionalDiceModifiers.push({
        dice: engagementBonus,
        optional: true,
        label: 'Engagement Bonus',
    });
    dataPreset.optionalObModifiers = dataPreset.optionalObModifiers || [];
    dataPreset.optionalObModifiers.push({
        obstacle: positionPenalty,
        optional: true,
        label: 'Weapon Disadvantage',
    });
    (dataPreset.offerSplitPool = true),
        (dataPreset.deedsPoint = actor.system.deeds !== 0),
        (dataPreset.personaOptions = actor.system.persona
            ? Array.from([
                  ...Array(Math.min(actor.system.persona, 3)).keys(),
                  Math.min(actor.system.persona, 3),
              ])
            : undefined);

    if (type === 'skill') {
        if (!itemId) {
            return notifyError(
                'No Item Specified',
                'Item id must be specified when rolling an attack with a weapon or spell'
            );
        }
        const item = actor.items.get(itemId) as BWItem;
        if (!item) {
            return notifyError(
                'Missing Item',
                `Item linked  - id ${itemId} - appears not to exist on the actor's sheet.`
            );
        }
        switch (item.type) {
            case 'melee weapon':
            case 'ranged weapon':
                if (
                    item.type === 'melee weapon' &&
                    typeof attackIndex === 'undefined'
                ) {
                    throw Error(
                        'A Melee Weapon attack was given without specifying the melee attack index.'
                    );
                }
                // handle melee attack at the given index.
                const weapon = item as MeleeWeapon | RangedWeapon;
                const weaponSkill = actor.items.get<Skill>(
                    weapon.system.skillId
                );

                if (!weaponSkill) {
                    return notifyError(
                        'No Associated Skill',
                        "In order for a skill test to be rolled, a weapon or spell has to be associated with a skill. Check the Actor's sheet to make sure the selected weapon has a chosen skill."
                    );
                }

                if (actor.type === 'character') {
                    return handleWeaponRoll({
                        actor: actor as BWCharacter,
                        weapon,
                        skill: weaponSkill,
                        attackIndex,
                        dataPreset,
                    });
                }
                return handleNpcWeaponRoll({
                    actor: actor as Npc,
                    weapon,
                    skill: weaponSkill,
                    attackIndex,
                    dataPreset,
                });

            case 'spell':
                const spell = actor.items.get(itemId) as Spell;
                const skill = actor.items.get(spell?.system.skillId) as Skill;
                if (actor.type === 'character') {
                    return handleSpellRoll({
                        actor: actor as BWCharacter,
                        spell,
                        skill,
                        dataPreset,
                    });
                }
                return handleNpcSpellRoll({
                    actor: actor as Npc,
                    spell,
                    skill,
                    dataPreset,
                });
            default:
                throw Error(
                    `Unexpected item type (${item.type}) passed to fight attack roll action`
                );
        }
    }
    // speed, power, or agility roll
    if (actor.type === 'npc') {
        // npc specific code
        const dice = parseInt(
            foundry.utils.getProperty(actor, `system.${type}.exp`)
        );
        const shade = foundry.utils.getProperty(
            actor,
            `system.${type}.shade`
        ) as ShadeString;
        return handleNpcStatRoll({
            dice,
            shade,
            open: false,
            statName: game.i18n.localize('BW.' + type),
            accessor: type,
            actor: actor as Npc,
            dataPreset,
        });
    }
    const stat = foundry.utils.getProperty(actor, `system.${type}`) as Ability;

    if (type === 'steel') {
        return handleAttrRoll({
            actor: actor as BWCharacter,
            stat: actor.system.steel,
            attrName: 'Steel',
            accessor: type,
            dataPreset,
        });
    }

    return handleStatRoll({
        actor: actor as BWCharacter,
        statName: type.titleCase(),
        stat,
        accessor: type,
        dataPreset,
    });
}

export interface FightRollOptions {
    actor: BWActor;
    type: FightAttr;
    itemId?: string;
    attackIndex?: number;
    engagementBonus: number;
    positionPenalty: number;
    dataPreset?: Partial<RollDialogData>;
}
