/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Define a fair n-sided die term that can be used as part of a Roll formula
 * @implements {DiceTerm}
 *
 * @example
 * // Roll 4 six-sided dice
 * let die = new Die({faces: 6, number: 4}).evaluate();
 */
declare class Die extends DiceTerm {
    /**
     * Track all dice which have ever been rolled
     * @deprecated use results instead
     * @example
     * let die = new Die(4);
     * die.roll(4);             // Roll 4d4
     * console.log(die.rolls);  // [{...}, {...}, {...}, {...}]
     */
    get rolls(): any[];

    /**
     * Any additional options which may be required by the Die
     */
    options: any;

    /**
     * Define regular expression option matches for the Die class
     */
    static rgx: {
        die: RegExp;
        reroll: RegExp;
        explode: RegExp;
        keep: RegExp;
        success: RegExp;
    };

    constructor(termData: {
        number?: number = 1;
        faces?: number = 6;
        modifiers?: string[] = [];
        options: any = {};
    });

    /**
     * The sum of all kept results
     *
     * @example
     * let die = new Die(20);
     * die.roll(2);               // Roll 2d20
     * console.log(die.results)   // [6,17]
     * console.log(die.total)     // 23
     */
    get total(): number;

    /**
     * Roll the initial set of results for the Die
     * @param nd	The number of times to roll the die
     * @return		The updated die containing new rolls
     *
     * @example
     * let die = new Die(6);
     * die.roll(6);               // Roll 6d6
     * console.log(die.results);  // [5,2,4,4,1,6]
     * console.log(die.total);    // 22
     */
    roll(
        options?: {
            minimize?: boolean = false;
            maximize?: boolean = false;
        } = {}
    ): Die;

    /**
     * Re-roll any results with results in the provided target set
     * Dice which have already been re-rolled will not be re-rolled again
     * @param targets	Target results which would trigger a reroll
     * @return			The updated die containing new rolls
     *
     * @example
     * let die = new Die(4);
     * die.roll(3);               // Roll 3d4
     * console.log(die.results);  // [1,3,4]
     * die.reroll([1,2]);         // Re-roll 1s or 2s
     * console.log(die.results);  // [3,4,2]
     */
    reroll(targets: number[]): Die;

    /**
     * Explode the Die, rolling additional results for any values which match the target set.
     * If no target number is specified, explode the highest possible result.
     * Explosion can be a "small explode" using a lower-case x or a "big explode" using an upper-case "X"
     *
     * @param {string} modifier     The matched modifier query
     * @param {boolean} recursive   Explode recursively, such that new rolls can also explode?
     */
    explode(modifier: string, option?: { recursive?: boolean = true }): void;

    /**
     * @see {@link Die#explode}
     */
    explodeOnce(modifier) {
        return this.explode(modifier, { recursive: false });
    }

    /**
     * Keep a certain number of highest or lowest dice rolls from the result set.
     *
     * 20d20k       Keep the 1 highest die
     * 20d20kh      Keep the 1 highest die
     * 20d20kh10    Keep the 10 highest die
     * 20d20kl      Keep the 1 lowest die
     * 20d20kl10    Keep the 10 lowest die
     *
     * @param {string} modifier     The matched modifier query
     */
    keep(modifier: string);

    /**
     * Drop a certain number of highest or lowest dice rolls from the result set.
     *
     * 20d20d       Drop the 1 lowest die
     * 20d20dh      Drop the 1 highest die
     * 20d20dl      Drop the 1 lowest die
     * 20d20dh10    Drop the 10 highest die
     * 20d20dl10    Drop the 10 lowest die
     *
     * @param {string} modifier     The matched modifier query
     */
    drop(modifier: string): void;

    /**
     * Count the number of successful results which occurred in a given result set.
     * Successes are counted relative to some target, or relative to the maximum possible value if no target is given.
     * Applying a count-success modifier to the results re-casts all results to 1 (success) or 0 (failure)
     *
     * 20d20cs      Count the number of dice which rolled a 20
     * 20d20cs>10   Count the number of dice which rolled higher than 10
     * 20d20cs<10   Count the number of dice which rolled less than 10
     *
     * @param {string} modifier     The matched modifier query
     */
    countSuccess(modifier: string): void;

    /**
     * Count the number of failed results which occurred in a given result set.
     * Failures are counted relative to some target, or relative to the lowest possible value if no target is given.
     * Applying a count-failures modifier to the results re-casts all results to 1 (failure) or 0 (non-failure)
     *
     * 6d6cf      Count the number of dice which rolled a 1 as failures
     * 6d6cf<=3   Count the number of dice which rolled less than 3 as failures
     * 6d6cf>4    Count the number of dice which rolled greater than 4 as failures
     *
     * @param {string} modifier     The matched modifier query
     */
    countFailures(modifier: string): void;

    /* -------------------------------------------- */
    /*  Factory Method                              */
    /* -------------------------------------------- */

    /**
     * Deduct the number of failures from the dice result, counting each failure as -1
     * Failures are identified relative to some target, or relative to the lowest possible value if no target is given.
     * Applying a deduct-failures modifier to the results counts all failed results as -1.
     *
     * 6d6df      Subtract the number of dice which rolled a 1 from the non-failed total.
     * 6d6cs>3df  Subtract the number of dice which rolled a 3 or less from the non-failed count.
     * 6d6cf<3df  Subtract the number of dice which rolled less than 3 from the non-failed count.
     *
     * @param {string} modifier     The matched modifier query
     */
    deductFailures(modifier: string): void;

    /**
     * Subtract the value of failed dice from the non-failed total, where each failure counts as its negative value.
     * Failures are identified relative to some target, or relative to the lowest possible value if no target is given.
     * Applying a deduct-failures modifier to the results counts all failed results as -1.
     *
     * 6d6df<3    Subtract the value of results which rolled less than 3 from the non-failed total.
     *
     * @param {string} modifier     The matched modifier query
     */
    subtractFailures(modifier: string): void;

    /**
     * Subtract the total value of the DiceTerm from a target value, treating the difference as the final total.
     * Example: 6d6ms>12    Roll 6d6 and subtract 12 from the resulting total.
     * @param {string} modifier     The matched modifier query
     */
    marginSuccess(modifier: string);
}

/**
 * A special die used by Fate/Fudge systems
 * Mathematically behaves like 1d3-2
 */
declare class FateDie extends Die {
    constructor();
}
