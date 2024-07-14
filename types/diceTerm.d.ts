/* eslint-disable @typescript-eslint/no-explicit-any */
declare interface RollResult {
    result: number;
    discarded?: boolean;
    active?: boolean;
    count?: number;
    exploded?: boolean;
    success?: boolean;
    failure?: boolean;
}
declare type ComparisonString = '=' | '<' | '>' | '<=' | '>=';

declare namespace foundry {
    declare namespace dice {
        declare namespace terms {
            /**
             * An abstract base class for any term which appears in a dice roll formula
             * @abstract
             *
             * @param {object} termData                 Data used to create the Dice Term, including the following:
             * @param {number} termData.number          The number of dice of this term to roll, before modifiers are applied
             * @param {number} termData.faces           The number of faces on each die of this type
             * @param {string[]} termData.modifiers     An array of modifiers applied to the results
             * @param {object} termData.options         Additional options that modify the term
             */
            declare class DiceTerm extends RollTerm {
                constructor(
                    termData?: {
                        number?: number = 1;
                        faces?: number = 6;
                        modifiers?: string[] = [];
                        options?: any = { };
                    } = {}
                );

                /**
                 * The number of dice of this term to roll, before modifiers are applied
                 * @type {number}
                 */
                number: number;

                /**
                 * The number of faces on the die
                 * @type {number}
                 */
                faces: number;

                /**
                 * An Array of dice term modifiers which are applied
                 * @type {string[]}
                 */
                modifiers: string[];

                /**
                 * An Array of dice term modifiers which are applied
                 * @type {string[]}
                 */
                results: RollResult[];

                /**
                 * An object of additional options which modify the dice term
                 * @type {object}
                 */
                options: any;

                /**
                 * An internal flag for whether the dice term has been evaluated
                 * @type {boolean}
                 * @private
                 */
                private _evaluated;

                /**
                 * Return a standardized representation for the displayed formula associated with this DiceTerm
                 * @return {string}
                 */
                get formula(): string;

                /**
                 * Return the total result of the DiceTerm if it has been evaluated
                 * @type {number|null}
                 */
                get total(): number | null;

                /**
                 * Return an array of rolled values which are still active within this term
                 * @type {number[]}
                 */
                get values(): number[];

                /**
                 * Alter the DiceTerm by adding or multiplying the number of dice which are rolled
                 * @param {number} multiply   A factor to multiply. Dice are multiplied before any additions.
                 * @param {number} add        A number of dice to add. Dice are added after multiplication.
                 * @return {DiceTerm}         The altered term
                 */
                alter(multiply: number, add: number): DiceTerm;

                /**
                 * Evaluate the roll term, populating the results Array.
                 * @param {boolean} [minimize]    Apply the minimum possible result for each roll.
                 * @param {boolean} [maximize]    Apply the maximum possible result for each roll.
                 * @returns {DiceTerm}    The evaluated dice term
                 */
                async evaluate({
                    minimize = false,
                    maximize = false,
                }: boolean = {}): Promise<DiceTerm>;

                /**
                 * Roll the DiceTerm by mapping a random uniform draw against the faces of the dice term.
                 * @param {boolean} [minimize]    Apply the minimum possible result instead of a random result.
                 * @param {boolean} [maximize]    Apply the maximum possible result instead of a random result.
                 * @return {object}
                 */
                async roll({
                    minimize: boolean = false,
                    maximize = false,
                }: boolean = {}): Promise<{ result: number; active: true }>;

                /**
                 * Return a string used as the label for each rolled result
                 * @param {string} result     The numeric result
                 * @return {string}           The result label
                 */
                static getResultLabel(result: string): string;

                /**
                 * Sequentially evaluate each dice roll modifier by passing the term to its evaluation function
                 * Augment or modify the results array.
                 */
                private _evaluateModifiers(): void;

                /**
                 * A helper comparison function.
                 * Returns a boolean depending on whether the result compares favorably against the target.
                 * @param {number} result         The result being compared
                 * @param {string} comparison     The comparison operator in [=,<,<=,>,>=]
                 * @param {number} target         The target value
                 * @return {boolean}              Is the comparison true?
                 */
                static compareResult(
                    result: number,
                    comparison: ComparisonString,
                    target: number
                ): boolean;

                /**
                 * A helper method to modify the results array of a dice term by flagging certain results are kept or dropped.
                 * @param {RollResult[]} results      The results array
                 * @param {number} number         The number to keep or drop
                 * @param {boolean} [keep]        Keep results?
                 * @param {boolean} [highest]     Keep the highest?
                 * @return {RollResult[]}             The modified results array
                 */
                static _keepOrDrop(
                    results: RollResult[],
                    number: number,
                    { keep = true, highest = true }: boolean = {}
                ): RollResult[];

                /**
                 * A reusable helper function to handle the identification and deduction of failures
                 */
                static _applyCount(
                    results: RollResult[],
                    comparison: ComparisonString,
                    target: number,
                    { flagSuccess = false, flagFailure = false }: boolean = {}
                ): void;

                /**
                 * A reusable helper function to handle the identification and deduction of failures
                 */
                static _applyDeduct(
                    results: RollResult[],
                    comparison: ComparisonString,
                    target: number,
                    { deductFailure = false, invertFailure = false }: boolean = {}
                ): void;

                /* -------------------------------------------- */
                /*  Factory Methods                             */
                /* -------------------------------------------- */

                /**
                 * Construct a DiceTerm from a provided data object
                 * @param {any} data         Provided data from an un-serialized term
                 * @return {DiceTerm}           The constructed DiceTerm
                 */
                static fromData(data: any): DiceTerm;

                /**
                 * Parse a provided roll term expression, identifying whether it matches this type of term.
                 * @param {string} expression
                 * @param {any} options            Additional term options
                 * @return {DiceTerm|null}            The constructed DiceTerm instance
                 */
                static fromExpression(
                    expression: string,
                    options?: any = {}
                ): DiceTerm | null;

                /**
                 * Check if the expression matches this type of term
                 * @param {string} expression
                 * @return {RegExpMatchArray|null}
                 */
                static matchTerm(
                    expression: string,
                    { imputeNumber = true } = {}
                ): RegExpMatchArray | null;

                /**
                 * Create a "fake" dice term from a pre-defined array of results
                 * @param {any} options        Arguments used to initialize the term
                 * @param {RollResult[]} results      An array of pre-defined results
                 * @return {DiceTerm}
                 *
                 * @example
                 * let d = new Die({faces: 6, number: 4, modifiers: ["r<3"]});
                 * d.evaluate();
                 * let d2 = Die.fromResults({faces: 6, number: 4, modifiers: ["r<3"]}, d.results);
                 */
                static fromResults(options: any, results: RollResult[]): DiceTerm;

                /**
                 * Serialize the DiceTerm to a JSON string which allows it to be saved in the database or embedded in text.
                 * This method should return an object suitable for passing to the JSON.stringify function.
                 * @return {object}
                 */
                toJSON(): any;

                /**
                 * Reconstruct a DiceTerm instance from a provided JSON string
                 * @param {string} json   A serialized JSON representation of a DiceTerm
                 * @return {DiceTerm}     A reconstructed DiceTerm from the provided JSON
                 */
                static fromJSON(json: string): DiceTerm;

                /**
                 * Construct a term of this type given a matched regular expression array.
                 * @param {RegExpMatchArray} match          The matched regular expression array
                 * @return {DiceTerm}                      The constructed term
                 */
                static fromMatch(match: RegExpMatchArray): DiceTerm;
            }
        }
    }
}