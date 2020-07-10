import { TracksTests } from "./actor.js";

export function updateTestsNeeded(ability: TracksTests) {
    const values = AbilityLookup[ability.exp] || { r: 1, d: 1, c: 1};
    ability.routineNeeded = values.r;
    ability.challengingNeeded = values.c;
    ability.difficultNeeded = values.d;
}

export function slugify(name: string): string {
    return name.trim().replace(" ", "-");
}

export function toDictionary(list: string[]): { [key:string]:string } {
    const o: { [key:string]:string } = {};
    list.forEach(s => o[s] = s.titleCase());
    return o;
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
