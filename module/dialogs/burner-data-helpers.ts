export function extractRelationshipData(parent: JQuery):
{ hateful: boolean, closeFamily: boolean, otherFamily: boolean, romantic: boolean, forbidden: boolean, power: number } {
    return {
        hateful: extractNamedChildCheck(parent, 'relHat'),
        closeFamily: extractNamedChildNumber(parent, 'relFam') === -2,
        otherFamily: extractNamedChildNumber(parent, 'relFam') === -1,
        romantic: extractNamedChildCheck(parent, "relRom"),
        forbidden: extractNamedChildCheck(parent, "relFor"),
        power: extractNamedChildNumber(parent, 'relPow')
    };
}

function extractNamedChildString(p: JQuery, name: string): string {
    return p.children(`*[name='${name}']`).val() as string;
}

function extractNamedChildNumber(p: JQuery, name: string): number {
    return parseInt(extractNamedChildString(p, name)) || 0;
}

function extractNamedChildCheck(p: JQuery, name: string): boolean {
    return p.children(`*[name='${name}']`).prop('checked') as boolean;
}