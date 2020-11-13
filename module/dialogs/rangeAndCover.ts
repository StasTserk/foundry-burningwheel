import { BWActor } from "../bwactor.js";
import { ExtendedTestData, ExtendedTestDialog } from "./extendedTestDialog.js";

export class RangeAndCoverDialog extends ExtendedTestDialog<RangeAndCoverData> {
    constructor(d: DialogData, o?: ApplicationOptions) {
        super(d, o);
        this.data.topic = "range-and-cover";
        this.data.settingName = "rnc-data";
        this.data.data.memberIds = this.data.data.memberIds || [];
        this.data.data.teams = this.data.data.teams || [];
    }
    data: RangeAndCoverDialogData;

    get template(): string {
        return "systems/burningwheel/templates/dialogs/range-and-cover.hbs";
    }

    activateSocketListeners(): void {
        super.activateSocketListeners();
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find('input[name="showV1"], input[name="showV2"], input[name="showV3"]').on('change', (e: JQuery.ChangeEvent) => this.propagateChange(e));
        html.find('select[name="newTeam"]').on('change', (e: JQuery.ChangeEvent) => this._addNewTeam(e.target));
        html.find('select[name="newMember"]').on('change', (e: JQuery.ChangeEvent) => this._addNewMember(e.target));
        html.find('*[data-action="delete-member"]').on('click', (e: JQuery.ClickEvent) => this._deleteMember(e.target));
        html.find('*[data-action="toggle-hidden"]').on('click', (e: JQuery.ClickEvent) => this._toggleHidden(e.target));
        html.find('.team-grid select, .team-grid input').on('change', (e: JQuery.ChangeEvent) => this.updateCollection(e, this.data.data.teams));
    }

    private _toggleHidden(target: HTMLElement): void {
        const index = parseInt(target.dataset.index || "0");
        const team = this.data.data.teams[index];

        team.hideActions = !team.hideActions;

        this.persistState(this.data.data);
        this.syncData(this.data.data);
        this.render();
    }

    private _addNewTeam(target: HTMLSelectElement): void {
        const id = target.value;
        const actor = this.data.actors.find(a => a.id === id) as BWActor;
        this.data.data.teams.push({
            members: [{ id, name: actor.name } ],
            range: "Optimal",
            hideActions: false,
            action1: "Do Nothing",
            action2: "Do Nothing",
            action3: "Do Nothing"
        });
        if (actor.data.type === "character") {
            // ensure only one character can be added at once.
            // reusing npcs is probably fine.
            this.data.data.memberIds.push(id);
        }
        this.persistState(this.data.data);
        this.syncData(this.data.data);
        this.render();
    }

    private _addNewMember(target: HTMLSelectElement): void {
        const id = target.value;
        const index = parseInt(target.dataset.index || "0");
        const team = this.data.data.teams[index];
        const actor = this.data.actors.find(a => a.id === id) as BWActor;
        
        team.members.push({ id: actor.id, name: actor.name});
        if (actor.data.type === "character") {
            this.data.data.memberIds.push(id);
        }

        this.persistState(this.data.data);
        this.syncData(this.data.data);
        this.render();
    }

    private _deleteMember(target: HTMLElement): void {
        const teamIndex = parseInt(target.dataset.index || "0");
        const memberIndex = parseInt(target.dataset.memberIndex || "0");
        const team = this.data.data.teams[teamIndex];
        const deleted = team.members.splice(memberIndex, 1);
        if (team.members.length === 0) {
            this.data.data.teams.splice(teamIndex, 1);
        }
        if (this.data.actors.find(a => a.id === deleted[0].id)?.data.type === "character") {
            this.data.data.memberIds.splice(this.data.data.memberIds.indexOf(deleted[0].id), 1);
        }
        this.persistState(this.data.data);
        this.syncData(this.data.data);
        this.render();
    }

    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {
            width: 1000,
            height: 600,
            resizable: true,
            classes: [ "fight" ]
        }, { overwrite: true });
    }

    static addSidebarControl(html: JQuery): void {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = "Range and Cover";
        buttonElement.className = "rnc-sidebar-button";
        buttonElement.onclick = () => game.burningwheel.rangeAndCover.render(true);
        const combatHeader = $(html).find("header");
        combatHeader.prepend(buttonElement);
    }

    getData(): RangeAndCoverData {
        const data = super.getData() as RangeAndCoverData;
        data.actionOptions = options;
        if (!this.data.actors) {
            this.data.actors = game.actors.entities as BWActor[];
        }
        data.actors = this.data.actors.filter(a => !this.data.data.memberIds.includes(a.id));
        data.gmView = game.user.isGM;

        data.teams.forEach(t => {
            const actorData = t.members.map(m => m.id).map(id => this.data.actors.find(a => a.id === id) as BWActor);
            t.editable = (data.gmView && !t.hideActions) || (!data.gmView && actorData.some(a => a.owner));

            t.showAction1 = data.showV1 || t.editable;
            t.showAction2 = data.showV2 || t.editable;
            t.showAction3 = data.showV3 || t.editable;
        });
        return data;
    }
}

interface RangeAndCoverDialogData extends ExtendedTestData<RangeAndCoverData> {
    actors: BWActor[];
}

interface RangeAndCoverData {
    actors: BWActor[];
    actionOptions: { [k:string]: string[] };
    teams: RnCTeam[];
    gmView: boolean;
    memberIds: string[];

    showV1: boolean;
    showV2: boolean;
    showV3: boolean;
}

interface RnCTeam {
    range: "Optimal" | "Extreme" | "Out of Range";
    members: { name: string, id: string }[];
    hideActions: boolean;
    editable?: boolean;
    showAction1?: boolean;
    showAction2?: boolean;
    showAction3?: boolean;
    action1: string;
    action2: string;
    action3: string;
}

const options = {
    "Move In": [
        "Close", "Sneak In", "Flank", "Charge"
    ],
    "Hold Ground": [
        "Maintain Distance", "Hold Position"
    ],
    "Move Out": [
        "Withdraw", "Sneak Out", "Fall Back", "Retreat"
    ],
    "Hesitation Actions": [
        "Fall Prone", "Run Screaming", "Stand & Drool", "Swoon"
    ]
};