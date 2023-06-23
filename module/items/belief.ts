import { simpleBroadcast, SimpleBroadcastMessageData } from '../chat';
import { BWActor } from '../actors/BWActor';
import { ArthaEarner, BWItem } from './item';
import { TypeMissing } from '../../types/index';

export class Belief extends BWItem<BeliefData & TypeMissing> {
    type: 'belief';
    async generateChatMessage(actor: BWActor): Promise<ChatMessage | null> {
        const data: SimpleBroadcastMessageData = {
            title: this.name,
            mainText: this.system.text,
            extraData: [
                {
                    title: `Spent Artha`,
                    text: `Fate: ${this.system.fateSpent || 0}; Persona: ${
                        this.system.personaSpent || 0
                    }; Deeds: ${this.system.deedsSpent || 0}`,
                },
            ],
        };
        return simpleBroadcast(data, actor);
    }
}

interface BeliefData extends ArthaEarner {
    text: string;
}
