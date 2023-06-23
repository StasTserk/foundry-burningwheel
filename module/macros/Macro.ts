import { RollDialogData } from '../rolls/rolls';
import { DragData } from '../helpers';
import { CreateSkillRollMacro, RollSKillMacro } from './SkillMacro';
import * as constants from '../constants';
import { DifficultyDialog } from '../dialogs/DifficultyDialog';
import { BWActor } from '../actors/BWActor';
import { CreateMeleeRollMacro, RollMeleeMacro } from './MeleeMacro';
import { CreateRangedRollMacro, RollRangedMacro } from './RangedMacro';
import { CreateSpellRollMacro, RollSpellMacro } from './SpellMacro';
import { CreateEditMacro, RollEditMacro } from './EditMacro';
import { ItemType } from '../items/item';
import { CreateStatMacro, RollStatMacro } from './StatMacro';
import { ModifierDialog } from '../dialogs/ModifierDialog';
import { TypeMissing } from '../../types/index';

export function CreateBurningWheelMacro(data: DragData, slot: string): boolean {
    if (!handlers[data.type || '']) {
        return true;
    }
    createAndAssignMacro(data, slot);
    return false;
}

async function createAndAssignMacro(
    data: DragData,
    slot: string
): Promise<void> {
    const macroData = handlers[data.type || ''](data);
    if (macroData) {
        // Check if an identical macro already exists. Create it otherwise.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let macro = game.macros?.contents.find(
            (m) =>
                m.name === macroData.name &&
                (m as TypeMissing).command === macroData.command
        );
        if (!macro) {
            macro = (await Macro.create<Macro, Partial<Macro.Data>>({
                name: macroData.name,
                img: macroData.img,
                command: macroData.command,
                flags: macroData.flags,
                type: 'script',
            })) as Macro;
        }
        await game.user?.assignHotbarMacro(macro, slot);
    }
}

function CreateItemMacro(dragData: DragData): MacroData | null {
    const itemType = dragData.data?.type || '';
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

const handlers: Record<string, (data: DragData) => MacroData | null> = {
    Item: CreateItemMacro,
    skill: CreateSkillRollMacro,
    spell: CreateSpellRollMacro,
    Melee: CreateMeleeRollMacro,
    Ranged: CreateRangedRollMacro,
    Stat: CreateStatMacro,

    possession: CreateEditMacro,
    property: CreateEditMacro,
    armor: CreateEditMacro,
    'melee weapon': CreateEditMacro,
    'ranged weapon': CreateEditMacro,
    trait: CreateEditMacro,
    relationship: CreateEditMacro,
    reputation: CreateEditMacro,
    affiliation: CreateEditMacro,
    belief: CreateEditMacro,
    instinct: CreateEditMacro,
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
    if (
        game.settings.get(
            constants.systemName,
            constants.settings.useGmDifficulty
        )
    ) {
        const difficultyDialog: DifficultyDialog =
            game.burningwheel.gmDifficulty;
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
        dataPreset.optionalObModifiers = helpDialog.mods.map((m) => {
            return { obstacle: m.amount, label: m.name, optional: true };
        });
    }
    dataPreset.deedsPoint = actor.system.deeds !== 0;
    if (actor.system.persona) {
        dataPreset.personaOptions = Array.from(
            Array(Math.min(actor.system.persona, 3)).keys()
        );
    }

    return dataPreset;
}

export function getImage(image: string, type: ItemType): string {
    if (image === 'icons/svg/mystery-man.svg') {
        return constants.defaultImages[type];
    }
    return image;
}
