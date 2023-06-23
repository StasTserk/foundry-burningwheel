
import { Npc, NpcData, } from "../actors/Npc";
import { BWActor } from "../actors/BWActor";
import { notifyError, StringIndexedObject } from "../helpers";
import { changesState, ExtendedTestData, ExtendedTestDialog } from "./ExtendedTestDialog";
import { handleFightRoll } from "../rolls/fightRoll";
import { BWCharacter, BWCharacterData } from "../actors/BWCharacter";

import * as constants from "../constants";
import { getKeypressModifierPreset } from "../rolls/rolls";
import { MeleeWeapon } from "../items/meleeWeapon";

export type FightAttr = "speed" | "agility" | "power" | "skill" | "steel";
export class FightDialog extends ExtendedTestDialog<FightDialogData> {
    constructor(d: Dialog.Data, o?: Dialog.Options) {
        super(d, o);
        this.data.data.participants = this.data.data.participants || [];
        this.data.data.participantIds = this.data.data.participantIds || [];
        this.data.actionOptions = game.burningwheel.fightActions;
        this.data.actors = [];
        this.data.topic = "Fight";
        this.data.settingName = "fight-data";
    }

    getData(): FightDialogData {
        const data = super.getData() as FightDialogData;

        if (!this.data.actors.length) {
            this.data.actors = (game.actors?.filter((i: BWActor) => this.data.data.participantIds.includes(i.id)) || []) as BWActor[];
            this.data.actors.sort((a, b) => {
                return this.data.data.participantIds.indexOf(a.id) > this.data.data.participantIds.indexOf(b.id) ? 1 : -1;
            });
        }

        const actors = game.actors?.contents || [];
        data.gmView = game.user?.isGM || false;
        data.participantOptions = actors
            .filter(a => !this.data.data.participantIds.includes(a.id))
            .map(a => {
            return { id: a.id, name: a.name };
        });

        data.participants.forEach(p => {
            const actor = this.data.actors.find(a => a.id === p.id) as BWActor;
            if (!actor) { return; }
            p.weapons = actor.fightWeapons.map(w => {
                if (w.type === "melee weapon") {
                    const mw = w as MeleeWeapon;
                    return Object.values(mw.system.attacks).map((atk, index) => { 
                        return {
                            id: `${(mw).id}_${index}`,
                            label: `${mw.name} ${atk.attackName}`
                        };
                    });
                }
                return [{
                    id: (w).id,
                    label: w.name
                }];
            }).flat(1);

            p.showAction2 = !!p.action1;
            p.showAction3 = !!p.action2;

            p.showAction5 = !!p.action4;
            p.showAction6 = !!p.action5;

            p.showAction8 = !!p.action7;
            p.showAction9 = !!p.action8;

            p.showActions = (data.gmView && !p.gmHidden) || (!data.gmView && this.data.actors.find(a => a.id === p.id)?.isOwner);
            p.chosenWeaponLabel = p.weapons.find(x => x.id === p.weaponId)?.label ?? "";
        });
        data.actionOptions = this.data.actionOptions;
        return data;
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);

        html.find('button[data-action="clearAll"]').on('click', e => {
            e.preventDefault();
            this.data.data.participants = [];
            this.data.data.participantIds = [];
            this.data.data.showV1 = this.data.data.showV2 = this.data.data.showV3 = false;
            this.data.actors = [];
            this.syncData(this.data);
            this.persistState(this.data);
            this._syncActors();
            this.render();
        });

        html.find('button[data-action="resetRound"]').on('click', e => {
            e.preventDefault();
            this.data.data.participants.forEach(p => {
                p.action1 = p.action2 = p.action3 = p.action4 = p.action5
                = p.action6 = p.action7 = p.action8 = p.action9 = "";
            });
            this.data.data.showV1 = this.data.data.showV2 = this.data.data.showV3 = false;
            this.syncData(this.data);
            this.persistState(this.data);
            this.render();
        });

        html.find('input[name="showV1"], input[name="showV2"], input[name="showV3"]').on('change', (e: JQuery.ChangeEvent) => this.propagateChange(e));
        html.find('select[name="newParticipant"]').on('change', (e: JQuery.ChangeEvent) => this._addNewParticipant(e.target));
        html.find('*[data-action="removeFighter"]').on('click', (e: JQuery.ClickEvent) => {
            e.preventDefault();
            this._removeParticipant(e.target);
        });
        html.find('*[data-action="toggleHidden"').on('click', (e: JQuery.ClickEvent) => {
            e.preventDefault();
            this._toggleHidden(e.target);
        });
        html.find('.fighters-grid input, .fighters-grid select').on('change', (e: JQuery.ChangeEvent) => this.updateCollection(e, this.data.data.participants));
        ["Speed", "Power", "Agility", "Skill", "Steel"].forEach((attr: string) => {
            html.find(`button[data-action="roll${attr}"]`)
                .on('click', (e: JQuery.ClickEvent) => { this._handleRoll(e, attr.toLowerCase() as FightAttr); });
        });
        html.find('div[data-action="openSheet"], img[data-action="openSheet"]').on('click', (e: JQuery.ClickEvent) => {
            const id = e.currentTarget.attributes.getNamedItem("data-actor-id").nodeValue || "";
            game.actors?.find(a => a.id === id)?.sheet?.render(true);
        });
    }
    
    private _handleRoll(e: JQuery.ClickEvent, type: FightAttr) {
        e.preventDefault();
        const dataPreset = getKeypressModifierPreset(e);
        const index = parseInt(e.target.dataset.index || "0");
        const actor = this.data.actors[index];
        const engagementBonus = parseInt(this.data.data.participants[index].engagementBonus.toString());
        const positionPenalty = parseInt(this.data.data.participants[index].positionPenalty.toString());
        if (type === "skill") {
            let itemIdString = this.data.data.participants[index].weaponId;
            if (!itemIdString) {
                return notifyError("No weapon selected", "A weapon (or bare fists) must be selected to determine which skill to use for the roll.");
            }
            let attackIndex: number | undefined;
            if (itemIdString.indexOf('_') !== -1) {
                attackIndex = parseInt(itemIdString.substr(itemIdString.indexOf('_')+1));
                itemIdString = itemIdString.substr(0, itemIdString.indexOf('_'));
            }
            return handleFightRoll({ actor, type, itemId: itemIdString, attackIndex, engagementBonus, positionPenalty, dataPreset });
        }
        return handleFightRoll({ actor, type, engagementBonus, positionPenalty, dataPreset });
    }
    
    @changesState()
    private _toggleHidden(target: HTMLDivElement): void {
        if (!game.user?.isGM) { return; }
        const index = parseInt(target.dataset.index || "0") ;
        const hidden = this.data.data.participants[index].gmHidden;
        this.data.data.participants[index].gmHidden = !hidden;
    }

    @changesState(FightDialog.prototype._syncActors)
    private _addNewParticipant(target: HTMLSelectElement): void {
        const id = target.value;
        const actor = game.actors?.get(id) as BWCharacter | Npc;
        this.data.actors.push(actor);
        this.data.data.participants.push({ ...toParticipantData(actor),
            action1: '', action2: '', action3: '', action4: '', action5: '',
            action6: '', action7: '', action8: '', action9: '', gmHidden: false,
            engagementBonus: 0, positionPenalty: 0
        } as ParticipantEntry);
        this.data.data.participantIds.push(id);
    }

    @changesState(FightDialog.prototype._syncActors)
    private _removeParticipant(target: HTMLElement): void {
        const index = parseInt(target.dataset.index || "0");
        this.data.data.participantIds.splice(index, 1);
        this.data.data.participants.splice(index, 1);
        this.data.actors.splice(index, 1);
    }

    activateSocketListeners(): void {
        super.activateSocketListeners();
        game.socket.on(constants.socketName, ({type}) => {
            if (type === `syncActors${this.data.topic}`) {
                this.data.actors = (game.actors?.filter((i: BWActor) => this.data.data.participantIds.includes(i.id)) || []) as BWActor[];
                this.data.actors.sort((a, b) => {
                    return this.data.data.participantIds.indexOf(a.id) > this.data.data.participantIds.indexOf(b.id) ? 1 : -1;
                });
                this.render();
            }
        });
        Hooks.on("updateActor", (actor: BWCharacter | Npc) => {
            if (this.data.actors.includes(actor)) {
                const index = this.data.actors.indexOf(actor);
                this.data.data.participants[index] = Object.assign(
                    this.data.data.participants[index],
                    toParticipantData(actor)
                );
                this.render();
            }
        });
    }

    private _syncActors() {
        game.socket.emit(constants.socketName, { type: `syncActors${this.data.topic}`});
    }

    data: ExtendedTestData<FightDialogData> & {
        actionOptions: StringIndexedObject<string[]>;
        actors: BWActor[];
    };

    get template(): string {
        return "systems/burningwheel/templates/dialogs/fight.hbs";
    }

    static get defaultOptions(): Dialog.Options {
        return mergeObject(super.defaultOptions, {
            width: 1000,
            height: 600,
            resizable: true,
            classes: [ "fight", "bw-app" ]
        }, { overwrite: true });
    }

    static addSidebarControl(html: JQuery): void {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = "Fight";
        buttonElement.className = "fight-sidebar-button";
        buttonElement.onclick = () => game.burningwheel.fight.render(true);
        const combatHeader = $(html).find("header");
        combatHeader.prepend(buttonElement);
    }
}

function toParticipantData(actor: BWCharacter | Npc): Partial<ParticipantEntry> {
    const reflexesString = `${actor.system.reflexesShade}${
        (actor.type === "character" ?
            (actor.system as unknown as BWCharacterData).reflexesExp :
            (actor.system as unknown as NpcData).reflexes)}`;
    return {
        name: actor.name,
        id: actor.id,
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
    showV1: boolean;
    showV2: boolean;
    showV3: boolean;
}

interface ParticipantEntry {
    showAction3: boolean;
    showAction2: boolean;
    showAction5: boolean;
    showAction6: boolean;
    showAction8: boolean;
    showAction9: boolean;

    id: string;
    name: string;
    reflexes: string;

    gmHidden: boolean;
    showActions?: boolean;
    
    weaponId: string;
    chosenWeaponLabel: string;
    engagementBonus: number;
    positionPenalty: number;

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
