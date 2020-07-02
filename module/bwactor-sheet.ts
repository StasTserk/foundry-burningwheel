export class BWActorSheet extends ActorSheet {
    get template() {
        const path = "systems/burningwheel/templates";
        return `${path}/${this.actor.data.type}-sheet.html`;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }

    activateListeners(html: JQuery) {
        super.activateListeners(html);
        html.find("input[data-item-id], select[data-item-id]").change((e) => this._updateItemField(e));
        html.find("textarea[data-item-id], select[data-item-id]").change((e) => this._updateItemField(e));
    }

    private _updateItemField(e: JQuery.ChangeEvent): void {
        e.preventDefault();
        const t = event.currentTarget;
        let value: any;

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
        item.update(updateParams, {});
    }

    _getFormData(form: HTMLFormElement) {
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