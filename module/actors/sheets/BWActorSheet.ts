import { BWActor } from "../BWActor.js";
import { ArmorRootData } from "../../items/armor.js";
import * as constants from "../../constants.js";
import * as helpers from "../../helpers.js";
import { BWItem } from "../../items/item.js";

export class BWActorSheet extends ActorSheet {
    private _keyDownHandler = this._handleKeyPress.bind(this);
    private _keyUpHandler = this._handleKeyUp.bind(this);
    get actor(): BWActor {
        return super.actor as BWActor;
    }

    get template(): string {
        const path = "systems/burningwheel/templates";
        return `${path}/${this.actor.data.type}-sheet.hbs`;
    }

    options: ActorSheetOptions;

    static get defaultOptions(): ActorSheetOptions {
        return mergeObject(super.defaultOptions, {});
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
                    data: item.data
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

    _getFormData(form: HTMLFormElement): FormData {
        // fixes an issue with radio buttons all storing their values at the same
        // time inside an array for a given set of radio button options.
        // TODO check if this is needed after version 0.7
        const fd = super._getFormData(form);
        const dataValues = {};

        for( const element of Object.values(form.elements)) {
            // if an input is a radio input, we need to make sure to pick the right value for its'
            // related property.
            if (element instanceof HTMLInputElement && element.type === "radio") {
                if (!dataValues[element.name]) {
                    dataValues[element.name] = [];
                }
                // specifically, the value assigned to the currently checked element
                if (element.checked) {
                    dataValues[element.name].push(element.value);
                }
            }
        }

        // update the data model values to match the radio buttons
        for( const k of Object.keys(dataValues)) {
            fd.set(k, JSON.stringify(dataValues[k]));
        }
        return fd;
    }

    getArmorDictionary(armorItems: ItemData[]): { [key: string]: ItemData | null; } {
        let armorLocs: { [key: string]: ArmorRootData | null; } = {};
        constants.armorLocations.forEach(al => armorLocs[al] = null); // initialize locations
        armorItems.forEach(i =>
            armorLocs = { ...armorLocs, ...helpers.getArmorLocationDataFromItem(i as ArmorRootData)}
        );
        return armorLocs;
    }
}

export interface ActorSheetOptions extends FormApplicationOptions {
    draggableItemSelectors?: string[];
    draggableMeleeSelectors?: string[];
    draggableRangedSelectors?: string[];
    draggableStatSelectors?: string[];
}