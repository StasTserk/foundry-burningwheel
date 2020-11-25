import { RollDialogData } from "../rolls/rolls.js";
import { DragData } from "../helpers.js";
import { CreateSkillRollMacro, RollSKillMacro } from "./SkillMacro.js";
import * as constants from "../constants.js";
import { DifficultyDialog } from "../dialogs/difficultyDialog.js";
import { BWActor } from "module/actors/bwactor.js";

export async function CreateBurningWheelMacro(data: DragData, slot: number): Promise<boolean> {
    if (!handlers[data.type]) {
        return true;
    }

    const macroData = handlers[data.type](data);
    if (macroData) {
        // Create or reuse existing macro
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let macro = game.macros.entities.find(m => (m.name === macroData.name) && ((m as any).command === macroData.command));
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
}

const handlers: Record<string, (data: DragData) => MacroData | null> = {
    "Item": CreateItemMacro,
    "skill": CreateSkillRollMacro
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