import { BWActor } from "../bwactor.js";
import { ArmorRootData } from "../../items/armor.js";
import * as constants from "../../constants.js";
import * as helpers from "../../helpers.js";

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

    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {});
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find("input[data-item-id], select[data-item-id], textarea[data-item-id]")
            .on("change", (e) => this._updateItemField(e));
        $(document).off("keydown", this._keyDownHandler).on("keydown", this._keyDownHandler);
        $(document).off("keyup", this._keyUpHandler).on("keyup", this._keyUpHandler);
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