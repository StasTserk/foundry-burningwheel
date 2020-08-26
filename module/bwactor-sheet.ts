import { BWActor } from "./actor";

export class BWActorSheet extends ActorSheet {
    actor: BWActor;

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
    }

    private _updateItemField(e: JQuery.ChangeEvent): void {
        e.preventDefault();
        const t = e.currentTarget as EventTarget;
        let value: string | boolean | undefined | number | string[];

        if ($(t).prop("type") === "checkbox") {
            value = $(t).prop("checked") as boolean;
        } else {
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
}