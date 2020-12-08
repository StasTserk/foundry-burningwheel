import { extractCheckboxValue, extractMiscObs, extractNumber } from "../rolls/rolls.js";
import { BWActor } from "../actors/BWActor.js";
import { difficultyGroup } from "../helpers.js";
import { DifficultyDialog } from "./DifficultyDialog.js";
import { ModifierDialog } from "./ModifierDialog.js";

export async function buildHelpDialog({ exponent, path, skillId, actor,  }: HelpDialogData): Promise<unknown> {
    const data = {
        exponent
    };
    const content = await renderTemplate("systems/burningwheel/templates/dialogs/help-dialog.hbs", data);
    return new Dialog({
        title: "Add Helping Dice",
        content: content,
        buttons: {
            help: {
                label: "Help",
                callback: (html: JQuery) => {
                    registerHelpEntry({ html, path, skillId, actor, exponent});
                }
            }
        }
    }).render(true);
}

async function registerHelpEntry({ html, path, skillId, actor, exponent }: HelpEntryData): Promise<void> {
    const useCustomDifficulty = extractCheckboxValue(html, "forceCustomDifficulty");
    const difficultyDialog: DifficultyDialog = game.burningwheel.gmDifficulty;
    const modifiers: ModifierDialog = game.burningwheel.modifiers;

    const difficulty = useCustomDifficulty ? extractNumber(html, "difficulty") : difficultyDialog.difficulty;
    const moreObs = extractMiscObs(html).sum;

    const difficultySum = difficulty + moreObs;
    const dg = difficultyGroup(exponent, difficultySum);
    modifiers.addHelp({
        dice: exponent,
        skillId,
        path,
        difficulty: dg,
        actor,
        title: actor.name
    });
}

export interface HelpDialogData {
    exponent: number;
    path?: string;
    skillId?: string;
    actor: BWActor;
}

interface HelpEntryData {
    html: JQuery;
    path?: string;
    skillId?: string;
    actor: BWActor;
    exponent: number;
}