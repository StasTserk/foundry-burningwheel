import { TracksTests } from "./actor.js";
import { DisplayClass } from "./items/item.js";

export function updateTestsNeeded(ability: TracksTests & DisplayClass) {
    const values = AbilityLookup[ability.exp] || { r: 1, d: 1, c: 1};
    ability.routineNeeded = values.r;
    ability.challengingNeeded = values.c;
    ability.difficultNeeded = values.d;
    ability.cssClass = canAdvance(ability) ? "can-advance" : "";
}

export function slugify(name: string): string {
    return name.trim().replace(" ", "-");
}

export function toDictionary(list: string[]): { [key:string]:string } {
    const o: { [key:string]:string } = {};
    list.forEach(s => o[s] = s.titleCase());
    return o;
}

export function canAdvance(skill: TracksTests): boolean {
    const enoughRoutine = parseInt(skill.routine, 10) >= skill.routineNeeded;
    const enoughDifficult = parseInt(skill.difficult, 10) >= skill.difficultNeeded;
    const enoughChallenging = parseInt(skill.challenging, 10) >= skill.challengingNeeded;

    if (parseInt(skill.exp, 10) < 5) {
        // need only enough difficult or routine, not both
        return enoughRoutine && (enoughDifficult || enoughChallenging);
    }
    // otherwise, need both routine and difficult tests to advance, don't need routine anymore
    return enoughDifficult && enoughChallenging;
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
