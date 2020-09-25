import { BWItemData } from "../items/item.js";
import { NpcDataRoot } from "../npc.js";
import { BWActor, CharacterDataRoot } from "../bwactor.js";
import { StringIndexedObject } from "../helpers.js";

export class FightDialog extends Dialog {
    constructor(d: DialogData, o?: ApplicationOptions) {
        super(d, o);
        this.data.data.participants = this.data.data.participants || [];
        this.data.data.participantIds = this.data.data.participantIds || [];
        this.data.actors = []; // replace this with actor lookups later -- this.data.data.participantIds
        this.data.actionOptions = options;
    }

    getData(): unknown {
        const data = Object.assign(super.getData(), this.data.data ) as FightDialogData;
        const actors = game.actors.entities;
        data.gmView = game.user.isGM;
        data.participantOptions = actors
            .filter(_a => true)
            .map(a => {
            return { id: a._id, name: a.name };
        });

        data.participants.forEach(p => {
            const actor = this.data.actors.find(a => a.id === p.id) as BWActor;
            p.weapons = actor.data.fightWeapons.map(s => {
                return { id: (s as BWItemData & { id:string }).id, label: s.name };
            });
        });
        data.actionOptions = this.data.actionOptions;
        return data;
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.on('submit', (e) => { e.preventDefault(); });
        html.find('select[name="newParticipant"]').on('change', (e: JQuery.ChangeEvent) => this._addNewParticipant(e.target));
        html.find('div[data-action="toggleHidden"').on('click', (e: JQuery.ClickEvent) => this._toggleHidden(e.target));
    }
    private _toggleHidden(target: HTMLDivElement): void {
        const index = parseInt(target.dataset.index || "0") ;
        const hidden = this.data.data.participants[index].showActions;
        this.data.data.participants[index].showActions = !hidden;
        this.render(true);
    }
    private _addNewParticipant(target: HTMLSelectElement): void {
        const id = target.value;
        const actor = game.actors.get(id) as BWActor;
        this.data.actors.push(actor);
        this.data.data.participants.push({ ...toParticipantData(actor),
            action1: '', action2: '', action3: '', action4: '', action5: '',
            action6: '', action7: '', action8: '', action9: '', showActions: true
        } as ParticipantEntry);
        this.render();
    }

    data: {
        data: FightDialogData;
        actionOptions: StringIndexedObject<string[]>;
        actors: BWActor[];
    };

    get template(): string {
        return "systems/burningwheel/templates/dialogs/fight.hbs";
    }

    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {
            width: 1000,
            height: 600,
            resizable: true,
            classes: [ "fight" ]
        }, { overwrite: true });
    }

    _getHeaderButtons(): { label: string, icon: string, class: string, onclick: (e: JQuery.ClickEvent) => void; }[] {
        let buttons = super._getHeaderButtons();
        if (game.user.isGM) {
            buttons = [{
                label: "Show",
                icon: "fas fa-eye",
                class: "force-show-fight",
                onclick: (_) => {
                    game.socket.emit("system.burningwheel", { type: "showFight" });
                }
            }].concat(buttons);
        }
        return buttons;
    }

    static addSidebarControl(html: JQuery): void {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = "Fight";
        buttonElement.className = "fight-sidebar-button";
        buttonElement.onclick = () => game.burningwheel.fight.render(true);
        const combatHeader = $(html).find("header");
        combatHeader.prepend(buttonElement);
    }

    // private _propagateChange(e: JQuery.ChangeEvent): void {
    //     const newValue = e.target.type ==="checkbox" ? e.target.checked : e.target.value;
    //     const dataPath = e.target.name;
        
    //     const data = {};
    //     data[dataPath] = newValue;

    //     mergeObject(this.data.data, data);
    //     if (game.user.isGM) {
    //         game.settings.set("burningwheel", "fight-data", JSON.stringify(this.data.data));
    //     }
    //     game.socket.emit("system.burningwheel", { type: "updateFight", data });
    //     this.render(true);
    //     e.target.focus();
    // }

    activateSocketListeners(): void {
        game.socket.on("system.burningwheel", ({type, data}) => {
            if (type === "updateFight") {
                mergeObject(this.data.data, data);
                if (game.user.isGM) {
                    game.settings.set("burningwheel", "fight-data", JSON.stringify(this.data.data));
                }
                if (this.rendered) { this.render(true); }
            } else if (type === "showFight") {
                this.render(true);
            }
        });
    }
}

function toParticipantData(actor: BWActor): Partial<ParticipantEntry> {
    const reflexesString = `${actor.data.data.reflexesShade}${
        (actor.data.type === "character" ?
        (actor.data as CharacterDataRoot).data.reflexesExp :
        (actor.data as NpcDataRoot).data.reflexes)}`;
    return {
        name: actor.name,
        id: actor._id,
        imgSrc: actor.img,
        reflexes: reflexesString,
    };
}

export interface FightDialogData {
    actionOptions: StringIndexedObject<string[]>;
    participantOptions: { id: string, name: string }[];
    participantIds: string[];
    gmView: boolean;
    participants: ParticipantEntry[];
}

interface ParticipantEntry {
    id: string;
    name: string;
    reflexes: string;
    showActions: boolean;
    imgSrc: string;
    action1: string;
    action2: string;
    action3: string;
    action4: string;
    action5: string;
    action6: string;
    action7: string;
    action8: string;
    action9: string;
    weapons?: { id: string, label: string }[];
}

const options = {
    "Attack Actions": [
        "Strike", "Great Strike", "Block and Strike", "Lock and Strike"
    ],
    "Defense Actions": [
        "Avoid", "Block", "Counterstrike"
    ],
    "Basic Actions": [
        "Assess", "Change Stance", "Charge/Tackle", "Draw Weapon", "Physical Action", "Push", "Lock", "Get Up", "Disarm", "Feint", "Throw Person"
    ],
    "Shooting Actions": [
        "Throw Object/Weapon", "Aim", "Nock and Draw", "Reload", "Fire", "Release Bow", "Snapshot"
    ],
    "Magic Actions": [
        "Cast a Spell", "Drop Spell", "Command Spirit"
    ],
    "Social Actions": [
        "Command", "Intimidate"
    ],
    "Hesitation Actions": [
        "Fall Prone", "Run Screaming", "Stand & Drool", "Swoon"
    ]
};