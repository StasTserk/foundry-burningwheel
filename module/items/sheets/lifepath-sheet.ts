import { BWActor } from '../../actors/BWActor';
import { DragData } from '../../helpers';
import { BWItem } from '../item';
import { Lifepath } from '../lifepath';
import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class LifepathSheet extends BWItemSheet<BWItemSheetData, Lifepath> {
    getData(): BWItemSheetData {
        const data = super.getData();
        return data;
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/lifepath.hbs';
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.on('drop', (e) => this._onDrop(e.originalEvent as DragEvent));
    }

    protected async _onDrop(event: DragEvent): Promise<void> {
        let data: DragData;
        try {
            data = JSON.parse(event.dataTransfer?.getData('text/plain') || '');
        } catch (err) {
            console.error(err);
            return;
        }
        if (data.type === 'Item') {
            let item: BWItem | undefined;
            if (data.uuid) {
                item = (await fromUuid(data.uuid)) as BWItem;
            } else if (data.pack && data.id) {
                item = (await (
                    game.packs?.find(
                        (p) => p.collection === data.pack
                    ) as CompendiumCollection<BWItem>
                ).getDocument(data.id)) as BWItem;
            } else if (data.actorId && data.id) {
                item = (
                    game.actors?.find(
                        (a: BWActor) => a.id === data.actorId
                    ) as BWActor
                ).items.get(data.id) as BWItem;
            } else {
                item = game.items?.find(
                    (i: BWItem) => i.id === data.id
                ) as BWItem;
            }

            if (item) {
                if (item.type === 'skill') {
                    const skillList = `${this.item.system.skillList}${
                        this.item.system.skillList ? ', ' : ''
                    }${item.name}`;
                    this.item.update({ 'data.skillList': skillList }, {});
                } else if (item.type === 'trait') {
                    const traitList = `${this.item.system.traitList}${
                        this.item.system.traitList ? ', ' : ''
                    }${item.name}`;
                    this.item.update({ 'data.traitList': traitList }, {});
                }
            }
        }
    }
}
