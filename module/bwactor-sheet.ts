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
        html.find("input[data-item-id]").change((e) => this._updateItemField(e));
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
}