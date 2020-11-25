import { RollDialogData } from "../rolls/rolls.js";
import { DragData } from "../helpers.js";
import { CreateSkillRollMacro, RollSKillMacro } from "./SkillMacro.js";
import * as constants from "../constants.js";
import { DifficultyDialog } from "../dialogs/difficultyDialog.js";
import { BWActor } from "../actors/bwactor.js";
import { CreateMeleeRollMacro, RollMeleeMacro } from "./MeleeMacro.js";
import { CreateRangedRollMacro, RollRangedMacro } from "./RangedMacro.js";
import { CreateSpellRollMacro, RollSpellMacro } from "./SpellMacro.js";
import { CreateEditMacro, RollEditMacro } from "./EditMacro.js";

export async function CreateBurningWheelMacro(data: DragData, slot: number): Promise<boolean> {
    if (!handlers[data.type]) {
        return true;
    }

    const macroData = handlers[data.type](data);
    if (macroData) {
        // Check if an identical macro already exists. Create it otherwise.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let macro = game.macros.entities.find(m => (m.name === macroData.name) && ((m.data as any).command === macroData.command));
        if (!macro) {
            macro = await Macro.create({
                name: macroData.name,
                type: macroData.type,
                img: macroData.img,
                command: macroData.command,
                flags: macroData.flags
            }) as Macro;
        }
        await game.user.assignHotbarMacro(macro, slot);
    }
    return false;
}

function CreateItemMacro(data: DragData): MacroData | null {
    const itemType = data.data?.type || "";
    if (handlers[itemType]) {
        return handlers[itemType](data);
    }
    return null;
}

export function RegisterMacros(): void {
    game.burningwheel.macros = game.burningwheel.macros || {};
    game.burningwheel.macros['rollSkill'] = RollSKillMacro;
    game.burningwheel.macros['rollMelee'] = RollMeleeMacro;
    game.burningwheel.macros['rollRanged'] = RollRangedMacro;
    game.burningwheel.macros['rollSpell'] = RollSpellMacro;
    game.burningwheel.macros['showOwnedItem'] = RollEditMacro;
}

const handlers: Record<string, (data: DragData) => MacroData | null> = {
    "Item": CreateItemMacro,
    "skill": CreateSkillRollMacro,
    "spell": CreateSpellRollMacro,
    "Melee": CreateMeleeRollMacro,
    "Ranged": CreateRangedRollMacro,

    "possession": CreateEditMacro,
    "property": CreateEditMacro,
    "armor": CreateEditMacro,
    "melee weapon": CreateEditMacro,
    "ranged weapon": CreateEditMacro,
    "trait": CreateEditMacro,
    "relationship": CreateEditMacro,
    "reputation": CreateEditMacro,
    "affiliation": CreateEditMacro
};

export interface MacroData {
    name: string;
    type: string;
    img: string;
    command: string;
    flags?: Record<string, string | number>;
}

/* ============== Macro Helpers =============== */
export function getMacroRollPreset(actor: BWActor): Partial<RollDialogData> {
    const dataPreset: Partial<RollDialogData> = {};
    if (game.settings.get(constants.systemName, constants.settings.useGmDifficulty)) {
        const difficultyDialog: DifficultyDialog = game.burningwheel.gmDifficulty;
        if (difficultyDialog.splitPool) {
            dataPreset.offerSplitPool = true;
        }
        if (difficultyDialog.customDiff) {
            dataPreset.showDifficulty = true;
            dataPreset.showObstacles = true;
        }
        if (difficultyDialog.noTrack) {
            dataPreset.skipAdvancement = true;
        }
        dataPreset.optionalObModifiers = difficultyDialog.mods.map(m => { return { obstacle: m.amount, label: m.name, optional: true }; });
    }
    dataPreset.deedsPoint = actor.data.data.deeds !== 0;
    if (actor.data.data.persona) {
        dataPreset.personaOptions = Array.from(Array(Math.min(actor.data.data.persona, 3)).keys());
    }

    return dataPreset;
}