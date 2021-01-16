import { simpleBroadcast, SimpleBroadcastMessageData } from '../chat.js';
import { BWActor } from '../actors/BWActor.js';
import { ArthaEarner, BWItem, BWItemData } from './item.js';

export class Instinct extends BWItem {
    data: BWItemData & { data: InstinctData };

    async generateChatMessage(actor: BWActor): Promise<Entity> {
        const data: SimpleBroadcastMessageData = {
            title: this.name,
            mainText: this.data.data.text,
            extraData: [
                {
                    title: `Spent Artha`,
                    text: `Fate: ${this.data.data.fateSpent || 0}; Persona: ${
                        this.data.data.personaSpent || 0
                    }; Deeds: ${this.data.data.deedsSpent || 0}`,
                },
            ],
        };
        return simpleBroadcast(data, actor);
    }
}

interface InstinctData extends ArthaEarner {
    fate: boolean;
    persona: boolean;
    deeds: boolean;
    text: string;
}
