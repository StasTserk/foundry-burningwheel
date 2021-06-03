/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This class provides an interface and API for conducting dice rolls.
 * The basic structure for a dice roll is a string formula and an object of data against which to parse it.
 *
 * @param formula {String}    The string formula to parse
 * @param data {Object}       The data object against which to parse attributes within the formula
 *
 * @see {@link Die}
 * @see {@link DicePool}
 *
 * @example
 * // Attack with advantage!
 * let r = new Roll("2d20kh + @prof + @strMod", {prof: 2, strMod: 4});
 *
 * // The parsed terms of the roll formula
 * console.log(r.terms);    // [Die, +, 2, +, 4]
 *
 * // Execute the roll
 * r.evaluate();
 *
 * // The resulting equation after it was rolled
 * console.log(r.result);   // 16 + 2 + 4
 *
 * // The total resulting from the roll
 * console.log(r.total);    // 22
 */
declare class Roll {
    constructor(formula: string, data={})

    /**
     * The original provided data
     * @type {any}
     */
    data: any;

    /**
     * The identified terms of the Roll
     * @type {Array<Roll|DicePool|DiceTerm|number|string>}
     */
    terms: Roll|DicePool|DiceTerm|number|string[];

    /**
     * The original formula before evaluation
     * @type {string}
     */
    _formula: string;

    /**
     * An array of inner terms which were rolled parenthetically
     * @type {DiceTerm[]}
     */
    _dice: DiceTerm[];

    /**
     * The evaluated results of the Roll
     * @type {Array<number|string>}
     */
    results: number|string[];

    /**
     * An internal flag for whether the Roll object has been rolled
     * @type {boolean}
     * @private
     */
    _rolled: boolean;

    /**
     * Cache the evaluated total to avoid re-evaluating it
     * @type {number|null}
     * @private
     */
    _total: number | null;

    /**
     * A factory method which constructs a Roll instance using the default configured Roll class.
     * @param {any[]} args      Arguments passed to the Roll instance constructor
     * @return {Roll}           The constructed Roll instance
     */
    static create(...args): Roll

    /**
     * Replace referenced data attributes in the roll formula with values from the provided data.
     * Data references in the formula use the @attr syntax and would reference the corresponding attr key.
     *
     * @param {string} formula          The original formula within which to replace
     * @param {any} data             The data object which provides replacements
     * @param {string} [missing]        The value that should be assigned to any unmatched keys.
     *                                  If null, the unmatched key is left as-is.
     * @param {boolean} [warn]          Display a warning notification when encountering an un-matched key.
     * @static
     */
    static replaceFormulaData(formula: string, data: any, {missing, warn=false}: string={})

    /**
     * Return an Array of the individual DiceTerm instances contained within this Roll.
     * @return {DiceTerm[]}
     */
    get dice(): DiceTerm[]

    /**
     * Return a standardized representation for the displayed formula associated with this Roll.
     * @return {string}
     */
    get formula(): string

    /**
     * The resulting arithmetic expression after rolls have been evaluated
     * @return {string|null}
     */
    get result(): string

    /**
     * Return the total result of the Roll expression if it has been evaluated, otherwise null
     * @type {number|null}
     */
    get total(): number | null

    /**
     * Alter the Roll expression by adding or multiplying the number of dice which are rolled
     * @param {number} multiply   A factor to multiply. Dice are multiplied before any additions.
     * @param {number} add        A number of dice to add. Dice are added after multiplication.
     * @param {boolean} [multiplyNumeric]  Apply multiplication factor to numeric scalar terms
     * @return {Roll}             The altered Roll expression
     */
    alter(multiply: number, add: number, {multiplyNumeric=false}: boolean={}): Roll

    /**
     * Execute the Roll, replacing dice and evaluating the total result
     *
     * @param {boolean} [minimize]    Produce the minimum possible result from the Roll instead of a random result.
     * @param {boolean} [maximize]    Produce the maximum possible result from the Roll instead of a random result.
     *
     * @returns {Roll}    The rolled Roll object, able to be chained into other methods
     *
     * @example
     * let r = new Roll("2d6 + 4 + 1d4");
     * r.evaluate();
     * console.log(r.result); // 5 + 4 + 2
     * console.log(r.total);  // 11
     */
    evaluate({minimize=false, maximize=false}: boolean={}): Roll

    /**
     * Clone the Roll instance, returning a new Roll instance that has not yet been evaluated
     * @return {Roll}
     */
    clone(): Roll

    /**
     * Evaluate and return the Roll expression.
     * This function simply calls the evaluate() method but is maintained for backwards compatibility.
     * @param options Optional parameter informing how the Roll is evaluated.
     * @return {Roll}   The Roll instance, containing evaluated results and the rolled total.
     */
    roll(options?: Roll.Options & { async: false | undefined }): Roll
    roll(options?: Roll.Options & { async: true }): Promise<Roll>

    /**
     * Create a new Roll object using the original provided formula and data
     * Each roll is immutable, so this method returns a new Roll instance using the same data.
     *
     * @return {Roll}    A new Roll object, rolled using the same formula and data
     */
    reroll(): Roll

    /**
     * Simulate a roll and evaluate the distribution of returned results
     * @param {string} formula    The Roll expression to simulate
     * @param {number} n          The number of simulations
     * @return {number[]}         The rolled totals
     */
    static simulate(formula: string, n: number=10000): number[]

    /**
     * Validate that a provided roll formula can represent a valid
     * @param {string} formula    A candidate formula to validate
     * @return {boolean}          Is the provided input a valid dice formula?
     */
    static validate(formula: string): boolean

    /**
     * Create a formula string from an array of Dice terms.
     * @return {string}
     */
    static cleanFormula(terms): string

    /**
     * Clean the terms of a Roll equation, removing empty space and de-duping arithmetic operators
     * @param {Array<DiceTerm|string|number>} terms  The input array of terms
     * @return {Array<DiceTerm|string|number>}       The cleaned array of terms
     */
    static cleanTerms(terms: Array<DiceTerm | string | number>): Array<DiceTerm | string | number>

    /**
     * Split a provided Roll formula to identify it's component terms.
     * Some terms are very granular, like a Number of an arithmetic operator
     * Other terms are very coarse like an entire inner Roll from a parenthetical expression.
     * As a general rule, this function should return an Array of terms which are ready to be evaluated immediately.
     * Some terms may require recursive evaluation.
     * @private
     *
     * @param {string} formula  The formula to parse
     * @return {Array<Roll|DicePool|DiceTerm|number|string>}       An array of identified terms
     */
    _identifyTerms(formula: string): Array<Roll | DicePool | DiceTerm | number | string>

    /**
     * Prepare the data structure used for the Roll.
     * This is factored out to allow for custom Roll classes to do special data preparation using provided input.
     * @param {any} data   Provided roll data
     * @private
     */
    _prepareData(data: any)

    /**
     * Identify and split a formula into separate terms by arithmetic terms
     * @private
     */
    _splitDiceTerms(formula: string): string[]

    /**
     * Identify and split a formula into separate terms by parenthetical expressions
     * @private
     */
    _splitParentheticalTerms(formula: string): string[]

    /**
     * Identify and split a formula into separate terms by curly braces which represent pooled expressions
     * @private
     */
    _splitPooledTerms(formula: string): string[]

    /**
     * Safely evaluate a formulaic expression using a Proxy environment which is allowed access to Math commands
     * @param {string} expression     The formula expression to evaluate
     * @return {number}               The returned numeric result
     * @private
     */
    _safeEval(expression: string): number

    /**
     * Render the tooltip HTML for a Roll instance
     * @return {Promise<HTMLElement>}
     */
    getTooltip(): Promise<HTMLElement>

    /**
     * Render a Roll instance to HTML
     * @param chatOptions {Object}      An object configuring the behavior of the resulting chat message.
     * @return {Promise.<HTMLElement>}  A Promise which resolves to the rendered HTML
     */
    async render(chatOptions: any = {}): Promise<HTMLElement>

    /**
     * Transform a Roll instance into a ChatMessage, displaying the roll result.
     * This function can either create the ChatMessage directly, or return the data object that will be used to create.
     *
     * @param {any} messageData          The data object to use when creating the message
     * @param {string|null} [rollMode=null] The template roll mode to use for the message from CONFIG.Dice.rollModes
     * @param {boolean} [create=true]       Whether to automatically create the chat message, or only return the prepared
     *                                      chatData object.
     * @return {Promise|any}             A promise which resolves to the created ChatMessage entity, if create is true
     *                                      or the Object of prepared chatData otherwise.
     */
    toMessage(messageData: any={}, {rollMode=null, create=true}: string | null={}): Promise<any> | any

    /**
     * Represent the data of the Roll as an object suitable for JSON serialization.
     * @return {object}     Structured data which can be serialized into JSON
     */
    toJSON(): any

    /**
     * Recreate a Roll instance using a provided data object
     * @param {RollDataObject} data   Unpacked data representing the Roll
     * @return {Roll}         A reconstructed Roll instance
     */
    static fromData(data: RollDataObject): Roll

    /**
     * Recreate a Roll instance using a provided JSON string
     * @param {string} json   Serialized JSON data representing the Roll
     * @return {Roll}         A reconstructed Roll instance
     */
    static fromJSON(json: string): Roll

    /**
     * Construct a new Roll object from a parenthetical term of an outer Roll.
     * @param {string} term     The isolated parenthetical term, for example (4d6)
     * @param {any} data     The Roll data object, provided by the outer Roll
     * @return {Roll}           An inner Roll object constructed from the term
     */
    static fromTerm(term: string, data: any): Roll
}

declare namespace Roll {
    declare interface Options {
        /** Minimize the result, obtaining the smallest possible value. */
        minimize?: boolean;
        /** Maximize the result, obtaining the largest possible value. */
        maximize?: boolean;
        /** Evaluate the roll asynchronously, receiving a Promise as the returned value. This will become the default behavior in version 10.x */
        async?: boolean;
    }
}

declare interface RollDataObject {
    formula: string;
    results: RollResult[];
    total: number | null;
    dice: (DiceTerm | any)[];
    terms?: any[];
}