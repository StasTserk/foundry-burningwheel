import { BWActor } from "../BWActor.js";
import { ArmorRootData } from "../../items/armor.js";
import * as constants from "../../constants.js";
import * as helpers from "../../helpers.js";
import { BWItem } from "../../items/item.js";
import { NpcData } from "../Npc.js";
import { BWCharacterData } from "../BWCharacter.js";

export class BWActorSheet<T extends BaseActorSheetData, A extends BWActor, O extends ActorSheetOptions> extends ActorSheet<T, A, O> {
    private _keyDownHandler = this._handleKeyPress.bind(this);
    private _keyUpHandler = this._handleKeyUp.bind(this);

    get template(): string {
        const path = "systems/burningwheel/templates";
        return `${path}/${this.actor.data.type}-sheet.hbs`;
    }

    static get defaultOptions(): ActorSheetOptions {
        return mergeObject(super.defaultOptions, {
            classes:  [ "bw-app" ]
        });
    }

    getData(_options?: Application.RenderOptions): T {
        super.getData();
        return {
            actor: this.actor,
            data: this.actor.data.data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find("input[data-item-id], select[data-item-id], textarea[data-item-id]")
            .on("change", (e) => this._updateItemField(e));
        $(document).off("keydown", this._keyDownHandler).on("keydown", this._keyDownHandler);
        $(document).off("keyup", this._keyUpHandler).on("keyup", this._keyUpHandler);

        if (this.options.draggableItemSelectors) {
            html.find(this.options.draggableItemSelectors.join('[draggable="true"], ')).on('dragstart', (e) => {
                const actor = this.actor;
                const item = actor.getOwnedItem(e.target.dataset.id || "") as BWItem;
                const dragData: helpers.ItemDragData = {
                    actorId: actor.id,
                    id: item.id,
                    type: "Item",
                    data: item.data,
                    pack: actor.compendium ? actor.compendium.collection : undefined
                };

                if (e.originalEvent?.dataTransfer) {
                    e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                }
            });
        }
        if (this.options.draggableMeleeSelectors) {
            html.find(this.options.draggableMeleeSelectors.join('[draggable="true"], ')).on('dragstart', (e) => {
                const actor = this.actor;
                const itemId = e.target.dataset.weaponId || "";
                const weapon = actor.getOwnedItem(itemId) as Item;

                const dragData: helpers.MeleeDragData = {
                    actorId: actor.id,
                    id: itemId,
                    type: "Melee",
                    data: {
                        index: parseInt(e.target.dataset.attackIndex || "0"),
                        name: weapon.name,
                        img: weapon.img
                    }
                };

                if (e.originalEvent?.dataTransfer) {
                    e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                }
            });
        }
        if (this.options.draggableRangedSelectors) {
            html.find(this.options.draggableRangedSelectors.join('[draggable="true"], ')).on('dragstart', (e) => {
                const actor = this.actor;
                const itemId = e.target.dataset.weaponId || "";
                const weapon = actor.getOwnedItem(itemId) as Item;

                const dragData: helpers.RangedDragData = {
                    actorId: actor.id,
                    id: itemId,
                    type: "Ranged",
                    data: {
                        name: weapon.name,
                        img: weapon.img
                    }
                };

                if (e.originalEvent?.dataTransfer) {
                    e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                }
            });
        }
        if (this.options.draggableStatSelectors) {
            html.find(this.options.draggableStatSelectors.join('[draggable="true"], ')).on('dragstart', (e) => {
                const actor = this.actor;
                const statPath = e.target.dataset.accessor || "";
                const statName = e.target.dataset.statName || "";
                const dragData: helpers.StatDragData = {
                    actorId: actor.id,
                    type: "Stat",
                    data: {
                        name: statName,
                        path: statPath
                    }
                };

                if (e.originalEvent?.dataTransfer) {
                    e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                }
            });
        }
    }

    async close(): Promise<void> {
        $(document).off("keydown", this._keyDownHandler);
        $(document).off("keyup", this._keyUpHandler);
        return super.close();
    }

    private _handleKeyPress(e: JQuery.KeyDownEvent): void {
        if (e.ctrlKey || e.metaKey) {
            $("form.character, form.npc").addClass("ctrl-modified");
        } else if (e.altKey) {
            $("form.character").addClass("alt-modified");
        } else if (e.shiftKey) {
            $("form.character, form.npc").addClass("shift-modified");
        }
    }

    private _handleKeyUp(e: JQuery.KeyUpEvent): void {
        if (e.key === "Control" || e.key === "Meta") {
            $("form.character, form.npc").removeClass("ctrl-modified");
        }
        else if (e.key === "Alt") {
            $("form.character").removeClass("alt-modified");
        } else if (e.key === "Shift") {
            $("form.character, form.npc").removeClass("shift-modified");
        }
    }

    private _updateItemField(e: JQuery.ChangeEvent): void {
        e.preventDefault();
        const t = e.currentTarget as EventTarget;
        let value: string | boolean | undefined | number | string[];

        switch ($(t).prop("type")) {
            case "checkbox":
                value = $(t).prop("checked") as boolean;
                break;
            case "number": case "radio":
                value = parseInt($(t).val() as string);
                break;
            default:
                value = $(t).val();
        }

        const id = $(t).data("item-id");
        const binding = $(t).data("binding");

        const item = this.actor.getOwnedItem(id);
        const updateParams = {};

        updateParams[binding] = value;
        if (item) { item.update(updateParams, {}); }
    }

    getArmorDictionary(armorItems: Item.Data[]): { [key: string]: Item.Data | null; } {
        let armorLocs: { [key: string]: ArmorRootData | null; } = {};
        constants.armorLocations.forEach(al => armorLocs[al] = null); // initialize locations
        armorItems.forEach(i =>
            armorLocs = { ...armorLocs, ...helpers.getArmorLocationDataFromItem(i as ArmorRootData)}
        );
        return armorLocs;
    }
}

export interface ActorSheetOptions extends BaseEntitySheet.Options {
    draggableItemSelectors?: string[];
    draggableMeleeSelectors?: string[];
    draggableRangedSelectors?: string[];
    draggableStatSelectors?: string[];
}

export interface BaseActorSheetData<T extends NpcData | BWCharacterData = BWCharacterData> {
    actor: BWActor;
    data: T;
}