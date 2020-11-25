import { Skill } from "../items/skill.js";
import { ItemDragData } from "../helpers.js";
import { getMacroRollPreset, MacroData } from "./Macro.js";
import { BWActor } from "../actors/bwactor.js";
import { BWCharacter } from "../actors/character.js";
import { handleNpcSpellRoll } from "../rolls/npcSkillRoll.js";
import { Npc } from "../actors/npc.js";
import { RollDialogData } from "../rolls/rolls.js";
import { Spell, SpellDataRoot } from "../items/spell.js";
import { handleSpellRoll } from "../rolls/rollSpell.js";

export function CreateSpellRollMacro(data: ItemDragData): MacroData | null {
    if (!data.actorId) {
        return null;
    }
    const skillData = data.data as SpellDataRoot & { _id: string };
    return {
        name: `Cast ${skillData.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollSpell("${data.actorId}", "${data.id}");`,
        img: skillData.img
    };
}

export function RollSpellMacro(actorId: string, skillId: string): void {
    const actor = game.actors.find(a => a.id === actorId) as BWActor;
    const spell = actor.getOwnedItem(skillId) as Spell;
    const skill = actor.getOwnedItem(spell.data.data.skillId) as Skill;

    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);
    if (actor.data.type === "character") {
        handleSpellRoll({ actor: actor as BWCharacter, skill, spell, dataPreset});
    } else {
        handleNpcSpellRoll({ actor: actor as Npc, skill, spell, dataPreset });
    }
}