import { NewItemData } from "./actors/BWActor.js";
import { toDictionary } from "./helpers.js";
import { MeleeWeaponData } from "./items/meleeWeapon.js";

export const weaponLengths = [
    "shortest",
    "short",
    "long",
    "longer",
    "longest"
];
export const weaponLengthSelect = toDictionary(weaponLengths);

const fistData: MeleeWeaponData = {
    quality: "basic",
    handedness: "one",
    description: "Your bare fist",
    shade: "B",
    attacks: [{
        attackName: "",
        power: 0,
        weaponLength: "shortest",
        add: 2,
        vsArmor: 0,
        weaponSpeed: "X",
    }],
    pointCost: 0,
    skillId: ""
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

export type SkillTypeString = 
    "academic" | "artisan" | "artist" | "craftsman" |
    "forester" | "martial" | "medicinal" | "military" |
    "musical" | "peasant" | "physical" | "schoolofthought" |
    "seafaring" | "special" | "social" | "sorcerous" | "training";

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
export type QualityString = "basic" | "superior" | "run of the mill" | "poor";

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

export const systemName = "burningwheel";
export const socketName = "system.burningwheel";
export const settings = {
    version: "version",
    duelData: "dow-data",
    fightData: "fight-data",
    rangeData: "rnc-data",
    useGmDifficulty: "useGmDifficulty",
    gmDifficulty: "gmDifficulty",
    obstacleList: "obstacleList",
    itemImages: "itemImages"
};

export const defaultImages = {
    "belief": "",
    "instinct": "",
    "trait": "icons/commodities/treasure/token-gold-gem-purple.webp",
    "skill": "icons/commodities/treasure/broach-lightning-gold.webp",
    "armor": "icons/equipment/chest/breastplate-collared-steel-grey.webp",
    "possession": "icons/equipment/feet/boots-collared-rounded-brown.webp",
    "property": "icons/environment/settlement/house-two-stories-small.webp",
    "relationship": "icons/environment/people/commoner.webp",
    "melee weapon": "icons/weapons/swords/greatsword-crossguard-silver.webp",
    "ranged weapon": "icons/weapons/bows/longbow-recurve-brown.webp",
    "reputation": "icons/commodities/treasure/medal-ribbon-gold-red.webp",
    "affiliation": "icons/commodities/treasure/crown-gold-laurel-wreath.webp",
    "spell": "icons/weapons/staves/staff-ornate-blue-jewel.webp",

    // trait images
    "character": "icons/sundries/gaming/rune-card.webp",
    "die": "icons/sundries/gaming/dice-runed-brown.webp",
    "call-on": "icons/sundries/gaming/playing-cards.webp"
};
