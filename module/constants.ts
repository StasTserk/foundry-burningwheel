import { NewItemData } from "./actor.js";
import { toDictionary } from "./helpers.js";
import { MeleeWeaponData } from "./items/meleeWeapon.js";

export const weaponSpeeds = [
    "shortest",
    "short",
    "long",
    "longer",
    "longest"
];
export const weaponSpeedSelect = toDictionary(weaponSpeeds);

const fistData: MeleeWeaponData = {
    weaponLength: "shortest",
    power: "0",
    quality: "basic",
    add: "2",
    vsArmor: "0",
    handedness: "one",
    description: "Your bare fist",
    baseOb: "1",
    weaponSpeed: "X"
};
export const bareFistData: NewItemData = {
    name: "Bare Fist",
    type: "melee weapon",
    data: fistData
};

export const traitTypes = [
    "character",
    "call-on",
    "die"
];
export const traitTypeSelect = toDictionary(traitTypes);

export const skillTypes = [
    "academic",
    "artisan",
    "artist",
    "craftsman",
    "forester",
    "martial",
    "medicinal",
    "military",
    "musical",
    "peasant",
    "physical",
    "schoolofthought",
    "seafaring",
    "special",
    "social",
    "sorcerous",
    "training"
];
export const skillTypeSelect = toDictionary(skillTypes);

export const skillRoots = [
    "power",
    "agility",
    "will",
    "perception",
    "forte",
    "speed"
];
export const skillRootSelect = toDictionary(skillRoots);

export const gearQuality = [
    "basic",
    "poor",
    "run of the mill",
    "superior"
];
export const gearQualitySelect = toDictionary(gearQuality);

export const armorLocations = [
    "head",
    "torso",
    "right arm",
    "left arm",
    "right leg",
    "left leg",
    "shield"
];
export const armorLocationSelect = toDictionary(armorLocations);

export const equipmentSheetOrder = {
    "melee weapon": 1,
    "ranged weapon": 1,
    "armor": 2,
    "possession": 3,
    "property": 4
};
