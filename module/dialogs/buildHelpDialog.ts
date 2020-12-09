import { BWActor } from "../actors/BWActor.js";
import { ModifierDialog } from "./ModifierDialog.js";

export async function buildHelpDialog({ exponent, path, skillId, actor }: HelpDialogData): Promise<unknown> {
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
                callback: () => {
                    registerHelpEntry({ path, skillId, actor, exponent});
                }
            }
        }
    }).render(true);
}

async function registerHelpEntry({ path, skillId, actor, exponent }: HelpEntryData): Promise<void> {
    const modifiers: ModifierDialog = game.burningwheel.modifiers;

    modifiers.addHelp({
        dice: exponent,
        skillId,
        path,
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
    path?: string;
    skillId?: string;
    actor: BWActor;
    exponent: number;
}