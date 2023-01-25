import { BWActor } from "../actors/BWActor.js";
import { ShadeString, StringIndexedObject, getItemsOfType, getItemsOfTypes, getCompendiumList, DragData, escapeQuotes } from "../helpers.js";
import { BWItem, HasPointCost, ItemType } from "../items/item.js";
import { extractRelationshipData, extractBaseCharacterData, extractSkillData, extractTraitData, extractPropertyData, extractReputationData, extractRelData, extractGearData } from "./burnerDataHelpers.js";
import { BWCharacter } from "../actors/BWCharacter.js";
import { Property, PropertyData } from "../items/property.js";
import { Skill } from "../items/skill.js";
import { Trait } from "../items/trait.js";
import { AffiliationData } from "../items/affiliation.js";
import { ReputationData } from "../items/reputation.js";
import { RelationshipData } from "../items/relationship.js";
import { Lifepath, LifepathData } from "../items/lifepath.js";
import { MeleeWeaponData } from "../items/meleeWeapon.js";
import { ArmorData } from "../items/armor.js";
import { PossessionData } from "../items/possession.js";
import { TypeMissing } from "../../types/index.js";

export class CharacterBurnerDialog extends Application {
    private readonly _parent: BWCharacter;
    private _burnerListeners: JQuery<HTMLElement>[];
    private _skills: Skill[];
    private _traits: Trait[];
    private _gear: BWItem[];
    private _property: Property[];

    static async Open(parent: BWCharacter): Promise<Application> {
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
                            default: ""
                        }, {classes: ["loading-dialog"], width: 300});
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
            },
            default: "select"
        });
        return compendiumSelect.render(true) as FormApplication;
    }
    private constructor(parent: BWCharacter) {
        super({ title: "Character Burner" });

        this._parent = parent;
    }

    get template(): string {
        return "systems/burningwheel/templates/dialogs/character-burner.hbs";
    }

    static get defaultOptions(): Application.Options {
        return mergeObject(super.defaultOptions, { width: 940, height: 800, classes: [ "bw-app" ] }, { overwrite: true });
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
        for (let i = 0; i < 18; i ++) {
            data.data.traits.push({});
        }

        for (let i = 0; i < 15; i++) {
            data.data.gear.push({});
        }

        for (let i = 0; i < 10; i ++) {
            data.data.property.push({});
            data.data.relationships.push({});
            data.data.reputations.push({});
        }

        data.data.skillNames = this._skills.map(s => s.name);
        data.data.traitNames = {
            Unrestricted: []
        };
        this._traits.forEach(s => {
            const trait = {
                name: s.name,
                label: s.system.pointCost ? `${s.name} - ${s.system.pointCost} Pts` : s.name
            };
            if (!s.system.restrictions) {
                data.data.traitNames.Unrestricted.push(trait);
                return;
            }
            if (!data.data.traitNames[s.system.restrictions]) {
                data.data.traitNames[s.system.restrictions] = [];   
            }
            data.data.traitNames[s.system.restrictions].push(trait);
        });
        data.data.propertyNames = this._property.map(p => p.name);
        data.data.armorNames = [];
        data.data.possessionNames = [];
        data.data.weaponNames = [];
        data.data.spellNames = [];

        this._gear.forEach((g: BWItem<PropertyData|MeleeWeaponData|ArmorData|PossessionData>) => {
            const entry = { name: g.name, label: g.system.pointCost ? `${g.name} - ${g.system.pointCost} Pts` : g.name };
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

            html.on('drop', e => { this._handleDrop(e); }),

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
            html.find("select[name='skillName']").on('change', (e) => this._tryLoadSkill(e)),
            html.find("input[name='skillAdvances'], input[name='skillOpened'], input[name='skillTraining'], input[name='skillMagic'], select[name='skillShade']").on('change', (e: JQuery.ChangeEvent) =>
                this._calculateSkillWorth(e)),
            html.find("input[name='skillPtsWorth']").on('change', _ => this._storeSum(html, "skillPtsSpent", "skillPtsWorth")),

            html.find("*[name='powerSpent'], *[name='powerShadeSpent'], *[name='forteSpent'], *[name='forteShadeSpent'], " +
                "*[name='agilitySpent'], *[name='agilityShadeSpent'], *[name='speedSpent'], *[name='speedShadeSpent'], " + 
                "*[name='willSpent'], *[name='willShadeSpent'], *[name='perceptionSpent'], *[name='perceptionShadeSpent']," + 
                "*[name='custom1Spent'], *[name='custom1Shade'], *[name='custom2Spent'], *[name='custom2Shade']").on('change', e => 
                this._calculateAllSkillExponents(e, html)),
            html.find("input[name='skillOpened'], input[name='skillAdvances'], select[name='skillRoot1'], select[name='skillRoot2']").on('change', (e: JQuery.ChangeEvent) => this._calculateSkillExponent(e.currentTarget, html)),

            // trait points spent
            html.find("select[name='traitName']").on('change', (e) => this._tryLoadTrait(e)),
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
            html.find("select[name='propertyName']").on('change', (e: JQuery.TriggeredEvent) => this._tryLoadProperty(e)),
            html.find("input[name='propertyCost']").on('change', _ => this._storeSum(html, "propertySpent", "propertyCost")),
            // gear
            html.find("select[name='itemName']").on('change', (e: JQuery.TriggeredEvent) => this._tryLoadGear(e)),
            html.find("input[name='itemCost']").on('change', _ => this._storeSum(html, "gearSpent", "itemCost")),

            // extra rules totals
            html.find("input[name='reputationSpent'], input[name='propertySpent']").on('change', _ => this._storeSum(html, "resourceExponentAmount", "reputationSpent", "propertySpent")),
            html.find("input[name='relationshipsSpent'], input[name='propertySpent']").on('change', _ => this._storeSum(html, "circlesExponentBonus", "relationshipsSpent", "propertySpent")),

            html.find("button.submit-burner-button").on('click', e => this._finishBurning(e, html)),

            html.find(".skills-grid .fa-check-circle").on('click', e => this._openItemSheet(e, '.skills-grid', 'input[name="skillId"]', this._skills)),
            html.find(".burner-traits-grid .fa-check-circle").on('click', e => this._openItemSheet(e, '.burner-traits-grid', 'input[name="traitId"]', this._traits)),
            html.find(".burner-property .fa-check-circle").on('click', e => this._openItemSheet(e, '.burner-property', 'input[name="propertyId"]', this._property)),
            html.find(".burner-gear .fa-check-circle").on('click', e => this._openItemSheet(e, '.burner-gear', 'input[name="gearId"]', this._gear)),
        ];
        super.activateListeners(html);
    }
    private _openItemSheet(e: JQuery.ClickEvent, parentSelector: string, idSelector: string, items: BWItem[]): void {
        const idElement = $(e.currentTarget).closest(parentSelector).find(idSelector);
        if (idElement.val()) {
            const item = items.find(i => i.id === idElement.val());
            if (item) {
                item.sheet?.render(true);
            }
        }
    }
    private async _handleDrop(e: JQuery.DropEvent) {
        let data: DragData;
        try {
            data = JSON.parse(e.originalEvent?.dataTransfer?.getData('text/plain') || "");
        }
        catch (err) {
            return false;
        }
        if (data.type === "Item") {
            let item: BWItem | undefined;
            if (data.uuid) {
                item = await fromUuid(data.uuid) as BWItem;
            }
            else if (data.actorId && data.id) {
                if (data.pack) {
                    // this item is dragged out of an actor in a compendium. The most common use case for this is Settings + Lifepaths
                    const actor = await (game.packs?.find(p => p.collection === data.pack) as CompendiumCollection).getDocument(data.actorId) as Actor;
                    item = actor.items.get(data.id) as BWItem;
                } else {
                    item = (game.actors?.find((a: BWActor) => a.id === data.actorId) as BWActor).items.get(data.id) as BWItem;
                }
            } else if (data.pack && data.id) {
                item = await (game.packs?.find(p => p.collection === data.pack) as CompendiumCollection).getDocument(data.id) as BWItem;
            } else {
                item = game.items?.find((i: BWItem) => i.id === data.id) as BWItem;
            }
            if (item) {
                this._insertItem(item);
            }
        }
    }
    private _insertItem(item: BWItem) {
        if (item.type === "lifepath") {
            this._addLifepath(item as Lifepath);
        } else {
            this._ensureCached(item);
            this._addEntry(item.name, item.type, false, item.system);
        }
    }
    private _addLifepath(lp: Lifepath) {
        const pathData = duplicate(lp.system) as LifepathData;
        const numDuplicates = $(this.element).find('input[name="lifepathName"]').filter((_, e) => $(e).val() === lp.name).length;
        const emptyLifepath = $(this.element).find('.lifepath-grid > input[name="lifepathName"]').filter((_, e) => !$(e).val()).first();

        const skillList = pathData.skillList.split(',').map(i => i.trim()).filter(i => i);
        const traitList = pathData.traitList.split(',').map(i => i.trim()).filter(i => i);

        switch (numDuplicates) {
            case 0:
                break;
            case 1:
                if (traitList.length <= 1) {
                    pathData.traitPoints = Math.max(pathData.traitPoints -1, 0);
                }
                break;
            case 2:
                pathData.statBoost = "none";
                pathData.traitPoints = 0;
                pathData.resources = Math.floor(pathData.resources / 2);
                pathData.skillPoints = Math.floor(pathData.skillPoints / 2);
                pathData.generalPoints = Math.floor(pathData.generalPoints / 2);
                break;
            default:
                pathData.resources = Math.floor(pathData.resources / 2);
                pathData.statBoost = "none";
                pathData.traitPoints = 0;
                pathData.skillPoints = 0;
                pathData.generalPoints = 0;
        }

        emptyLifepath.val(lp.name);
        emptyLifepath.next().val(pathData.time).trigger('change')
            .next().val(0)
            .next().val(pathData.resources).trigger('change')
            .nextAll('input[name="skillPts"]').first().val(pathData.skillPoints).trigger('change')
            .next().val(pathData.generalPoints).trigger('change')
            .next().val(pathData.traitPoints).trigger('change');
        
        const mentalPoints = emptyLifepath.nextAll('.inline-text').first().children('input[name="mentalStat"]').first();
        const physicalPoints = emptyLifepath.nextAll('.inline-text').first().next().children('input[name="physicalStat"]').first();
        const boostAmount = pathData.subtractStats ? -1 : 1;

        switch (pathData.statBoost) { 
            case "both":
                mentalPoints.val(boostAmount).trigger('change');
                physicalPoints.val(boostAmount).trigger('change');
                break;
            case "mentwo":
                mentalPoints.val(2*boostAmount).trigger('change');
                break;
            case "mental":
                mentalPoints.val(boostAmount).trigger('change');
                break;
            case "phystwo":
                physicalPoints.val(2*boostAmount).trigger('change');
                break;
            case "physical":
                physicalPoints.val(boostAmount).trigger('change');
                break;
            case "either":
                new Dialog({
                    title: "Bonus Stat Point Choice",
                    content: "<p>This lifepath allows a stat point to be assigned to either the mental or physical pools</p>",
                    buttons: {
                        mental: {
                            label: "Assign to Mental",
                            callback: () => { mentalPoints.val(boostAmount).trigger('change'); }
                        },
                        physical: {
                            label: "Assign to Physical",
                            callback: () => { physicalPoints.val(boostAmount).trigger('change'); }
                        }
                    },
                    default: "mental"
                }).render(true);
                break;
        }

        const requiredIndex = numDuplicates;
        skillList.forEach((s, i) => this._addEntry(s, "skill", requiredIndex === i));
        traitList.forEach((t, i) => this._addEntry(t, "trait", requiredIndex === i));
    }

    private _ensureCached(item: BWItem) {
        switch (item.type) {
            case "skill":
                if (!this._skills.find(s => s.name === item.name)) {
                    this._skills.push(item as Skill);
                }
                break;
            case "trait":
                if (!this._traits.find(t => t.name === item.name)) {
                    this._traits.push(item as Trait);
                }
                break;
            case "property":
                if (!this._property.find(p => p.name === item.name)) {
                    this._property.push(item as Property);
                }
                break;
            case "possession": case "melee weapon": case "ranged weapon": case "spell":
                if (!this._gear.find(g => g.name === item.name)) {
                    this._gear.push(item);
                }
                break;
            default:
                break;
        }
    }

    private _addEntry(itemName: string, itemType: ItemType, required?: boolean, itemData?: unknown) {
        let element: JQuery;
        switch (itemType) {
            case "skill":
                element = $(this.element).find('.skills-grid > select[name="skillName"]').filter((_, e) => !$(e).val()).first();

                // if a skill is already included don't double include it
                if (!$(this.element).find(`select[name="skillName"]`).filter((_, element) => $(element).val() === itemName).length) {
                    // Set the value, creating a new option if necessary
                    if (element.find(`option[value='${escapeQuotes(itemName)}']`).length) {
                        element.val(itemName).trigger('change');
                    } else {
                        // Create a DOM Option and pre-select by default
                        const newOption = new Option(itemName, itemName, true, true);
                        // Append it to the select
                        element.append(newOption).val(itemName).trigger('change');
                    }
                    if (required) {
                        element.nextAll("input[type='checkbox']").first().prop('checked', true);
                    }
                } else {
                    if (required) {
                        element = $(this.element)
                            .find(`select[name="skillName"]`)
                            .filter((_, element) => $(element).val() === itemName)
                            .first()
                            .nextAll("input[type='checkbox']")
                            .first()
                            .prop('checked', true);
                    }
                }
                break;
            case "trait":
                element = $(this.element).find('select[name="traitName"]').filter((_, e) => !$(e).val()).first();
                // if a skill is already included don't double include it
                if (!$(this.element).find(`select[name="traitName"]`).filter((_, element) => $(element).val() === itemName).length) {
                    // Set the value, creating a new option if necessary
                    if (element.find(`option[value='${escapeQuotes(itemName)}']`).length) {
                        element.val(itemName).trigger('change');
                    } else { 
                        // Create a DOM Option and pre-select by default
                        const newOption = new Option(itemName, itemName, true, true);
                        // Append it to the select
                        element.append(newOption).val(itemName).trigger('change');
                    }
                    if (required) {
                        element.nextAll("input[type='checkbox']").first().prop('checked', true);
                    }
                } else {
                    if (required) {
                        element = $(this.element)
                            .find(`select[name="traitName"]`)
                            .filter((_, element) => $(element).val() === itemName)
                            .first()
                            .nextAll("input[type='checkbox']")
                            .first()
                            .prop('checked', true);
                    }
                }

                break;
            case "property":
                element = $(this.element).find('select[name="propertyName"]').filter((_, e) => !$(e).val()).first();
                // Set the value, creating a new option if necessary
                if (element.find(`option[value='${escapeQuotes(itemName)}']`).length) {
                    element.val(itemName).trigger('change');
                } else { 
                    // Create a DOM Option and pre-select by default
                    const newOption = new Option(itemName, itemName, true, true);
                    // Append it to the select
                    element.append(newOption).val(itemName).trigger('change');
                }
                break;
                break;
            case "reputation": case "affiliation":
                element = $(this.element).find('input[name="reputationName"]').filter((_, e) => !$(e).val()).first();
                element.val(itemName).trigger('change');
                element.nextAll('input[type="checkbox"]').first().prop('checked', itemName === "reputation").trigger('change');
                element.nextAll('input[type="number"]').first().val((itemData as ReputationData | AffiliationData).dice).trigger('change');
                break;
            case "relationship":
                const rel = itemData as RelationshipData;
                element = $(this.element).find('input[name="relationshipName"]').filter((_, e) => !$(e).val()).first();
                if (rel.influence === "significant") {
                    element.nextAll('select[name="relPow"]').val(10);
                } else if (rel.influence === "powerful") {
                    element.nextAll('select[name="relPow"]').val(15);
                }
                if (rel.immediateFamily) {
                    element.nextAll('select[name="relFam"]').val(-2);
                } else if (rel.otherFamily) {
                    element.nextAll('select[name="relFam"]').val(-1);
                }

                if (rel.romantic) {
                    element.nextAll('input[name="relRom"]').prop('checked', true);
                }
                if (rel.forbidden) {
                    element.nextAll('input[name="relFor"]').prop('checked', true);
                }
                if (rel.hateful) {
                    element.nextAll('input[name="relHat"]').prop('checked', true);
                }

                element.val(itemName).trigger('change');
                break;
            default:
                // possessions, weapons, and spells
                element = $(this.element).find('.burner-gear select[name="itemName"]').filter((_, e) => !$(e).val()).first();
                // Set the value, creating a new option if necessary
                if (element.find(`option[value='${escapeQuotes(itemName)}']`).length) {
                    element.val(itemName).trigger('change');
                } else { 
                    // Create a DOM Option and pre-select by default
                    const newOption = new Option(itemName, itemName, true, true);
                    // Append it to the select
                    element.append(newOption).val(itemName).trigger('change');
                }
                break;
        }
        
    }
    
    _calculateSpentTraits(html: JQuery<HTMLElement>): void {
        // , "traitPtsSpent", "traitCost"
        let sum = 0;
        html.find("input[name='traitCost']").each((_, t) => {
            if ($(t).prev().prop("checked")) {
                sum += parseInt($(t).val() as string || "0");
            }
        });
        html.find("input[name='traitPtsSpent']").val(sum).trigger("change");
    }

    _calculateRelationshipCost(target: JQuery<HTMLElement>): void {
        const parent = target.parent();
        if (!parent.children("input[name='relationshipName']").val()) {
            parent.parent().children("input[name='relationshipCost']").val(0).trigger("change");
            return;
        }
        
        const relData = extractRelationshipData(parent);
        let sum = relData.power;
        if (relData.forbidden) { sum --; }
        if (relData.hateful) { sum -= 2; }
        if (relData.closeFamily) { sum -= 2; }
        if (relData.otherFamily) { sum --; }
        if (relData.romantic) { sum -= 2; }

        parent.parent().children("input[name='relationshipCost']").val(sum).trigger("change");
    }

    private _calculateRepAffCost(target: JQuery): void {
        const parent = target.parent();
        if (!parent.children("input[name='reputationName']").val()) {
            parent.children("input[name='reputationCost']").val(0).trigger("change");
            return;
        }
        const isAff = !(parent.children("input[name='reputationType']").prop("checked"));
        const dice = parseInt(parent.children("input[name='reputationDice']").val() as string) || 0;
        if (isAff) {
            const result = dice === 1 ? 10 : (dice === 2 ? 25 : (dice === 3 ? 50 : 0));
            parent.children("input[name='reputationCost']").val(result).trigger("change");
        } else {
            const result = dice === 1 ? 7 : (dice === 2 ? 25 : (dice === 3 ? 45 : 0));
            parent.children("input[name='reputationCost']").val(result).trigger("change");
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
        skillRow.children("*[name='skillShade']").val(Math.min(root1Shade, root2Shade)).trigger("change");
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
        const magical = parent.children("*[name='skillMagic']").prop("checked") && !training ? open : 0;
        parent.children("*[name='skillPtsWorth']").val(advances + shade + open + training + magical + refund).trigger("change");
    }

    _tryLoadTrait(e: JQuery.TriggeredEvent): void {
        const inputTarget = $(e.currentTarget);
        const traitName = inputTarget.val() as string;
        if (!traitName) {
            inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("none");
            inputTarget.siblings("*[name='traitId']").val("");
            inputTarget.siblings("*[name='traitCost']").val("0").trigger("change");
            return;
        }
        const trait = this._traits.find(t => t.name === traitName);
        if (!trait) {
            inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("fail");
            inputTarget.siblings("*[name='traitId']").val("");
            inputTarget.siblings("*[name='traitCost']").val("1").trigger("change");
        }
        else {
            inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("success");
            inputTarget.siblings("*[name='traitType']").val(trait.system.traittype).trigger("change");
            inputTarget.siblings("*[name='traitId']").val(trait.id);
            const cost = (!trait.system.pointCost || isNaN(trait.system.pointCost)) ? 1 : trait.system.pointCost;
            inputTarget.siblings("*[name='traitCost']").val(cost).trigger("change");
        }
    }

    private _tryLoadSkill(e: JQuery.TriggeredEvent): void {
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
            inputTarget.siblings("*[name='skillRoot1']").val(skill.system.root1).trigger("change");
            inputTarget.siblings("*[name='skillRoot2']").val(skill.system.root2).trigger("change");
            inputTarget.siblings("*[name='skillTraining']").prop("checked", skill.system.training);
            inputTarget.siblings("*[name='skillMagic']").prop("checked", skill.system.magical);
            inputTarget.siblings("*[name='skillId']").val(skill.id);
        }
    }

    private _tryLoadProperty(e: JQuery.TriggeredEvent): void {
        const inputTarget = $(e.currentTarget);
        const propertyName = inputTarget.val() as string;
        if (!propertyName) {
            inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("none");
            inputTarget.siblings("*[name='propertyId']").val("");
            inputTarget.siblings("*[name='propertyCost']").val("0").trigger("change");
            return;
        }
        const property = this._property.find(p => p.name === propertyName);
        if (!property) {
            inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("fail");
            inputTarget.siblings("*[name='propertyId']").val("");
        }
        else {
            inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("success");
            inputTarget.siblings("*[name='propertyId']").val(property.id);
            inputTarget.siblings("*[name='propertyCost']").val(property.system.pointCost || 0).trigger("change");
        }
    }

    private _tryLoadGear(e: JQuery.TriggeredEvent): void {
        const inputTarget = $(e.currentTarget);
        const gearName = inputTarget.val() as string;
        if (!gearName) {
            inputTarget.siblings(".load-status").removeClass("none loading fail success").addClass("none");
            inputTarget.siblings("*[name='gearId']").val("");
            inputTarget.siblings("*[name='itemCost']").val("0").trigger("change");
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
            inputTarget.siblings("*[name='gearId']").val(gear.id);
            inputTarget.siblings("*[name='itemCost']").val((gear.system as HasPointCost).pointCost || 0).trigger("change");
        }
    }

    private _storeSum(html: JQuery, targetName: string, ...sourceNames: string[]): void {
        html.find(`input[name="${targetName}"]`).val(this._calculateSum(html, ...sourceNames)).trigger("change");
    }

    private _storeDiff(html: JQuery, targetName: string, source1: string, source2: string) {
        const sum1 = this._calculateSum(html, source1);
        const sum2 = this._calculateSum(html, source2);
        html.find(`input[name="${targetName}"]`).val(sum1 - sum2).trigger("change");
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
        
                return this._parent.createEmbeddedDocuments("Item", [
                    ...skillData,
                    ...traitData,
                    ...propertyData,
                    ...repData,
                    ...relData,
                    ...gearData,
                ] as TypeMissing[], { keepId: false });
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
