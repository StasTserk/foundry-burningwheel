import { RollDialogData } from "../rolls/rolls.js";
import { DragData } from "../helpers.js";
import { CreateSkillRollMacro, RollSKillMacro } from "./SkillMacro.js";
import * as constants from "../constants.js";
import { DifficultyDialog } from "../dialogs/DifficultyDialog.js";
import { BWActor } from "../actors/BWActor.js";
import { CreateMeleeRollMacro, RollMeleeMacro } from "./MeleeMacro.js";
import { CreateRangedRollMacro, RollRangedMacro } from "./RangedMacro.js";
import { CreateSpellRollMacro, RollSpellMacro } from "./SpellMacro.js";
import { CreateEditMacro, RollEditMacro } from "./EditMacro.js";
import { ItemType } from "../items/item.js";
import { CreateStatMacro, RollStatMacro } from "./StatMacro.js";
import { ModifierDialog } from "../dialogs/ModifierDialog.js";
import { TypeMissing } from "../../types/index.js";

export function CreateBurningWheelMacro(data: DragData, slot: string): boolean {
    if (!handlers[data.type || ""]) {
        return true;
    }
    createAndAssignMacro(data, slot);
    return false;
}

async function createAndAssignMacro(data: DragData, slot: string): Promise<void> {
    const macroData = handlers[data.type || ""](data);
    if (macroData) {
        // Check if an identical macro already exists. Create it otherwise.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let macro = game.macros?.contents.find(m => (m.name === macroData.name) && ((m as TypeMissing).command === macroData.command));
        if (!macro) {
            macro = await Macro.create<Macro, Partial<Macro.Data>>({
                name: macroData.name,
                img: macroData.img,
                command: macroData.command,
                flags: macroData.flags,
                type: "script"
            }) as Macro;
        }
        await game.user?.assignHotbarMacro(macro, slot);
    }
}

function CreateItemMacro(dragData: DragData): MacroData | null {
    const itemType = dragData.data?.type || "";
    if (handlers[itemType]) {
        return handlers[itemType](dragData);
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
    game.burningwheel.macros['rollStat'] = RollStatMacro;
}

const handlers: Record<string, (data:  DragData) => MacroData | null> = {
    "Item": CreateItemMacro,
    "skill": CreateSkillRollMacro,
    "spell": CreateSpellRollMacro,
    "Melee": CreateMeleeRollMacro,
    "Ranged": CreateRangedRollMacro,
    "Stat": CreateStatMacro,

    "possession": CreateEditMacro,
    "property": CreateEditMacro,
    "armor": CreateEditMacro,
    "melee weapon": CreateEditMacro,
    "ranged weapon": CreateEditMacro,
    "trait": CreateEditMacro,
    "relationship": CreateEditMacro,
    "reputation": CreateEditMacro,
    "affiliation": CreateEditMacro,
    "belief": CreateEditMacro,
    "instinct": CreateEditMacro,
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
        const helpDialog: ModifierDialog = game.burningwheel.modifiers;

        if (difficultyDialog.splitPool) {
            dataPreset.offerSplitPool = true;
        }
        if (difficultyDialog.customDiff) {
            dataPreset.showDifficulty = true;
            dataPreset.showObstacles = true;
        }
        if (difficultyDialog.help) {
            dataPreset.addHelp = true;
        }
        dataPreset.optionalObModifiers = helpDialog.mods.map(m => { return { obstacle: m.amount, label: m.name, optional: true }; });
    }
    dataPreset.deedsPoint = actor.system.deeds !== 0;
    if (actor.system.persona) {
        dataPreset.personaOptions = Array.from(Array(Math.min(actor.system.persona, 3)).keys());
    }

    return dataPreset;
}

export function getImage(image: string, type: ItemType): string {
    if (image === "icons/svg/mystery-man.svg") {
        return constants.defaultImages[type];
    }
    return image;
}