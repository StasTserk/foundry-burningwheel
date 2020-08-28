import { BWActor, TracksTests } from "../actor.js";
import { BWActorSheet } from "../bwactor-sheet.js";
import * as helpers from "../helpers.js";
import { Skill, PossessionRootData } from "../items/item.js";
import {
    buildDiceSourceObject,
    buildRerollData,
    extractBaseData,
    extractCheckboxValue,
    getRollNameClass,
    RerollData,
    RollChatMessageData,
    RollDialogData,
    rollDice,
    templates,
    extractSelectString,
    maybeExpendTools,
    RollOptions,
} from "./rolls.js";

export async function handleSkillRoll({ target, sheet, dataPreset, extraInfo }: SkillRollOptions ): Promise<unknown> {
    const skillId = target.dataset.skillId || "";
    const skill = (sheet.actor.getOwnedItem(skillId) as Skill);
    const rollModifiers = sheet.actor.getRollModifiers(skill.name);
    const actor = sheet.actor as BWActor;
    const templateData: SkillDialogData = Object.assign({
        name: skill.data.name,
        difficulty: 3,
        bonusDice: 0,
        arthaDice: 0,
        woundDice: actor.data.data.ptgs.woundDice,
        obPenalty: actor.data.data.ptgs.obPenalty,
        skill: skill.data.data,
        needsToolkit: skill.data.data.tools,
        toolkits: actor.data.toolkits,
        forkOptions: actor.getForkOptions(skill.data.name),
        wildForks: actor.getWildForks(skill.data.name),
        optionalDiceModifiers: rollModifiers.filter(r => r.optional && r.dice),
        optionalObModifiers: rollModifiers.filter(r => r.optional && r.obstacle)
    }, dataPreset);
    const html = await renderTemplate(templates.skillDialog, templateData);
    return new Promise(_resolve =>
        new Dialog({
            title: `${skill.data.name} Test`,
            content: html,
            buttons: {
                roll: {
                    label: "Roll",
                    callback: async (dialogHtml: JQuery) =>
                        skillRollCallback(dialogHtml, skill, sheet, extraInfo)
                }
            }
        }).render(true)
    );
}

async function skillRollCallback(
    dialogHtml: JQuery, skill: Skill, sheet: BWActorSheet, extraInfo?: string): Promise<unknown> {

    const forks = extractCheckboxValue(dialogHtml, "forkOptions");
    const wildForks = extractWildForkBonus(dialogHtml);
    const baseData = extractBaseData(dialogHtml, sheet);
    const exp = parseInt(skill.data.data.exp, 10);
    const dieSources = buildDiceSourceObject(exp, baseData.aDice, baseData.bDice, forks, baseData.woundDice, 0);
    if (wildForks) {
        dieSources["Wild FoRKs"] = `+${wildForks}`;
    }
    if (skill.data.data.tools) {
        if (extractCheckboxValue(dialogHtml, "toolPenalty")) {
            baseData.penaltySources["No Tools"] = `+${baseData.diff}`;
            baseData.obstacleTotal += baseData.diff;
        }
        const toolkitId = extractSelectString(dialogHtml, "toolkitId") || '';
        const tools = sheet.actor.getOwnedItem(toolkitId);
        if (tools) {
            maybeExpendTools(tools);
        }
    }
    const dg = helpers.difficultyGroup(
        exp + baseData.bDice + forks + wildForks - baseData.woundDice + baseData.miscDice.sum,
        baseData.obstacleTotal);

    const roll = await rollDice(
        exp + baseData.bDice + baseData.aDice + forks - baseData.woundDice + baseData.miscDice.sum,
        skill.data.data.open,
        skill.data.data.shade);
    if (!roll) { return; }

    const wildForkDie = await rollWildFork(wildForks, skill.data.data.shade);
    const wildForkBonus = wildForkDie?.total || 0;
    const wildForkDice = wildForkDie?.rolls || [];

    const fateReroll = buildRerollData(sheet.actor, roll, undefined, skill._id);
    const callons: RerollData[] = sheet.actor.getCallons(skill.name).map(s => {
        return { label: s, ...buildRerollData(sheet.actor, roll, undefined, skill._id) as RerollData };
    });
    const success = (parseInt(roll.result) + wildForkBonus) >= baseData.obstacleTotal;

    const data: RollChatMessageData = {
        name: `${skill.name}`,
        successes: '' + (parseInt(roll.result, 10) + wildForkBonus),
        difficulty: baseData.diff,
        obstacleTotal: baseData.obstacleTotal,
        nameClass: getRollNameClass(skill.data.data.open, skill.data.data.shade),
        success,
        rolls: roll.dice[0].rolls,
        wildRolls: wildForkDice,
        difficultyGroup: dg,
        penaltySources: baseData.penaltySources,
        dieSources: { ...dieSources, ...baseData.miscDice.entries },
        fateReroll,
        callons,
        extraInfo
    };
    if (success || sheet.actor.data.successOnlyRolls.indexOf(skill.name.toLowerCase()) === -1) {
        await helpers.addTestToSkill(skill, dg);
        skill = sheet.actor.getOwnedItem(skill._id) as Skill; // update skill with new data
    }
    if (helpers.canAdvance(skill.data.data)) {
        Dialog.confirm({
            title: `Advance ${skill.name}?`,
            content: `<p>${skill.name} is ready to advance. Go ahead?</p>`,
            yes: () => helpers.advanceSkill(skill),
            // tslint:disable-next-line: no-empty
            no: () => { return; },
            defaultYes: true
        });
    }

    const messageHtml = await renderTemplate(templates.skillMessage, data);
    return ChatMessage.create({
        content: messageHtml,
        speaker: ChatMessage.getSpeaker({actor: sheet.actor})
    });
}

function extractWildForkBonus(html: JQuery) {
    return extractCheckboxValue(html, "wildForks");
}

async function rollWildFork(numDice: number, shade: helpers.ShadeString = 'B'): Promise<Die | undefined> {
    if (numDice <= 0) {
        return;
    }
    const tgt = shade === 'B' ? 3 : (shade === 'G' ? 2 : 1);
    const die = new AstrologyDie(6);
    die.roll(numDice);
    die.explode([6,1]);
    die.countSuccess(tgt, ">");
    if (game.dice3d) {
        game.dice3d.show({
            formula: `${die.results.length}d6`,
            results: die.rolls.map(r => r.roll),
            whisper: null,
            blind: false});
    }
    return new Promise(r => r(die));
}

interface SkillDialogData extends RollDialogData {
    skill: TracksTests;
    forkOptions: { name: string, amount: number }[];
    wildForks: { name: string, amount: number }[];
    needsToolkit: boolean;
    toolkits: PossessionRootData[];
}

export class AstrologyDie extends Die {
    get results(): number[] {
        return this.rolls.filter(r => !r.rerolled && !r.discarded).map(r => {
            if ( r.success === true ) return 1;
            else if (r.roll === 1) return -1;
            else return 0;
          });
    }
}

export interface SkillRollOptions extends RollOptions {
    dataPreset?: Partial<SkillDialogData>;
    extraInfo?: string;
}