import { BWActor } from "../actor.js";

export class CharacterBurnerDialog extends Dialog {
    private _parent: BWActor;
    private _lpTotalBindings: JQuery<HTMLElement>[];

    static async Open(parent: BWActor): Promise<Application> {
        return new CharacterBurnerDialog(parent).render(true);
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
        data.data = data.data || {};
        data.data.lifepaths = [];
        data.data.lps = 4;
        for (let i = 0; i < 10; i ++) {
            data.data.lifepaths.push(Object.assign({}, blankLifepath));
        }
        data.data.lifepaths[0].name = "Born ...";

        return data;
    }

    activateListeners(html: JQuery): void {
        this._lpTotalBindings = [
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
            html.find("input[name='physicalPool'], input[name='physicalStatTotal']").on('change', _ =>
                this._storeSum(html, "physicalPoolTotal", "physicalStatTotal", "physicalPool")),
            html.find("input[name='physicalPoolTotal'], input[name='physicalPoolSpent']").on('change', _ =>
            this._storeDiff(html, "physicalPoolLeft", "physicalPoolTotal", "physicalPoolSpent")),

            html.find("input[name='skillPts']").on('change', _ => this._storeSum(html, "skillPtsTotal", "skillPts")),
            html.find("input[name='generalSkillPts']").on('change', _ => this._storeSum(html, "generalSkillPtsTotal", "generalSkillPts")),
            html.find("input[name='traitPts']").on('change', _ => this._storeSum(html, "traitPtsTotal", "traitPts")),

            html.find("input[name='mentalPoolTotal'], input[name='mentalPoolSpent']").on('change', _ =>
                this._storeDiff(html, "mentalPoolLeft", "mentalPoolTotal", "mentalPoolSpent")),
            html.find("input[name='willSpent'], select[name='willShadeSpent'], input[name='perceptionSpent'], select[name='perceptionShadeSpent']").on('change', _ => {
                this._storeSum(html, "mentalPoolSpent", "willSpent", "willShadeSpent", "mentalPoolOffset", "perceptionSpent", "perceptionShadeSpent");
            }),
            html.find("input[name='powerSpent'], select[name='powerShadeSpent'], input[name='forteSpent'], select[name='forteShadeSpent'], " +
                "input[name='agilitySpent'], select[name='agilityShadeSpent'], input[name='speedSpent'], select[name='speedShadeSpent']").on('change', _ => {
                this._storeSum(html, "physicalPoolSpent", "physicalPoolOffset",
                    "powerSpent", "powerShadeSpent", "forteSpent", "forteShadeSpent",
                    "agilitySpent", "agilityShadeSpent", "speedSpent", "speedShadeSpent");
            }),
        ];
        super.activateListeners(html);
    }

    private _storeSum(html: JQuery, targetName: string, ...sourceNames: string[]): void {
        html.find(`input[name="${targetName}"]`).val(this._calculateSum(html, ...sourceNames)).change();
        // html.find(`input[name="${targetName}"]`).change();
    }

    private _storeDiff(html: JQuery, targetName: string, source1: string, source2: string) {
        const sum1 = this._calculateSum(html, source1);
        const sum2 = this._calculateSum(html, source2);
        html.find(`input[name="${targetName}"]`).val(sum1 - sum2).change();
    }

    private _calculateSum(html: JQuery, ...sourceNames: string[]): number {
        const selector = sourceNames.map(a => `input[name='${a}'], select[name='${a}']`).join(', ');
        let total = 0;
        html.find(selector).each((_i, elem) => { total += parseInt($(elem).val() as string); });
        return total;
    }

    close(): Promise<unknown> {
        this._lpTotalBindings.forEach(b => b.off());
        return super.close();
    }
}

interface CharacterBurnerData {
    data: {
        lps: number;
        lifepaths: LifepathEntry[];
    }
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