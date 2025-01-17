export type SeededActors = 'Romeo' | 'Tybalt' | 'Hamlet' | 'Shakespeare';

export type SeededItems<
    T extends ItemType = ItemType,
    U extends string = string
> =
    | 'A Dirk'
    | "A Frickin' Gun"
    | 'Bastard'
    | 'Born Noble'
    | 'Dramatic'
    | 'Intimidation'
    | 'Mark of Privilege'
    | 'Persuasion'
    | 'Your Lordship'
    | `Test ${Capitalize<T>}`
    | `Modified ${Capitalize<T>}`
    | `Modified ${Capitalize<T>} ${U}`;

export type ItemType =
    | 'affiliation'
    | 'armor'
    | 'belief'
    | 'instinct'
    | 'lifepath'
    | 'melee weapon'
    | 'possession'
    | 'property'
    | 'ranged weapon'
    | 'relationship'
    | 'reputation'
    | 'skill'
    | 'spell'
    | 'trait';
