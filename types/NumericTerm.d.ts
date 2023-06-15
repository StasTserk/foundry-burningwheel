declare class NumericTerm extends RollTerm {
    static matchTerm(expression): RegExpMatchArray | null;
    static fromMatch(match: RegExpMatchArray);
}
