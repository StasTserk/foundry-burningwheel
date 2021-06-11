import { simpleBroadcast, SimpleBroadcastMessageData } from "../chat.js";
import { BWActor } from "../actors/BWActor.js";
import { ArthaEarner, BWItem, BWItemData } from "./item.js";

export class Belief extends BWItem<BWItemData<BeliefData>> {

    async generateChatMessage(actor: BWActor): Promise<ChatMessage | null> {
        const data: SimpleBroadcastMessageData = {
            title: this.name,
            mainText: this.data.data.text,
            extraData: [
                {
                    title: `Spent Artha`,
                    text: `Fate: ${this.data.data.fateSpent || 0}; Persona: ${this.data.data.personaSpent || 0}; Deeds: ${this.data.data.deedsSpent || 0}`
                }
            ]
        };
        return simpleBroadcast(data, actor);
    }
}

interface BeliefData extends ArthaEarner {
    text: string;
}