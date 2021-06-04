declare function mergeObject<T>(
    original: T,
    other?: Partial<T>,
    {
      insertKeys,
      insertValues,
      overwrite,
      recursive,
      inplace,
      enforceTypes
    }?: {
      /**
       * Control whether to insert new top-level objects into the resulting structure
       * which do not previously exist in the original object.
       * @defaultValue `true`
       */
      insertKeys?: boolean;
  
      /**
       * Control whether to insert new nested values into child objects in the resulting
       * structure which did not previously exist in the original object.
       * @defaultValue `true`
       */
      insertValues?: boolean;
  
      /**
       * Control whether to replace existing values in the source, or only merge values
       * which do not already exist in the original object.
       * @defaultValue `true`
       */
      overwrite?: boolean;
  
      /**
       * Control whether to merge inner-objects recursively (if true), or whether to
       * simply replace inner objects with a provided new value.
       * @defaultValue `true`
       */
      recursive?: boolean;
  
      /**
       * Control whether to apply updates to the original object in-place (if true),
       * otherwise the original object is duplicated and the copy is merged.
       * @defaultValue `true`
       */
      inplace?: boolean;
  
      /**
       * Control whether strict type checking requires that the value of a key in the
       * other object must match the data type in the original data to be merged.
       * @defaultValue `false`
       */
      enforceTypes?: boolean;
    },
    _d?: number
): T;
  
declare let game: BWGame;

declare class BWGame extends Game {
    burningwheel: {
        useGmDifficulty: boolean;
        gmDifficulty: DifficultyDialog;
        dow: DuelOfWitsDialog;
        fight: FightDialog;
        rangeAndCover: RangeAndCoverDialog;
        modifiers: ModifierDialog;
        macros: { [k: string]: (...args: unknown[]) => void}
    };

    /** Optional Dice so Nice module */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dice3d?: any;

    packs?: Collection<CompendiumCollection<FoundryDocument>>;
}

declare namespace ClientSettings {
    interface Values {
        'core.combatTrackerConfig': Combat.ConfigValue;
        'version': string;
        'dow-data': string;
        'fight-data': string;
        'rnc-data': string;
        'useGmDifficulty': boolean;
        'obstacleList': string;
        'itemImages:': boolean;
        'extendedTestData': string;
        [key: string]: unknown;
    }
}
