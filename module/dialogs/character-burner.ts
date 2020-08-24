import { BWActor } from "../actor.js";
import { ShadeString, StringIndexedObject, getItemsOfType, getItemsOfTypes } from "../helpers.js";
import { Skill, Trait, BWItem, Property, HasPointCost } from "../items/item.js";
import { extractRelationshipData, extractBaseCharacterData, extractSkillData, extractTraitData, extractPropertyData, extractRepuatationData, extractRelData, extractGearData } from "./burner-data-helpers.js";

export class CharacterBurnerDialog extends Dialog {
    private readonly _parent: BWActor;
    private _burnerListeners: JQuery<HTMLElement>[];
    private readonly _itemLookup: {
        loading: boolean;
        timer: number;
    } = {
        loading: false,
        timer: 0
    };
    private _skills: Skill[];
    private _traits: Trait[];
    private _gear: BWItem[];
    private _property: Property[];

    static async Open(parent: BWActor): Promise<Application> {
        const dialog = new CharacterBurnerDialog(parent);
        dialog._skills = await getItemsOfType<Skill>("skill");
        dialog._traits = await getItemsOfType<Trait>("trait");
        dialog._property = await getItemsOfType<Property>("property");
        dialog._gear = await getItemsOfTypes("melee weapon", "ranged weapon", "armor", "spell", "possession");

        return dialog.render(true);
    }
    private constructor(parent: BWActor) {
        super({
            title: "Character Burner",
            buttons: {
                apply: {
                    label: "Apply",
                    callback: () => console.log(`Applying burner state to ${this._parent.name}.`)
                }
            }
        });

        this._parent = parent;
    }

    get template(): string {
        return "systems/burningwheel/templates/dialogs/character-burner.html";
    }

    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, { width: 900, height: 800 }, { overwrite: true });
    }

    getData(): CharacterBurnerData {
        const data = super.getData() as CharacterBurnerData;
        const blankLifepath: LifepathEntry = { name: "", time: 0, lead: 0, resources: 0, mentalStat: 0, physicalStat: 0, skillPts: 0, generalSkillPts: 0, traitPts: 0 };
        const blankSkill: SkillEntry = { name: "", root1: "Perception", root2: "", open: false, training: false, skillId: "", shade: "B" };
        data.data = data.data || {};
        data.data.lifepaths = [];
        data.data.skills = [];
        data.data.traits = [];
        data.data.relationships = [];
        data.data.property = [];
        data.data.reputations = [];
        data.data.gear = [];
        data.ageTable = ageTable;
        data.data.lps = 4;
        for (let i = 0; i < 10; i ++) {
            data.data.lifepaths.push(Object.assign({}, blankLifepath));
        }
        for (let i = 0; i < 30; i ++) {
            data.data.skills.push(Object.assign({}, blankSkill));
        }
        for (let i = 0; i < 15; i ++) {
            data.data.traits.push({});
            data.data.gear.push({});
        }

        for (let i = 0; i < 10; i ++) {
            data.data.property.push({});
            data.data.relationships.push({});
            data.data.reputations.push({});
        }
        data.data.lifepaths[0].name = "Born ...";

        return data;
    }

    activateListeners(html: JQuery): void {
        this._burnerListeners = [
            html.find("input:enabled").on('focus', e => $(e.target).select()),
            html.find("input[name='time']").on('change', _ => this._storeSum(html, "timeTotal", "time")),
            html.find("input[name='lead']").on('change', _ => this._storeSum(html, "leadTotal", "lead")),
            html.find("input[name='timeTotal'], input[name='leadTotal']").on('change', _ => this._storeSum(html, "ageTotal", "timeTotal", "leadTotal")),

            html.find("input[name='resources']").on('change', _ => this._storeSum(html, "resourcesTotal", "resources")),

            html.find("input[name='mentalStat']").on('change', _ => this._storeSum(html, "mentalStatTotal", "mentalStat")),
            html.find("input[name='mentalStatTotal'], select[name='mentalPool']").on('change', _ => 
                this._storeSum(html, "mentalPoolTotal", "mentalStatTotal", "mentalPool")),

            html.find("input[name='physicalStat']").on('change', _ => this._storeSum(html, "physicalStatTotal", "physicalStat")),
            html.find("select[name='physicalPool'], input[name='physicalStatTotal']").on('change', _ =>
                this._storeSum(html, "physicalPoolTotal", "physicalStatTotal", "physicalPool")),
            html.find("input[name='physicalPoolTotal'], input[name='physicalPoolSpent']").on('change', _ =>
            this._storeDiff(html, "physicalPoolLeft", "physicalPoolTotal", "physicalPoolSpent")),

            html.find("input[name='skillPts']").on('change', _ => this._storeSum(html, "skillPtsTotal", "skillPts")),
            html.find("input[name='generalSkillPts']").on('change', _ => this._storeSum(html, "generalSkillPtsTotal", "generalSkillPts")),
            html.find("input[name='skillPtsTotal'], input[name='generalSkillPtsTotal']").on('change', _ =>
                this._storeSum(html, "combinedSkillPts", "generalSkillPtsTotal", "skillPtsTotal")),
            html.find("input[name='traitPts']").on('change', _ => this._storeSum(html, "traitPtsTotal", "traitPts")),

            html.find("input[name='mentalPoolTotal'], input[name='mentalPoolSpent']").on('change', _ =>
                this._storeDiff(html, "mentalPoolLeft", "mentalPoolTotal", "mentalPoolSpent")),
            html.find("input[name='willSpent'], select[name='willShadeSpent'], input[name='perceptionSpent'], select[name='perceptionShadeSpent']").on('change', _ => {
                this._storeSum(html, "mentalPoolSpent", "willSpent", "willShadeSpent", "perceptionSpent", "perceptionShadeSpent");
            }),
            html.find("input[name='powerSpent'], select[name='powerShadeSpent'], input[name='forteSpent'], select[name='forteShadeSpent'], " +
                "input[name='agilitySpent'], select[name='agilityShadeSpent'], input[name='speedSpent'], select[name='speedShadeSpent']").on('change', _ => {
                this._storeSum(html, "physicalPoolSpent",
                    "powerSpent", "powerShadeSpent", "forteSpent", "forteShadeSpent",
                    "agilitySpent", "agilityShadeSpent", "speedSpent", "speedShadeSpent");
            }),
            html.find("input[name='skillPtsSpent'], input[name='combinedSkillPts']").on('change', _ =>
                this._storeDiff(html, "skillPtsLeft", "combinedSkillPts", "skillPtsSpent")),
            html.find("input[name='skillName']").on('input', (e: JQueryInputEventObject) => this._tryLoadSkill(e)),
            html.find("input[name='skillAdvances'], input[name='skillOpened'], input[name='skillTraining'], select[name='skillShade']").on('change', (e: JQuery.ChangeEvent) =>
                this._calculateSkillWorth(e)),
            html.find("input[name='skillPtsWorth']").on('change', _ => this._storeSum(html, "skillPtsSpent", "skillPtsWorth")),

            html.find("*[name='powerSpent'], *[name='powerShadeSpent'], *[name='forteSpent'], *[name='forteShadeSpent'], " +
                "*[name='agilitySpent'], *[name='agilityShadeSpent'], *[name='speedSpent'], *[name='speedShadeSpent'], " + 
                "*[name='willSpent'], *[name='willShadeSpent'], *[name='perceptionSpent'], *[name='perceptionShadeSpent']").on('change', e => 
                this._calculateAllSkillExponents(e, html)),
            html.find("input[name='skillOpened'], input[name='skillAdvances'], select[name='skillRoot1'], select[name='skillRoot2']").on('change', (e: JQuery.ChangeEvent) => this._calculateSkillExponent(e.currentTarget, html)),

            // trait points spent
            html.find("input[name='traitName']").on('input', (e: JQueryInputEventObject) => this._tryLoadTrait(e)),
            html.find("input[name='traitCost'], input[name='traitTaken']").on('change', _ => this._calculateSpentTraits(html)),
            html.find("input[name='traitPtsSpent'], input[name='traitPtsTotal']").on('change', _ => this._storeDiff(html, "traitPtsLeft", "traitPtsTotal", "traitPtsSpent")),

            // all resource points
            html.find("input[name='resourcePointsSpent'], input[name='resourcesTotal']").on('change', _ => this._storeDiff(html, "resourcePointsLeft", "resourcesTotal", "resourcePointsSpent")),
            html.find("input[name='reputationSpent'], input[name='relationshipsSpent'], input[name='propertySpent'], input[name='gearSpent']").on('change', _ =>
                this._storeSum(html, "resourcePointsSpent", "reputationSpent", "relationshipsSpent", "propertySpent", "gearSpent")),

            // reputation/affiliation totals
            html.find("input[name='reputationName'], input[name='reputationType'], input[name='reputationDice']").on('change', e => 
                this._calculateRepAffCost($(e.currentTarget))),
            html.find("input[name='reputationCost']").on('change', _e => this._storeSum(html, "reputationSpent", "reputationCost")),

            // relationsip totals
            html.find("input[name='relationshipName'], select[name='relPow'], select[name='relFam'], input[name='relRom'], input[name='relFor'], input[name='relHat']").on('change', e => 
                this._calculateRelationshipCost($(e.currentTarget))),
            html.find("input[name='relationshipCost']").on('change', _e => this._storeSum(html, "relationshipsSpent", "relationshipCost")),

            // property
            html.find("input[name='propertyName']").on('input', (e: JQueryInputEventObject) => this._tryLoadProperty(e)),
            html.find("input[name='propertyCost']").on('change', _ => this._storeSum(html, "propertySpent", "propertyCost")),
            // gear
            html.find("input[name='itemName']").on('input', (e: JQueryInputEventObject) => this._tryLoadGear(e)),
            html.find("input[name='itemCost']").on('change', _ => this._storeSum(html, "gearSpent", "itemCost")),

            // extra rules totals
            html.find("input[name='reputationSpent'], input[name='propertySpent']").on('change', _ => this._storeSum(html, "resourceExponentAmount", "reputationSpent", "propertySpent")),
            html.find("input[name='relationshipsSpent'], input[name='propertySpent']").on('change', _ => this._storeSum(html, "circlesExponentBonus", "relationshipsSpent", "propertySpent")),

            html.find("button.submit-burner-button").on('click', e => this._finishBurning(e, html))
        ];
        super.activateListeners(html);
    }
    _calculateSpentTraits(html: JQuery<HTMLElement>): void {
        // , "traitPtsSpent", "traitCost"
        let sum = 0;
        html.find("input[name='traitCost']").each((_, t) => {
            if ($(t).prev().prop("checked")) {
                sum += parseInt($(t).val() as string || "0");
            }
        });
        html.find("input[name='traitPtsSpent']").val(sum).change();
    }

    _calculateRelationshipCost(target: JQuery<HTMLElement>): void {
        const parent = target.parent();
        if (!parent.children("input[name='relationshipName']").val()) {
            parent.parent().children("input[name='relationshipCost']").val(0).change();
            return;
        }
        
        const relData = extractRelationshipData(parent);
        let sum = relData.power;
        if (relData.forbidden) { sum --; }
        if (relData.hateful) { sum -= 2; }
        if (relData.closeFamily) { sum -= 2; }
        if (relData.otherFamily) { sum --; }
        if (relData.romantic) { sum -= 2; }

        parent.parent().children("input[name='relationshipCost']").val(sum).change();
    }

    private _calculateRepAffCost(target: JQuery): void {
        const parent = target.parent();
        if (!parent.children("input[name='reputationName']").val()) {
            parent.children("input[name='reputationCost']").val(0).change();
            return;
        }
        const isAff = parent.children("input[name='reputationType']").prop("checked");
        const dice = parseInt(parent.children("input[name='reputationDice']").val() as string) || 0;
        if (isAff) {
            const result = dice === 1 ? 10 : (dice === 2 ? 25 : (dice === 3 ? 50 : 0));
            parent.children("input[name='reputationCost']").val(result).change();
        } else {
            const result = dice === 1 ? 7 : (dice === 2 ? 25 : (dice === 3 ? 45 : 0));
            parent.children("input[name='reputationCost']").val(result).change();
        } 
    }

    private _calculateSkillExponent(target: JQuery, html: JQuery): void {
        const skillRow = $(target).parent();
        if (!skillRow.children("*[name='skillName']").val()) {
            return;
        }
        const root1 = skillRow.children("*[name='skillRoot1']").val() as string;
        const root2 = skillRow.children("*[name='skillRoot2']").val() as string;
        const advances = parseInt(skillRow.children("*[name='skillAdvances']").val() as string) || 0;
        let root1exp = parseInt(html.find(`*[name='${root1}Spent']`).val() as string) || 1;
        const root2exp = parseInt(html.find(`*[name='${root2}Spent']`).val() as string) || root1exp;
        const root1Shade = parseInt(html.find(`*[name='${root1}ShadeSpent']`).val() as string) || 0;
        let root2Shade = parseInt(html.find(`*[name='${root2}ShadeSpent']`).val() as string);
        if (isNaN(root2Shade)) { root2Shade = root1Shade; }
        if (root1Shade != root2Shade) {
            root1exp += 2;
        }

        let result = Math.floor((root1exp + root2exp) / 4.0) + advances;
        if (!skillRow.children("*[name='skillOpened']").prop("checked")) { result = 0; }

        skillRow.children("*[name='skillExponent']").val(result);
        skillRow.children("*[name='skillShadeRefund']").val(-Math.min(root1Shade, root2Shade));
        skillRow.children("*[name='skillShade']").val(Math.min(root1Shade, root2Shade)).change();
    }

    private _calculateAllSkillExponents(e: JQuery.ChangeEvent, html: JQuery): void {
        const inputName = $(e.currentTarget).prop("name");
        let statName = inputName.substring(0, inputName.length-5);
        if (inputName.indexOf("Shade") !== -1) {
            statName = statName.substring(0, statName.length-5);
        }
        html.find("select[name='skillRoot1'], select[name='skillRoot2']").each((_, element) => {
            if ($(element).val() === statName) {
                this._calculateSkillExponent($(element), html);
            }
        });
    }

    private _calculateSkillWorth(e: JQuery.ChangeEvent): void {
        const parent = $(e.currentTarget).parent();
        const advances = parseInt(parent.children("*[name='skillAdvances']").val() as string) || 0;
        const shade = parseInt(parent.children("*[name='skillShade']").val() as string) || 0;
        const refund = parseInt(parent.children("*[name='skillShadeRefund']").val() as string) || 0;
        const open = parent.children("*[name='skillOpened']").prop("checked") ? 1 : 0;
        const training = parent.children("*[name='skillTraining']").prop("checked") ? open : 0;
        parent.children("*[name='skillPtsWorth']").val(advances + shade + open + training + refund).change();
    }

    _tryLoadTrait(e: JQueryInputEventObject): void {
        const inputTarget = $(e.currentTarget);
        const lookupCallback = () => {
            const traitName = inputTarget.val() as string;
            this._itemLookup.loading = false;
            if (!traitName) {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("none");
                inputTarget.siblings("*[name='traitId']").val("");
                inputTarget.siblings("*[name='traitCost']").val("0").change();
                return;
            }
            const trait = this._traits.find(t => t.name === traitName);
            if (!trait) {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("fail");
                inputTarget.siblings("*[name='traitId']").val("");
                inputTarget.siblings("*[name='traitCost']").val("1").change();
            }
            else {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("success");
                inputTarget.siblings("*[name='traitType']").val(trait.data.data.traittype).change();
                inputTarget.siblings("*[name='traitId']").val(trait._id);
                const cost = isNaN(trait.data.data.pointCost) ? 1 : trait.data.data.pointCost;
                inputTarget.siblings("*[name='traitCost']").val(cost).change();
            }
        };

        if (!this._itemLookup.loading) {
            this._itemLookup.loading = true;
            this._itemLookup.timer = window.setTimeout(lookupCallback, 1000);
            inputTarget.siblings(".load-status").removeClass(["none", "fail", "success", "loading"]).addClass("loading");
        } else {
            window.clearTimeout(this._itemLookup.timer);
            this._itemLookup.timer = window.setTimeout(lookupCallback, 1000);
        }
    }

    private _tryLoadSkill(e: JQueryInputEventObject): void {
        const inputTarget = $(e.currentTarget);
        
        const lookupCallback = () => {
            const skillName = inputTarget.val() as string;
            this._itemLookup.loading = false;
            if (!skillName) {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("none");
                inputTarget.siblings("*[name='skillId']").val("");
                return;
            }
            const skill = this._skills.find(s => s.name === skillName);
            if (!skill) {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("fail");
                inputTarget.siblings("*[name='skillId']").val("");
            }
            else {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("success");
                inputTarget.siblings("*[name='skillRoot1']").val(skill.data.data.root1).change();
                inputTarget.siblings("*[name='skillRoot2']").val(skill.data.data.root2).change();
                inputTarget.siblings("*[name='skillTraining']").prop("checked", skill.data.data.training);
                inputTarget.siblings("*[name='skillId']").val(skill._id);
            }
        };

        if (!this._itemLookup.loading) {
            this._itemLookup.loading = true;
            this._itemLookup.timer = window.setTimeout(lookupCallback, 1000);
            inputTarget.siblings(".load-status").removeClass(["none", "fail", "success", "loading"]).addClass("loading");
        } else {
            window.clearTimeout(this._itemLookup.timer);
            this._itemLookup.timer = window.setTimeout(lookupCallback, 1000);
        }
    }

    private _tryLoadProperty(e: JQueryInputEventObject): void {
        const inputTarget = $(e.currentTarget);
        const lookupCallback = () => {
            const propertyName = inputTarget.val() as string;
            this._itemLookup.loading = false;
            if (!propertyName) {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("none");
                inputTarget.siblings("*[name='propertyId']").val("");
                inputTarget.siblings("*[name='propertyCost']").val("0").change();
                return;
            }
            const property = this._property.find(p => p.name === propertyName);
            if (!property) {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("fail");
                inputTarget.siblings("*[name='propertyId']").val("");
            }
            else {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("success");
                inputTarget.siblings("*[name='propertyId']").val(property._id);
                inputTarget.siblings("*[name='propertyCost']").val(property.data.data.pointCost || 0).change();
            }
        };

        if (!this._itemLookup.loading) {
            this._itemLookup.loading = true;
            this._itemLookup.timer = window.setTimeout(lookupCallback, 1000);
            inputTarget.siblings(".load-status").removeClass(["none", "fail", "success", "loading"]).addClass("loading");
        } else {
            window.clearTimeout(this._itemLookup.timer);
            this._itemLookup.timer = window.setTimeout(lookupCallback, 1000);
        }
    }

    private _tryLoadGear(e: JQueryInputEventObject): void {
        const inputTarget = $(e.currentTarget);
        const lookupCallback = () => {
            const gearName = inputTarget.val() as string;
            this._itemLookup.loading = false;
            if (!gearName) {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("none");
                inputTarget.siblings("*[name='gearId']").val("");
                inputTarget.siblings("*[name='itemCost']").val("0").change();
                return;
            }
            const gear = this._gear.find(p => p.name === gearName);
            if (!gear) {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("fail");
                inputTarget.siblings("*[name='gearId']").val("");
            }
            else {
                inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("success");
                inputTarget.siblings("*[name='itemType']").val(gear.type);
                inputTarget.siblings("*[name='gearId']").val(gear._id);
                inputTarget.siblings("*[name='itemCost']").val((gear.data.data as HasPointCost).pointCost || 0).change();
            }
        };

        if (!this._itemLookup.loading) {
            this._itemLookup.loading = true;
            this._itemLookup.timer = window.setTimeout(lookupCallback, 1000);
            inputTarget.siblings(".load-status").removeClass(["none", "fail", "success", "loading"]).addClass("loading");
        } else {
            window.clearTimeout(this._itemLookup.timer);
            this._itemLookup.timer = window.setTimeout(lookupCallback, 1000);
        }
    }

    private _storeSum(html: JQuery, targetName: string, ...sourceNames: string[]): void {
        html.find(`input[name="${targetName}"]`).val(this._calculateSum(html, ...sourceNames)).change();
    }

    private _storeDiff(html: JQuery, targetName: string, source1: string, source2: string) {
        const sum1 = this._calculateSum(html, source1);
        const sum2 = this._calculateSum(html, source2);
        html.find(`input[name="${targetName}"]`).val(sum1 - sum2).change();
    }

    private _calculateSum(html: JQuery, ...sourceNames: string[]): number {
        const selector = sourceNames.map(a => `input[name='${a}'], select[name='${a}']`).join(', ');
        let total = 0;
        html.find(selector).each((_i, elem) => { total += parseInt($(elem).val() as string) || 0; });
        return total;
    }

    private async _finishBurning(e: JQuery.ClickEvent, html: JQuery): Promise<unknown> {
        e.preventDefault();
        return Dialog.confirm({
            title: "About to Apply Burner Sheet",
            content: "You are about to submit the character burner worksheet result. If this is being done to an already burned character it may do some damage. Continue?",
            yes: async () => {
                const baseCharacterData = extractBaseCharacterData(html);
                const skillData = extractSkillData(html, this._skills);
                const traitData = extractTraitData(html, this._traits);
                const propertyData = extractPropertyData(html, this._property);
                const repData = extractRepuatationData(html);
                const relData = extractRelData(html);
                const gearData = extractGearData(html, this._gear);
                await this._parent.update({ data: baseCharacterData }, {});
                await this._parent.updatePtgs();
                
                this.close();
        
                return this._parent.createEmbeddedEntity("OwnedItem", [
                    ...skillData,
                    ...traitData,
                    ...propertyData,
                    ...repData,
                    ...relData,
                    ...gearData,
                ], {});
            },
            no: () => { return; }
        });
    }

    close(): Promise<unknown> {
        this._burnerListeners.forEach(b => b.off());
        return super.close();
    }
}

interface CharacterBurnerData {
    data: {
        lps: number;
        lifepaths: LifepathEntry[];
        skills: SkillEntry[];
        traits: unknown[];
        reputations: unknown[];
        gear: unknown[];
        property: unknown[];
        relationships: unknown[];
    }
    ageTable: StringIndexedObject<{
        label: string;
        mental: number;
        physical: number;
    }[]>;
}

interface SkillEntry {
    name: string;
    root1: string;
    root2: string;
    open: boolean;
    training: boolean;
    skillId: string;
    shade: ShadeString
}

interface LifepathEntry {
    name: string;
    time: number;
    lead: number;
    resources: number;
    mentalStat: number;
    physicalStat: number;
    skillPts: number;
    generalSkillPts: number;
    traitPts: number;
}

const ageTable: StringIndexedObject<{
    label: string;
    mental: number;
    physical: number;
}[]> = {
    "Mannish Stock": [
        { label: "1-10", mental: 5, physical: 10 },
        { label: "11-14", mental: 6, physical: 13 },
        { label: "15-16", mental: 6, physical: 16 },
        { label: "17-25", mental: 7, physical: 16 },
        { label: "26-29", mental: 7, physical: 15 },
        { label: "30-35", mental: 7, physical: 14 },
        { label: "36-40", mental: 7, physical: 13 },
        { label: "41-55", mental: 7, physical: 12 },
        { label: "56-65", mental: 7, physical: 11 },
        { label: "66-79", mental: 7, physical: 10 },
        { label: "80-100", mental: 6, physical: 9 }
    ]
};
