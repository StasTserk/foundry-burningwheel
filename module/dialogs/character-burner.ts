import { BWActor } from "../actor.js";
import { ShadeString, StringIndexedObject, getItemsOfType } from "../helpers.js";
import { Skill } from "../items/item.js";

export class CharacterBurnerDialog extends Dialog {
    private readonly _parent: BWActor;
    private _burnerListeners: JQuery<HTMLElement>[];
    private readonly _skillLookup: {
        loading: boolean;
        timer: number;
    } = {
        loading: false,
        timer: 0
    };
    private _skills: Skill[];

    static async Open(parent: BWActor): Promise<Application> {
        const dialog = new CharacterBurnerDialog(parent);
        dialog._skills = await getItemsOfType<Skill>("skill");

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
        return mergeObject(super.defaultOptions, { width: 800, height: 800 }, { overwrite: true });
    }

    getData(): CharacterBurnerData {
        const data = super.getData() as CharacterBurnerData;
        const blankLifepath: LifepathEntry = { name: "", time: 0, lead: 0, resources: 0, mentalStat: 0, physicalStat: 0, skillPts: 0, generalSkillPts: 0, traitPts: 0 };
        const blankSkill: SkillEntry = { name: "", root1: "Perception", root2: "", open: false, training: false, skillId: "", shade: "B" };
        data.data = data.data || {};
        data.data.lifepaths = [];
        data.data.skills = [];
        data.ageTable = ageTable;
        data.data.lps = 4;
        for (let i = 0; i < 10; i ++) {
            data.data.lifepaths.push(Object.assign({}, blankLifepath));
        }
        for (let i = 0; i < 30; i ++) {
            data.data.skills.push(Object.assign({}, blankSkill));
        }
        data.data.lifepaths[0].name = "Born ...";

        return data;
    }

    activateListeners(html: JQuery): void {
        this._burnerListeners = [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            html.find("input[name='skillAdvances'], select[name='skillRoot1'], select[name='skillRoot2']").on('change', (e: JQuery.ChangeEvent) => this._calculateSkillExponent(e))
        ];
        super.activateListeners(html);
    }

    private _calculateSkillExponent(_e: JQuery.ChangeEvent): void {
        console.log("Updating starting exponent not implemented yet");
    }
    private _calculateSkillWorth(e: JQuery.ChangeEvent): void {
        const parent = $(e.currentTarget).parent();
        const advances = parseInt(parent.children("*[name='skillAdvances']").val() as string) || 0;
        const shade = parseInt(parent.children("*[name='skillShade']").val() as string) || 0;
        const open = parent.children("*[name='skillOpened']").prop("checked") ? 1 : 0;
        const training = parent.children("*[name='skillTraining']").prop("checked") ? open : 0;
        parent.children("*[name='skillPtsWorth']").val(advances + shade + open + training).change();
    }
    private _tryLoadSkill(e: JQueryInputEventObject): void {
        const inputTarget = $(e.currentTarget);
        
        const lookupCallback = () => {
            const skillName = inputTarget.val() as string;
            this._skillLookup.loading = false;
            if (!skillName) {
                inputTarget.siblings(".skill-status").removeClass("none loading fail success").addClass("none");
                inputTarget.siblings("*[name='skillId']").val("");
                return;
            }
            const skill = this._skills.find(s => s.name === skillName);
            if (!skill) {
                inputTarget.siblings(".skill-status").removeClass("none loading fail success").addClass("fail");
                inputTarget.siblings("*[name='skillId']").val("");
            }
            else {
                inputTarget.siblings(".skill-status").removeClass("none loading fail success").addClass("success");
                inputTarget.siblings("*[name='skillRoot1']").val(skill.data.data.root1).change();
                inputTarget.siblings("*[name='skillRoot2']").val(skill.data.data.root2).change();
                inputTarget.siblings("*[name='skillTraining']").prop("checked", skill.data.data.training);
                inputTarget.siblings("*[name='skillId']").val(skill._id);
            }
        };

        if (!this._skillLookup.loading) {
            this._skillLookup.loading = true;
            this._skillLookup.timer = window.setTimeout(lookupCallback, 1000);
            inputTarget.siblings(".skill-status").removeClass(["none", "fail", "success", "loading"]).addClass("loading");
        } else {
            window.clearTimeout(this._skillLookup.timer);
            this._skillLookup.timer = window.setTimeout(lookupCallback, 1000);
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
