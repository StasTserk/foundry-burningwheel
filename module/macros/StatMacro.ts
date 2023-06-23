import { BWCharacter } from '../actors/BWCharacter';
import { Npc } from '../actors/Npc';
import { Ability, BWActor } from '../actors/BWActor';

import { handleNpcStatRoll, NpcStatName } from '../rolls/npcStatRoll';
import { RollDialogData } from '../rolls/rolls';
import { StatDragData } from '../helpers';
import { getMacroRollPreset, MacroData } from './Macro';
import { handleCirclesRoll } from '../rolls/rollCircles';
import { handleResourcesRoll } from '../rolls/rollResources';
import { handleStatRoll } from '../rolls/rollStat';
import { handleAttrRoll } from '../rolls/rollAttribute';

export function CreateStatMacro(dragData: StatDragData): MacroData | null {
    if (!dragData.actorId) {
        return null;
    }

    return {
        name: `Test ${dragData.data.name}`,
        type: 'script',
        command: `game.burningwheel.macros.rollStat("${dragData.actorId}", "${dragData.data.path}", "${dragData.data.name}");`,
        img:
            defaultIcons[dragData.data.path] ||
            'icons/commodities/biological/organ-heart-red.webp',
    };
}

export function RollStatMacro(
    actorId: string,
    statPath: string,
    statName: string
): void {
    const actor = game.actors?.find((a) => a.id === actorId) as BWActor;
    if (!actor) {
        ui.notifications?.notify(
            'Unable to find actor linked to this macro. Were they deleted?',
            'error'
        );
        return;
    }

    const stat = getProperty(actor.system, statPath) as Ability | undefined;

    if (!stat) {
        ui.notifications?.notify(
            `Stat appears to be missing from the actor somehow. Was looking for ${statPath}.`,
            'error'
        );
        return;
    }
    const dataPreset: Partial<RollDialogData> = getMacroRollPreset(actor);

    if (actor.type === 'character') {
        const char = actor as BWCharacter;
        if (statPath === 'circles') {
            handleCirclesRoll({ actor: char, stat, dataPreset });
        } else if (statPath === 'resources') {
            handleResourcesRoll({ actor: char, stat, dataPreset });
        } else if (
            ['power', 'agility', 'forte', 'will', 'perception', 'speed'].some(
                (s) => statPath.indexOf(s) !== -1
            )
        ) {
            handleStatRoll({
                actor: char,
                stat,
                statName,
                accessor: statPath,
                dataPreset,
            });
        } else {
            handleAttrRoll({
                actor: char,
                stat,
                accessor: statPath,
                attrName: statName,
                dataPreset,
            });
        }
    } else {
        handleNpcStatRoll({
            actor: actor as Npc,
            dice: stat.exp,
            shade: stat.shade,
            open: stat.open,
            statName: statName,
            accessor: statPath as NpcStatName,
            dataPreset,
        });
    }
}

const defaultIcons = {
    power: 'icons/commodities/claws/claw-bear-brown.webp',
    forte: 'icons/commodities/biological/organ-stomach.webp',
    perception: 'icons/commodities/biological/eye-blue.webp',
    will: 'icons/commodities/gems/gem-faceted-radiant-red.webp',
    speed: 'icons/commodities/biological/wing-bird-white.webp',
    agility: 'icons/environment/settlement/target.webp',
    health: 'icons/commodities/biological/organ-heart-red.webp',
    steel: 'icons/equipment/shield/heater-steel-worn.webp',
    circles: 'icons/environment/people/group.webp',
    resources: 'icons/commodities/currency/coins-plain-stack-gold-yellow.webp',
    custom1: 'icons/environment/people/cleric-orange.webp',
    custom2: 'icons/environment/people/cleric-orange.webp',
};
