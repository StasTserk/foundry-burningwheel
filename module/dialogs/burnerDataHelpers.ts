import { Affiliation } from "../items/affiliation.js";
import { Property } from "../items/property.js";
import { Relationship } from "../items/relationship.js";
import { Reputation } from "../items/reputation.js";
import { Skill } from "../items/skill.js";
import { Trait } from "../items/trait.js";
import { CharacterSettings } from "../actors/BWCharacter.js";
import { StringIndexedObject, ShadeString } from "../helpers.js";
import {
    BWItem, ItemType
} from "../items/item.js";
import * as constants from "../constants.js";
import { TypeMissing } from "../../types/index.js";

export function extractRelationshipData(parent: JQuery): BurnerRelationshipData {
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
    return p.find(`*[name='${name}']`).prop('checked') as boolean;
}

function extractNamedString(p: JQuery, name: string): string {
    return p.find(`*[name='${name}']`).val() as string;
}

function extractNamedNumber(p: JQuery, name: string): number {
    return parseInt(extractNamedString(p, name)) || 0;
}

function extractNamedCheck(p: JQuery, name: string): boolean {
    return p.find(`*[name='${name}']`).prop('checked') as boolean;
}

function costToString(cost: number): ShadeString {
    if (cost === 0) { return "B"; }
    if (cost === 5) { return "G"; }
    return "W";
}

function getStatData(html: JQuery<HTMLElement>, name: string): { exp: number, shade: ShadeString} {
    return { 
        exp: extractNamedNumber(html, `${name}Spent`),
        shade: costToString(extractNamedNumber(html, `${name}ShadeSpent`))
    };
}

function getAttrData(html: JQuery<HTMLElement>, name: string): { exp: number, shade: ShadeString} {
    return { 
        exp: extractNamedNumber(html, `${name}Stat`),
        shade: extractNamedString(html, `${name}Shade`) as ShadeString
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractBaseCharacterData(html: JQuery<HTMLElement>): StringIndexedObject<string | StringIndexedObject<any>> {
    // baseStats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseData: StringIndexedObject<string | StringIndexedObject<any>> = {};
    baseData.will = getStatData(html, "will");
    baseData.perception = getStatData(html, "perception");
    baseData.power = getStatData(html, "power");
    baseData.forte = getStatData(html, "forte");
    baseData.agility = getStatData(html, "agility");
    baseData.speed = getStatData(html, "speed");

    baseData.health = getAttrData(html, "health");
    baseData.steel = getAttrData(html, "steel");
    baseData.resources = getAttrData(html, "resources");
    baseData.circles = getAttrData(html, "circles");
    baseData.age = extractNamedString(html, "ageTotal"),
    baseData.stock = extractNamedString(html, "stock"),
    baseData.lifepathString = html.find("input[name='lifepathName']").map((_, e) =>$(e).val() as string).toArray().filter(s => s.trim()).join(", ");

    baseData.custom1 = {
        name: extractNamedString(html, "custom1Name"),
        ...getStatData(html, "custom1")
    };
    baseData.custom2 = {
        name: extractNamedString(html, "custom2Name"),
        ...getStatData(html, "custom2")
    };

    const settings: Partial<CharacterSettings> = {
        roundUpMortalWound: extractNamedCheck(html, "settingTough"),
        armorTrained: extractNamedCheck(html, "settingArmorTrained"),
        roundUpReflexes: extractNamedCheck(html, "settingReflex"),
        ignoreSuperficialWounds: extractNamedCheck(html, "settingNumb"),
        showBurner: false
    };
    baseData.settings = settings;
    return baseData;
}

export function extractSkillData(html: JQuery<HTMLElement>, skillsList: Skill[]): Partial<Skill>[] {
    const skills: Partial<Skill>[] = [];
    let skillId = "";
    let skillName = "";
    let skillExp = 0;
    let skillData: Partial<Skill> | undefined;
    html.find("div.skills-grid").each((_, e) => {
        skillName = extractNamedChildString($(e), "skillName");
        skillExp = extractNamedChildNumber($(e), "skillExponent");
        if (!skillName || skillExp === 0 || !extractNamedCheck($(e), "skillOpened")) { return; }
        skillId = extractNamedChildString($(e), "skillId");
        if (skillId) {
            skillData = skillsList.find(s => s.id === skillId);
            if (skillData && skillData.system) {
                skillData.system.exp = skillExp;
                skillData.system.shade = costToString(extractNamedChildNumber($(e), "skillShade"));
                skills.push({
                    system: skillData.system,
                    name: skillData.name,
                    type: skillData.type,
                    img: skillData.img
                });
            }
        } else {
            skills.push({
                system: {
                    name: skillName,
                    exp: skillExp,
                    shade: costToString(extractNamedChildNumber($(e), "skillShade")),
                    root1: extractNamedChildString($(e), "skillRoot1"),
                    root2: extractNamedChildString($(e), "skillRoot2"),
                    skilltype: "special",
                    training: extractNamedChildCheck($(e), "skillTraining"),
                    description: "Unknown skill generated during character burning. Update any incorrect data.",
                },
                type: "skill",
                name: skillName,
                img: constants.defaultImages.skill
            } as Skill);
        }
    });
    return skills;
}

export function extractTraitData(html: JQuery<HTMLElement>, traitList: Trait[]): Partial<Trait>[] {
    const traits: Partial<Trait>[] = [];
    let traitName = "";
    let traitId = "";
    let traitData: Partial<Trait> | undefined;
    html.find(".burner-traits-grid").each((_, e) => {
        traitName = extractNamedChildString($(e), "traitName");
        if (!traitName || !extractNamedChildCheck($(e), "traitTaken")) { return; }
        traitId = extractNamedChildString($(e), "traitId");
        if (traitId) {
            traitData = traitList.find(t => t.id === traitId);
            traits.push(traitData || {});
        } else {
            traits.push({
                system: {
                    traittype: extractNamedChildString($(e), "traitType"),
                    text: "Unknown trait created during character burning. Update data accordingly. If the trait adds a reputation or affiliation, those must be added in manually."
                } as TypeMissing,
                type: "trait",
                name: traitName,
                img: constants.defaultImages[extractNamedChildString($(e), "traitType")]
            });
        }
    });
    return traits;
}

export function extractPropertyData(html: JQuery<HTMLElement>, propertyList: Property[]): Partial<Property>[] {
    const properties: Partial<Property>[] = [];
    let propertyName = "";
    let propertyId = "";
    let propertyData: Partial<Property> | undefined;
    html.find(".burner-property").each((_, e) => {
        propertyName = extractNamedChildString($(e), "propertyName");
        if (!propertyName || !extractNamedChildNumber($(e), "propertyCost")) { return; }
        propertyId = extractNamedChildString($(e), "propertyId");
        if (propertyId) {
            propertyData = propertyList.find(p => p.id === propertyId);
            properties.push(propertyData || {});
        } else {
            properties.push({
                system: {
                    description: "Unknown property created during character burning. Update data accordingly."
                } as TypeMissing,
                type: "property",
                name: propertyName,
                img: constants.defaultImages.property
            });
        }
    });
    return properties;
}

export function extractReputationData(html: JQuery<HTMLElement>): Partial<Reputation | Affiliation>[] {
    const reputations: Partial<Affiliation | Reputation>[] = [];
    let repName = "";
    let repDice = 0;
    html.find(".burner-reputations").each((_, e) => {
        repName = extractNamedChildString($(e), "reputationName");
        repDice = extractNamedChildNumber($(e), "reputationDice");
        if (!repName || !extractNamedChildNumber($(e), "reputationCost") || repDice === 0) { return; }
        if (!extractNamedChildCheck($(e), "reputationType")) {
            reputations.push({
                system: {
                    dice: repDice,
                    description: "Unknown affiliation created during character burning. Update data accordingly."
                } as TypeMissing,
                type: "affiliation",
                name: repName,
                img: constants.defaultImages.affiliation
            });
        } else {
            reputations.push({
                system: {
                    dice: repDice,
                    infamous: false,
                    description: "Unknown reputation created during character burning. Update data accordingly."
                } as TypeMissing,
                type: "reputation",
                name: repName,
                img: constants.defaultImages.reputation
            });
        }
    });
    return reputations;
}

export function extractRelData(html: JQuery<HTMLElement>): Partial<Relationship>[] {
    const relationships: Partial<Relationship>[] = [];
    let relName = "";
    let relData: BurnerRelationshipData;
    html.find(".burner-relationship-info").each((_, e) => {
        relName = extractNamedChildString($(e), "relationshipName");
        if (!relName) { return; }
        relData = extractRelationshipData($(e));
        relationships.push({
            system: {
                forbidden: relData.forbidden,
                description: "Relationship created during character burning. Fill in this description accordingly.",
                immediateFamily: relData.closeFamily,
                otherFamily: relData.otherFamily,
                romantic: relData.romantic,
                hateful: relData.hateful,
                enmity: false,
                influence: relData.power === 5 ? "minor" : (relData.power === 10 ? "significant" : "powerful"),
                building: false,
                buildingProgress: 0
            } as TypeMissing,
            type: "relationship",
            name: relName,
            img: constants.defaultImages.relationship
        });
    });
    return relationships;
}

export function extractGearData(html: JQuery<HTMLElement>, gearList: BWItem[]): Partial<BWItem>[] {
    const gear: Partial<BWItem>[] = [];
    let gearName = "";
    let gearType: ItemType;
    let gearId = "";
    html.find(".burner-gear").each((_, e) => {
        gearName = extractNamedChildString($(e), "itemName");
        gearId = extractNamedChildString($(e), "gearId");
        gearType = extractNamedChildString($(e), "itemType") as ItemType;
        if (!gearName) { return; }
        if (gearId) {
            gear.push(gearList.find(g => g.id === gearId) || {});
            return;
        }
        const gearItem: Partial<BWItem> = {
            type: gearType,
            name: gearName,
            system: {
                description: `Unknown ${gearType.titleCase()} created as part of character burning. Update with the appropriate data.`
            } as TypeMissing,
            img: constants.defaultImages[gearType]
        };
        gear.push(gearItem);
    });
    return gear;
}

export interface BurnerRelationshipData {
    hateful: boolean,
    closeFamily: boolean,
    otherFamily: boolean,
    romantic: boolean,
    forbidden: boolean,
    power: number
}