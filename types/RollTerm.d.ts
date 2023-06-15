declare class RollTerm {
    constructor(options: unknown): void;
    static FLAVOR_REGEXP_STRING = "(?:\\[([^\\]]+)\\])";
    static FLAVOR_REGEXP: RegExp;
    static REGEXP: RegExp | undefined;
    static SERIALIZABLE_ATTRIBUTES: string[];

    get expression(): string;
    get formula(): string;
    get total(): number | string;
    get flavor(): string;
    get isDeterministic(): boolean;
    
    isIntermediate: boolean;

    async evaluate({ minimize = false, maximize = false }: boolean = {}): Promise<RollTerm>;

    static fromData(data: unknown & { class: string });
    static fromJSON(json: string);
    toJSON(): string;
}
