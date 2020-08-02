import { TracksTests } from "./actor.js";
import { ArmorRootData, BWItem, DisplayClass, ItemType, Skill } from "./items/item.js";

export function updateTestsNeeded(ability: TracksTests & DisplayClass, needRoutines = true, woundDice = 0) {
    const values = AbilityLookup[ability.exp] || { r: 1, d: 1, c: 1};
    ability.routineNeeded = values.r;
    ability.challengingNeeded = values.c;
    ability.difficultNeeded = values.d;
    ability.cssClass = canAdvance(ability, needRoutines) ? "can-advance" : "";
    if (parseInt(ability.exp, 10) <= woundDice) {
        ability.cssClass += " wound-disabled";
    }
}

export function slugify(name: string): string {
    return name.trim().replace(" ", "-");
}

export function toDictionary(list: string[]): { [key:string]:string } {
    const o: { [key:string]:string } = {};
    list.forEach(s => o[s] = s.titleCase());
    return o;
}

export function canAdvance(skill: TracksTests, needRoutines: boolean = true): boolean {
    const enoughRoutine = (parseInt(skill.routine, 10) >= (skill.routineNeeded || 0 ));
    const enoughDifficult = parseInt(skill.difficult, 10) >= (skill.difficultNeeded || 0);
    const enoughChallenging = parseInt(skill.challenging, 10) >= (skill.challengingNeeded || 0);

    if (parseInt(skill.exp, 10) === 0) {
        return enoughRoutine || enoughDifficult || enoughChallenging;
    }

    if (parseInt(skill.exp, 10) < 5 && needRoutines) {
        // need only enough difficult or routine, not both
        return enoughRoutine && (enoughDifficult || enoughChallenging);
    }
    // otherwise, need both routine and difficult tests to advance, don't need routine anymore
    return enoughDifficult && enoughChallenging;
}

export function addTestToSkill(
        skill: Skill,
        difficulty: TestString) {
    switch (difficulty) {
        case "Routine":
            if (parseInt(skill.data.data.routine, 10) < (skill.data.data.routineNeeded || 0)) {
                return skill.update({ "data.routine": parseInt(skill.data.data.routine, 10) + 1 }, {});
            }
            break;
        case "Difficult":
            if (parseInt(skill.data.data.difficult, 10) < (skill.data.data.difficultNeeded || 0)) {
                return skill.update({ "data.difficult": parseInt(skill.data.data.difficult, 10) + 1 }, {});
            }
            break;
        case "Challenging":
            if (parseInt(skill.data.data.challenging, 10) < (skill.data.data.challengingNeeded || 0)) {
                return skill.update({ "data.challenging": parseInt(skill.data.data.challenging, 10) + 1 }, {});
            }
            break;
        case "Routine/Difficult":
            if (parseInt(skill.data.data.routine, 10) < (skill.data.data.routineNeeded || 0)) {
                return skill.update({ "data.routine": parseInt(skill.data.data.routine, 10) + 1 }, {});
            } else if (parseInt(skill.data.data.difficult, 10) < (skill.data.data.difficultNeeded || 0)) {
                return skill.update({ "data.difficult": parseInt(skill.data.data.difficult, 10) + 1 }, {});
            }
            break;
    }
}

export function advanceSkill(skill: Skill) {
    const exp = parseInt(skill.data.data.exp, 10);
    return skill.update({ "data.routine": 0, "data.difficult": 0, "data.challenging": 0, "data.exp": exp + 1 }, {});
}

export function difficultyGroup(dice: number, difficulty: number): TestString {
    if (difficulty > dice) {
        return "Challenging";
    }
    if (dice === 1) {
        return "Routine/Difficult";
    }
    if (dice === 2) {
        return difficulty === 2 ? "Difficult" : "Routine";
    }

    let spread = 1;
    if (dice > 6) {
        spread = 3;
    } else if (dice > 3) {
        spread = 2;
    }

     return (dice - spread >= difficulty) ? "Routine" : "Difficult";
}

export function getArmorLocationDataFromItem(i: ArmorRootData): { [k: string]: ArmorRootData } {
    const data: any = {};
    data.head = i.data.hasHelm && i;
    data.torso = i.data.hasTorso && i;
    data.leftArm = i.data.hasLeftArm && i;
    data.rightArm = i.data.hasRightArm && i;
    data.rightLeg = i.data.hasRightLeg && i;
    data.leftLeg = i.data.hasLeftLeg && i;
    data.shield = i.data.hasShield && i;
    return data;
}

export async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

export function isStat(name: string) {
    return ([
        "forte", "power", "will", "perception", "agility", "speed"
    ].indexOf(name.toLowerCase()) !== -1);
}

export async function getItemsOfType<T extends BWItem>(itemType: ItemType): Promise<T[]> {
    const itemList = game.items.filter((i: T) => i.type === itemType) as T[];
    let compendiumItems: T[] = [];
    const packs = Array.from(game.packs.values());
    for (const pack of packs) {
        const packItems = await pack.getContent();
        compendiumItems = compendiumItems.concat(...packItems.filter((item: T) => item.type === itemType) as T[]);
    }
    return itemList.concat(...compendiumItems);
}

const AbilityLookup = {
    "1": { r: 1, d: 1, c: 1},
    "2": { r: 2, d: 1, c: 1},
    "3": { r: 3, d: 2, c: 1},
    "4": { r: 4, d: 2, c: 1},
    "5": { r: 0, d: 3, c: 1},
    "6": { r: 0, d: 3, c: 2},
    "7": { r: 0, d: 4, c: 2},
    "8": { r: 0, d: 4, c: 3},
    "9": { r: 0, d: 5, c: 3},
};

export type TestString = "Routine" | "Difficult" | "Challenging" | "Routine/Difficult";
export type ShadeString = "B" | "G" | "W";