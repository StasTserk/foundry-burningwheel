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
            html.find("input[name='time']").on('change', e => this._updateTotal(e, html, "time")),
            html.find("input[name='lead']").on('change', e => this._updateTotal(e, html, "lead")),
            html.find("input[name='resources']").on('change', e => this._updateTotal(e, html, "resources")),
            html.find("input[name='mentalStat']").on('change', e => this._updateTotal(e, html, "mentalStat")),
            html.find("input[name='physicalStat']").on('change', e => this._updateTotal(e, html, "physicalStat")),
            html.find("input[name='skillPts']").on('change', e => this._updateTotal(e, html, "skillPts")),
            html.find("input[name='generalSkillPts']").on('change', e => this._updateTotal(e, html, "generalSkillPts")),
            html.find("input[name='traitPts']").on('change', e => this._updateTotal(e, html, "traitPts"))
        ];
        super.activateListeners(html);
    }

    private _updateTotal(_e: JQuery.ChangeEvent<HTMLElement, undefined, HTMLElement, HTMLElement>, html: JQuery, fieldName: string): void {
        let total = 0;
        html.find(`input[name="${fieldName}"]`).each((_i, elem) => { total += parseInt($(elem).val() as string); });
        html.find(`input[name="${fieldName}Total"]`).val(total);
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