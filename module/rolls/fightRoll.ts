import { BWItem } from "../items/item.js";
import { Ability, BWActor } from "../bwactor.js";
import { handleStatRoll } from "./rollStat.js";
import { notifyError, ShadeString } from "../helpers.js";
import { handleNpcStatRoll } from "./npcStatRoll.js";
import { Npc } from "../npc.js";
import { RollDialogData } from "./rolls.js";
import { handleSpellRoll } from "./rollSpell.js";
import { BWCharacter } from "../character.js";
import { handleNpcSpellRoll, handleNpcWeaponRoll } from "./npcSkillRoll.js";
import { handleWeaponRoll } from "./rollWeapon.js";
import { MeleeWeapon } from "../items/meleeWeapon.js";
import { RangedWeapon } from "../items/rangedWeapon.js";
import { Skill } from "../items/skill.js";
import { Spell } from "../items/spell.js";

export async function handleFightRoll({actor, type, itemId, attackIndex, positionPenalty, engagementBonus }: FightRollOptions): Promise<unknown> {
    const dataPreset: Partial<RollDialogData> = {
        optionalDiceModifiers: [ {
            dice: engagementBonus, optional: true, label: "Engagement Bonus",
        }],
        optionalObModifiers: [ {
            obstacle: positionPenalty, optional: true, label: "Weapon Disadvantage"
        }],
        offerSplitPool: true,
        deedsPoint: actor.data.data.deeds !== 0,
        personaOptions: actor.data.data.persona ? Array.from(Array(Math.min(actor.data.data.persona, 3)).keys()) : undefined
    };
    if (type === "skill") {
        if (!itemId) {
            return notifyError("No Item Specified", "Item id must be specified when rolling an attack with a weapon or spell");
        }
        const item = actor.getOwnedItem(itemId) as BWItem;
        if (!item) {
            return notifyError("Missing Item", `Item linked  - id ${itemId} - appears not to exist on the actor's sheet.`);
        }
        switch (item.type) {
            case "melee weapon": case "ranged weapon":
                if (item.data.type === "melee weapon" && typeof attackIndex === 'undefined') {
                    throw Error("A Melee Weapon attack was given without specifying the melee attack index.");
                }
                // handle melee attack at the given index.
                const weapon = item as MeleeWeapon | RangedWeapon;
                const weaponSkill = actor.getOwnedItem(item.data.data.skillId) as Skill;

                if (!weaponSkill) {
                    return notifyError("No Associated Skill", "In order for a skill test to be rolled, a weapon or spell has to be associated with a skill. Check the Actor's sheet to make sure the selected weapon has a chosen skill.");
                }

                if (actor.data.type === "character") { 
                    return handleWeaponRoll({
                        actor: (actor as BWActor & BWCharacter),
                        weapon,
                        skill: weaponSkill,
                        attackIndex,
                        dataPreset
                    });
                }
                return handleNpcWeaponRoll({
                    actor:  (actor as BWActor & Npc),
                    weapon,
                    skill: weaponSkill,
                    attackIndex,
                    dataPreset,
                });

            case "spell":
                const spell = actor.getOwnedItem(itemId) as Spell;
                const skill = actor.getOwnedItem(spell?.data.data.skillId) as Skill;
                if (actor.data.type === "character") {
                    return handleSpellRoll({ actor: (actor as BWActor & BWCharacter), spell, skill, dataPreset});
                }
                return handleNpcSpellRoll({
                    actor: actor as BWActor & Npc, spell, skill, dataPreset
                });
            default:
                throw Error(`Unexpected item type (${item.type}) passed to fight attack roll action`);
        }
    }
    // speed, power, or agility roll
    if (actor.data.type === "npc") {
        // npc specific code
        const dice = parseInt(getProperty(actor, `data.data.${type}.exp`));
        const shade = getProperty(actor, `data.data.${type}.shade`) as ShadeString;
        return handleNpcStatRoll({
            dice,
            shade,
            open: false,
            statName: type,
            actor: (actor as Npc),
            dataPreset
        });
    }
    const accessor = `data.${type}`;
    const stat = getProperty(actor, `data.${accessor}`) as Ability;
    return handleStatRoll({
        actor: actor as BWCharacter,
        statName: type.titleCase(),
        stat,
        accessor,
        dataPreset
    });
}

export interface FightRollOptions {
    actor: BWActor,
    type: "speed" | "agility" | "power" | "skill",
    itemId?: string;
    attackIndex?: number;
    engagementBonus: number;
    positionPenalty: number;
}