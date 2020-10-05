import { BWActor } from "../bwactor.js";
import { ShadeString, StringIndexedObject, getItemsOfType, getItemsOfTypes, getCompendiumList } from "../helpers.js";
import { Skill, Trait, BWItem, Property, HasPointCost } from "../items/item.js";
import { extractRelationshipData, extractBaseCharacterData, extractSkillData, extractTraitData, extractPropertyData, extractReputationData, extractRelData, extractGearData } from "./burner-data-helpers.js";
import { BWCharacter } from "../character.js";

export class CharacterBurnerDialog extends Dialog {
    private readonly _parent: BWActor & BWCharacter;
    private _burnerListeners: JQuery<HTMLElement>[];
    private _skills: Skill[];
    private _traits: Trait[];
    private _gear: BWItem[];
    private _property: Property[];

    static async Open(parent: BWActor & BWCharacter): Promise<Application> {
        const html = await renderTemplate("systems/burningwheel/templates/dialogs/compendium-select.hbs", { compendiums: getCompendiumList() });
        const compendiumSelect = new Dialog({
            title: "Pick Compendiums",
            content: html,
            buttons: {
                select: {
                    label: "Select",
                    callback: async (html: JQuery) => {
                        const usedSources = html.find("input[name='compendiumList']:checked").map((_, e) => $(e).val() as string).toArray();

                        const loadingDialog = new Dialog({
                            title: "",
                            content: "<div class='loading-title'>Loading Character Burner data...</div><div class='burner-loading-spinner'><i class='fas fa-dharmachakra'></i></div>",
                            buttons: {},
                        }, {classes: ["loading-dialog"], width: "300px"});
                        await loadingDialog.render(true);
                        const dialog = new CharacterBurnerDialog(parent);
                        dialog._skills = await getItemsOfType<Skill>("skill", usedSources);
                        dialog._traits = await getItemsOfType<Trait>("trait", usedSources);
                        dialog._property = await getItemsOfType<Property>("property", usedSources);
                        dialog._gear = await getItemsOfTypes(["melee weapon", "ranged weapon", "armor", "spell", "possession"], usedSources);
                        await dialog.render(true);
                        return loadingDialog.close();
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            }
        });
        return compendiumSelect.render(true);
    }
    private constructor(parent: BWActor & BWCharacter) {
        super({ title: "Character Burner", buttons: {} });

        this._parent = parent;
    }

    get template(): string {
        return "systems/burningwheel/templates/dialogs/character-burner.hbs";
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

        data.data.skillNames = this._skills.map(s => s.name);
        data.data.traitNames = {
            Unrestricted: []
        };
        this._traits.forEach(s => {
            const trait = {
                name: s.name,
                label: s.data.data.pointCost ? `${s.name} - ${s.data.data.pointCost} Pts` : s.name
            };
            if (!s.data.data.restrictions) {
                data.data.traitNames.Unrestricted.push(trait);
                return;
            }
            if (!data.data.traitNames[s.data.data.restrictions]) {
                data.data.traitNames[s.data.data.restrictions] = [];   
            }
            data.data.traitNames[s.data.data.restrictions].push(trait);
        });
        data.data.propertyNames = this._property.map(p => p.name);
        data.data.armorNames = [];
        data.data.possessionNames = [];
        data.data.weaponNames = [];
        data.data.spellNames = [];

        this._gear.forEach(g => {
            const entry = { name: g.name, label: g.data.data.pointCost ? `${g.name} - ${g.data.data.pointCost} Pts` : g.name };
            switch(g.type) {
                case "melee weapon":
                case "ranged weapon":
                    data.data.weaponNames.push(entry);
                    break;
                case "armor":
                    data.data.armorNames.push(entry);
                    break;
                case "spell":
                    data.data.spellNames.push(entry);
                    break;
                case "possession":
                    data.data.possessionNames.push(entry);
                    break;
            }
        });

        return data;
    }

    activateListeners(html: JQuery): void {
        this._burnerListeners = [
            $(html.find("select[name='skillName']")).select2(defaultSelectOptions),
            $(html.find("select[name='traitName']")).select2(defaultSelectOptions),
            $(html.find("select[name='propertyName']")).select2(defaultSelectOptions),
            $(html.find("select[name='itemName']")).select2(defaultSelectOptions),

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
            html.find("select[name='skillName']").on('input', (e: JQueryInputEventObject) => this._tryLoadSkill(e)),
            html.find("input[name='skillAdvances'], input[name='skillOpened'], input[name='skillTraining'], select[name='skillShade']").on('change', (e: JQuery.ChangeEvent) =>
                this._calculateSkillWorth(e)),
            html.find("input[name='skillPtsWorth']").on('change', _ => this._storeSum(html, "skillPtsSpent", "skillPtsWorth")),

            html.find("*[name='powerSpent'], *[name='powerShadeSpent'], *[name='forteSpent'], *[name='forteShadeSpent'], " +
                "*[name='agilitySpent'], *[name='agilityShadeSpent'], *[name='speedSpent'], *[name='speedShadeSpent'], " + 
                "*[name='willSpent'], *[name='willShadeSpent'], *[name='perceptionSpent'], *[name='perceptionShadeSpent']").on('change', e => 
                this._calculateAllSkillExponents(e, html)),
            html.find("input[name='skillOpened'], input[name='skillAdvances'], select[name='skillRoot1'], select[name='skillRoot2']").on('change', (e: JQuery.ChangeEvent) => this._calculateSkillExponent(e.currentTarget, html)),

            // trait points spent
            html.find("select[name='traitName']").on('input', (e: JQueryInputEventObject) => this._tryLoadTrait(e)),
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

            // relationship totals
            html.find("input[name='relationshipName'], select[name='relPow'], select[name='relFam'], input[name='relRom'], input[name='relFor'], input[name='relHat']").on('change', e => 
                this._calculateRelationshipCost($(e.currentTarget))),
            html.find("input[name='relationshipCost']").on('change', _e => this._storeSum(html, "relationshipsSpent", "relationshipCost")),

            // property
            html.find("select[name='propertyName']").on('input', (e: JQueryInputEventObject) => this._tryLoadProperty(e)),
            html.find("input[name='propertyCost']").on('change', _ => this._storeSum(html, "propertySpent", "propertyCost")),
            // gear
            html.find("select[name='itemName']").on('input', (e: JQueryInputEventObject) => this._tryLoadGear(e)),
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
        const traitName = inputTarget.val() as string;
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
            const cost = (!trait.data.data.pointCost || isNaN(trait.data.data.pointCost)) ? 1 : trait.data.data.pointCost;
            inputTarget.siblings("*[name='traitCost']").val(cost).change();
        }
    }

    private _tryLoadSkill(e: JQueryInputEventObject): void {
        const inputTarget = $(e.currentTarget);
        const skillName = inputTarget.val() as string;
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
    }

    private _tryLoadProperty(e: JQueryInputEventObject): void {
        const inputTarget = $(e.currentTarget);
        const propertyName = inputTarget.val() as string;
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
    }

    private _tryLoadGear(e: JQueryInputEventObject): void {
        const inputTarget = $(e.currentTarget);
        const gearName = inputTarget.val() as string;
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
                const repData = extractReputationData(html);
                const relData = extractRelData(html);
                const gearData = extractGearData(html, this._gear);
                await this._parent.update({ data: baseCharacterData }, {});
                await this._parent.updatePtgs();

                skillData.forEach(s => { if (s.data) { s.data.learning = false; }});
                
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

        skillNames: string[];
        traitNames: StringIndexedObject<{ name: string, label: string }[]>;

        propertyNames: string[];
        armorNames: { name: string, label: string }[];
        possessionNames: { name: string, label: string }[];
        weaponNames: { name: string, label: string }[];
        spellNames: { name: string, label: string }[];
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
    "Men": [
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
    ],
    "Dwarves": [
        { label: "1-20", mental: 6, physical: 13 },
        { label: "21-30", mental: 7, physical: 13 },
        { label: "31-50", mental: 7, physical: 14 },
        { label: "51-76", mental: 8, physical: 15 },
        { label: "77-111", mental: 8, physical: 16 },
        { label: "112-151", mental: 9, physical: 16 },
        { label: "152-199", mental: 9, physical: 17 },
        { label: "200-245", mental: 10, physical: 18 },
        { label: "246-300", mental: 11, physical: 17 },
        { label: "301-345", mental: 11, physical: 16 },
        { label: "346-395", mental: 12, physical: 15 },
        { label: "397-445", mental: 11, physical: 14 },
        { label: "446-525", mental: 11, physical: 13 },
        { label: "526-600", mental: 10, physical: 12 }
    ],
    "Elves": [
        { label: "1-25", mental: 7, physical: 13 },
        { label: "26-60", mental: 8, physical: 13 },
        { label: "61-100", mental: 9, physical: 14 },
        { label: "101-125", mental: 9, physical: 15 },
        { label: "126-160", mental: 10, physical: 16 },
        { label: "161-225", mental: 10, physical: 17 },
        { label: "226-325", mental: 11, physical: 17 },
        { label: "326-425", mental: 12, physical: 17 },
        { label: "426-525", mental: 13, physical: 17 },
        { label: "526-625", mental: 13, physical: 16 },
        { label: "626-725", mental: 14, physical: 15 },
        { label: "726-825", mental: 14, physical: 14 },
        { label: "826-925", mental: 15, physical: 13 },
        { label: "926-1025", mental: 15, physical: 12 },
        { label: "1026-1125", mental: 15, physical: 12 },
        { label: "1126-1225", mental: 15, physical: 12 },
        { label: "1226-1325", mental: 15, physical: 12 },
        { label: "1325+", mental: 16, physical: 12 }
    ],
    "Orcs": [
        { label: "1-10", mental: 3, physical: 10 },
        { label: "11-16", mental: 4, physical: 11 },
        { label: "17-22", mental: 5, physical: 12 },
        { label: "23-30", mental: 6, physical: 13 },
        { label: "31-40", mental: 6, physical: 14 },
        { label: "41-50", mental: 6, physical: 15 },
        { label: "51-60", mental: 7, physical: 16 },
        { label: "61-80", mental: 7, physical: 17 },
        { label: "81-99", mental: 8, physical: 17 },
        { label: "100-125", mental: 8, physical: 18 },
        { label: "126-150", mental: 9, physical: 18 },
        { label: "151+", mental: 9, physical: 19 }
    ],
    "Roden": [
        { label: "1-5", mental: 6, physical: 10 },
        { label: "6-10", mental: 7, physical: 13 },
        { label: "11-15", mental: 7, physical: 14 },
        { label: "16-24", mental: 8, physical: 15 },
        { label: "25-30", mental: 8, physical: 14 },
        { label: "31-36", mental: 7, physical: 13 },
        { label: "37-40", mental: 7, physical: 12 },
        { label: "41-45", mental: 7, physical: 11 },
        { label: "46-49", mental: 6, physical: 10 }
    ],
    "Trolls": [
        { label: "1-5", mental: 3, physical: 11 },
        { label: "6-12", mental: 4, physical: 14 },
        { label: "13-19", mental: 4, physical: 17 },
        { label: "20-27", mental: 4, physical: 19 },
        { label: "28-57", mental: 4, physical: 20 },
        { label: "58-80", mental: 4, physical: 19 },
        { label: "81-124", mental: 4, physical: 18 },
        { label: "125-213", mental: 5, physical: 17 },
        { label: "214-390", mental: 5, physical: 16 },
        { label: "391-712", mental: 6, physical: 15 }
    ],
    "Great Wolves": [
        { label: "1", mental: 6, physical: 12 },
        { label: "2-3", mental: 7, physical: 16 },
        { label: "4-5", mental: 7, physical: 17 },
        { label: "6-7", mental: 7, physical: 16 },
        { label: "8-9", mental: 6, physical: 14 },
        { label: "10-11", mental: 6, physical: 12 },
        { label: "12-15", mental: 5, physical: 10 }
    ]
};

const defaultSelectOptions = {
    tags: true,
    width: "100%",
    placeholder: "",
    allowClear: true,
    maximumSelectionLength: 10
};