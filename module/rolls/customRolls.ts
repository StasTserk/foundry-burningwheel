export class AstrologyDie extends Die {
    constructor({ diceNumber, target }: { diceNumber: number, target: number}) {
        super({ 
            number: diceNumber,
            faces: 6,
            modifiers: [
                "x",
                `cs>${target}`,
                "cf1"
            ],
            options: {}
        });
    }
    explode(_modifier: string): void {
        let checked = 0;
        while ( checked < this.results.length ) {
            const r = this.results[checked];
            checked++;
            if (!r.active) continue;
      
            if (r.result === 1 || r.result === 6) {
                r.exploded = true;
                this.roll();
            }
        }
    }
    countFailures(_modifier: string): void {
        for (const r of this.results) {
            if (r.result === 1) {
                r.count = -1;
            }
        }
    }
}

export class BWAliasTerm extends RollTerm {
    static REGEXP = new RegExp("^([bgw])([0-9]{1,2})$", "i");

    static matchTerm(expression: string): RegExpMatchArray | null {
        return expression.match(this.REGEXP) || null;
    }

    static fromMatch(match: RegExpMatchArray): DiceTerm {
        const shade = match[1].toLowerCase();
        const target = shade === 'b' ? 3 : (shade === 'g' ? 2 : 1);
        const number = parseInt(match[2]);

        return new Die({
            number: number,
            faces: 6,
            modifiers: [`cs>${target}`],
            options: {}
        }) as unknown as DiceTerm;
    }
}

interface TermClassificationOptions {
    intermediate?: boolean,
    prior?: RollTerm | null,
    next?: RollTerm | null
}

export class BWRoll extends Roll {
    static _classifyStringTerm(term: string | RollTerm, {intermediate = true, prior = null, next = null}: TermClassificationOptions = {}): RollTerm {
        // Terms already classified
        if ( term instanceof RollTerm ) return term;

        // Numeric terms
        const numericMatch = NumericTerm.matchTerm(term);
        if ( numericMatch ) return NumericTerm.fromMatch(numericMatch);

        // BWAlias terms
        const bwAliasMatch = BWAliasTerm.matchTerm(term);
        if ( bwAliasMatch ) {
            return BWAliasTerm.fromMatch(bwAliasMatch) as unknown as RollTerm;
        }

        // Dice terms
        const diceMatch = DiceTerm.matchTerm(term, {imputeNumber: !intermediate});
        if ( diceMatch ) {
          if ( intermediate && (prior?.isIntermediate || next?.isIntermediate) ) return new StringTerm({term});
          return DiceTerm.fromMatch(diceMatch) as unknown as RollTerm;
        }

        // Remaining strings
        return new StringTerm({term});
    }
}

