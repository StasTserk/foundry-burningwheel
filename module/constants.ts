import { NewItemData } from './actors/BWActor';
import { toDictionary } from './helpers';
import { MeleeWeaponData } from './items/meleeWeapon';

export const weaponLengths = ['shortest', 'short', 'long', 'longer', 'longest'];
export const weaponLengthSelect = {
    shortest: 'BW.weapon.shortest',
    short: 'BW.weapon.short',
    long: 'BW.weapon.long',
    longer: 'BW.weapon.longer',
    longest: 'BW.weapon.longest',
};

export const spellWeaponLengths = [...weaponLengths, 'As Missile'];
export const spellLengthSelect = {
    ...weaponLengthSelect,
    'as missile': 'BW.spell.asMissile',
};

const fistData: MeleeWeaponData = {
    quality: 'basic',
    handedness: 'one',
    description: 'Your bare fist',
    shade: 'B',
    attacks: [
        {
            attackName: '',
            power: 0,
            weaponLength: 'shortest',
            add: 2,
            vsArmor: 0,
            weaponSpeed: 'X',
        },
    ],
    pointCost: 0,
    skillId: '',
};
export const bareFistData: NewItemData = {
    name: 'Bare Fist',
    type: 'melee weapon',
    data: fistData,
};

export const traitTypes = ['character', 'call-on', 'die'];
export const traitTypeSelect = {
    character: 'BW.trait.character',
    'call-on': 'BW.trait.callOn',
    die: 'BW.trait.die',
};

export type SkillTypeString =
    | 'academic'
    | 'artisan'
    | 'artist'
    | 'craftsman'
    | 'forester'
    | 'martial'
    | 'medicinal'
    | 'military'
    | 'musical'
    | 'peasant'
    | 'physical'
    | 'schoolofthought'
    | 'seafaring'
    | 'special'
    | 'social'
    | 'sorcerous';

export const skillTypes = [
    'academic',
    'artisan',
    'artist',
    'craftsman',
    'forester',
    'martial',
    'medicinal',
    'military',
    'musical',
    'peasant',
    'physical',
    'schoolofthought',
    'seafaring',
    'special',
    'social',
    'sorcerous',
];
export const skillTypeSelect = {
    academic: 'BW.skill.academic',
    artisan: 'BW.skill.artisan',
    artist: 'BW.skill.artist',
    craftsman: 'BW.skill.craftsman',
    forester: 'BW.skill.forester',
    martial: 'BW.skill.martial',
    medicinal: 'BW.skill.medicinal',
    military: 'BW.skill.military',
    musical: 'BW.skill.musical',
    peasant: 'BW.skill.peasant',
    physical: 'BW.skill.physical',
    schoolofthought: 'BW.skill.schoolofthought',
    seafaring: 'BW.skill.seafaring',
    special: 'BW.skill.special',
    social: 'BW.skill.social',
    sorcerous: 'BW.skill.sorcerous',
};

export const skillRoots = [
    'power',
    'agility',
    'will',
    'perception',
    'forte',
    'speed',
];
export const skillRootSelect = {
    power: 'BW.power',
    agility: 'BW.agility',
    will: 'BW.will',
    perception: 'BW.perception',
    forte: 'BW.forte',
    speed: 'BW.speed',
};

export const gearQuality = ['basic', 'poor', 'run of the mill', 'superior'];
export const gearQualitySelect = {
    basic: 'BW.quality.basic',
    poor: 'BW.quality.poor',
    'run of the mill': 'BW.quality.rotm',
    superior: 'BW.quality.superior',
};
export type QualityString = 'basic' | 'superior' | 'run of the mill' | 'poor';

export const armorLocations = [
    'head',
    'torso',
    'right arm',
    'left arm',
    'right leg',
    'left leg',
    'shield',
];
export const armorLocationSelect = toDictionary(armorLocations);

export const equipmentSheetOrder = {
    'melee weapon': 1,
    'ranged weapon': 1,
    armor: 2,
    possession: 3,
    property: 4,
};

export const systemName = 'burningwheel';
export const socketName = 'system.burningwheel';
export const settings = {
    version: 'version',
    duelData: 'dow-data',
    fightData: 'fight-data',
    rangeData: 'rnc-data',
    useGmDifficulty: 'useGmDifficulty',
    gmDifficulty: 'gmDifficulty',
    obstacleList: 'obstacleList',
    itemImages: 'itemImages',
    extendedTestData: 'extendedTestData',
};

export const defaultImages = {
    belief: 'icons/sundries/flags/banner-green.webp',
    instinct: 'icons/sundries/flags/banner-yellow.webp',
    trait: 'icons/commodities/treasure/token-gold-gem-purple.webp',
    skill: 'icons/sundries/documents/document-official-capital.webp',
    armor: 'icons/equipment/chest/breastplate-collared-steel-grey.webp',
    possession: 'icons/equipment/feet/boots-collared-rounded-brown.webp',
    property: 'icons/environment/settlement/house-two-stories-small.webp',
    relationship: 'icons/environment/people/commoner.webp',
    'melee weapon': 'icons/weapons/swords/greatsword-crossguard-silver.webp',
    'ranged weapon': 'icons/weapons/bows/longbow-recurve-brown.webp',
    reputation: 'icons/commodities/treasure/medal-ribbon-gold-red.webp',
    affiliation: 'icons/commodities/treasure/crown-gold-laurel-wreath.webp',
    spell: 'icons/magic/light/hand-sparks-smoke-teal.webp',
    lifepath: 'icons/environment/people/group.webp',

    // trait images
    character: 'icons/sundries/gaming/rune-card.webp',
    die: 'icons/sundries/gaming/dice-runed-brown.webp',
    'call-on': 'icons/sundries/gaming/playing-cards.webp',
};

export const skillImages: { [k in SkillTypeString]: string } = {
    academic: 'icons/sundries/documents/document-official-capital.webp',
    artist: 'icons/tools/hand/brush-paint-brown-white.webp',
    artisan: 'icons/tools/hand/chisel-steel-brown.webp',
    craftsman: 'icons/skills/trades/smithing-anvil-silver-red.webp',
    forester: 'icons/magic/nature/leaf-elm-sparkle-glow-green.webp',
    martial: 'icons/skills/melee/weapons-crossed-swords-purple.webp',
    medicinal: 'icons/magic/life/cross-yellow-green.webp',
    military: 'icons/environment/people/infantry-army.webp',
    musical: 'icons/skills/trades/music-notes-sound-blue.webp',
    peasant: 'icons/skills/trades/farming-sickle-harvest-wheat.webp',
    physical: 'icons/magic/control/buff-strength-muscle-damage-orange.webp',
    schoolofthought: 'icons/sundries/books/book-worn-blue.webp',
    seafaring: 'icons/tools/nautical/anchor-blue-orange.webp',
    special: 'icons/skills/trades/academics-investigation-puzzles.webp',
    social: 'icons/skills/social/diplomacy-handshake-yellow.webp',
    sorcerous: 'icons/magic/fire/flame-burning-hand-white.webp',
};

export const RangeAndCoverActions: Record<string, string[]> = {
    'Move In': ['Close', 'Sneak In', 'Flank', 'Charge'],
    'Hold Ground': ['Maintain Distance', 'Hold Position'],
    'Move Out': ['Withdraw', 'Sneak Out', 'Fall Back', 'Retreat'],
    'Hesitation Actions': [
        'Fall Prone',
        'Run Screaming',
        'Stand & Drool',
        'Swoon',
    ],
};

export const FightActions: Record<string, string[]> = {
    'Attack Actions': [
        'Strike',
        'Great Strike',
        'Block and Strike',
        'Lock and Strike',
    ],
    'Defense Actions': ['Avoid', 'Block', 'Counter&shy;strike'],
    'Basic Actions': [
        'Assess',
        'Change Stance',
        'Charge/&shy;Tackle',
        'Draw Weapon',
        'Physical Action',
        'Push',
        'Lock',
        'Get Up',
    ],
    'Special Actions': ['Beat', 'Disarm', 'Feint', 'Throw Person'],
    'Shooting Actions': [
        'Throw Object/&shy;Weapon',
        'Aim',
        'Nock and Draw',
        'Reload',
        'Fire',
        'Release Bow',
        'Snapshot',
    ],
    'Magic Actions': ['Cast a Spell', 'Drop Spell', 'Command Spirit'],
    'Social Actions': ['Command', 'Intimidate'],
    'Hesitation Actions': [
        'Fall Prone',
        'Run Screaming',
        'Stand & Drool',
        'Swoon',
    ],
};

export const DuelOfWitsActions = {
    'Verbal Attack': ['Point', 'Dismiss'],
    'Verbal Defense': ['Avoid', 'Obfuscate', 'Rebuttal'],
    'Verbal Special': ['Feint', 'Incite'],
    Magic: ['Cast Spell', 'Command Spirit', 'Drop Spell', 'Sing, Howl, Pray'],
    Hesitation: ['Fall Prone', 'Run Screaming', 'Stand & Drool', 'Swoon'],
};
