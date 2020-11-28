import { BWCharacter } from "../actors/BWCharacter.js";
import { Npc } from "../actors/Npc.js";
import { Ability, BWActor } from "../actors/BWActor.js";

import { handleNpcStatRoll, NpcStatName } from "../rolls/npcStatRoll.js";
import { RollDialogData } from "../rolls/rolls.js";
import { StatDragData } from "../helpers.js";
import { getMacroRollPreset, MacroData } from "./Macro.js";
import { handleCirclesRoll } from "../rolls/rollCircles.js";
import { handleResourcesRoll } from "../rolls/rollResources.js";
import { handleStatRoll } from "../rolls/rollStat.js";
import { handleAttrRoll } from "../rolls/rollAttribute.js";

export function CreateStatMacro(data: StatDragData): MacroData | null {
    if (!data.actorId) {
        return null;
    }

    return {
        name: `Test ${data.data.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollStat("${data.actorId}", "${data.data.path}", "${data.data.name}");`,
        img: defaultIcons[data.data.path] || "icons/commodities/biological/organ-heart-red.webp"
    };
}

export function RollStatMacro(actorId: string, statPath: string, statName: string): void {
    const actor = game.actors.find(a => a.id === actorId) as BWActor;
    if (!actor) {
        ui.notifications.notify("Unable to find actor linked to this macro. Were they deleted?", "error");
        return;
    }

    const stat = getProperty(actor.data, statPath) as Ability | undefined;

    if (!stat) {
        ui.notifications.notify(`Stat appears to be missing from the actor somehow. Was looking for ${statPath}.`, "error");
        return;
    }
    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);

    if (actor.data.type === "character") {
        const char = actor as BWCharacter;
        if (statPath === "data.circles") {
            handleCirclesRoll({ actor: char, stat, dataPreset });
        } else if (statPath === "data.resources") {
            handleResourcesRoll({ actor: char, stat, dataPreset });
        } else if (["power", "agility", "forte", "will", "perception", "speed"].some(s => statPath.indexOf(s) !== -1)) {
            handleStatRoll({ actor: char, stat, statName, accessor: statPath, dataPreset });
        } else {
            handleAttrRoll({ actor: char, stat, accessor: statPath, attrName: statName, dataPreset });
        }
    } else {
        handleNpcStatRoll({ actor: actor as Npc, dice: stat.exp, shade: stat.shade, open: stat.open, statName: statName as NpcStatName, dataPreset });
    }
}

const defaultIcons = {
    "data.power": "icons/commodities/claws/claw-bear-brown.webp",
    "data.forte": "icons/commodities/biological/organ-stomach.webp",
    "data.perception": "icons/commodities/biological/eye-blue.webp",
    "data.will": "icons/commodities/gems/gem-faceted-radiant-red.webp",
    "data.speed": "icons/commodities/biological/wing-bird-white.webp",
    "data.agility": "icons/environment/settlement/target.webp",
    "data.health": "icons/commodities/biological/organ-heart-red.webp",
    "data.steel": "icons/equipment/shield/heater-steel-worn.webp",
    "data.circles": "icons/environment/people/group.webp",
    "data.resources": "icons/commodities/currency/coins-plain-stack-gold-yellow.webp",
    "data.custom1": "icons/environment/people/cleric-orange.webp",
    "data.custom2": "icons/environment/people/cleric-orange.webp",
};
