/**
 * Chat message helpers
 */

import { handleTraitorReroll } from './rolls/rerollTraitors';
import { handleFateReroll } from './rolls/rerollFate';
import { BWActor } from './actors/BWActor';

/**
 * Binds buttons in chat log to perform actions
 * @param html rendered html of the chat long
 */
export function onChatLogRender(html: JQuery): void {
    html.on('click', 'button.chat-fate-button', (e) =>
        handleFateReroll(e.target)
    );
    html.on('click', 'button.chat-deeds-button', (e) =>
        handleTraitorReroll(e.target, true)
    );
    html.on('click', 'button.chat-callon-button', (e) =>
        handleTraitorReroll(e.target)
    );
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function hideChatButtonsIfNotOwner(
    _message: unknown,
    html: JQuery,
    data: any
): void {
    const message = html.find('div.chat-message');
    if (message.length > 0) {
        const actor = game.actors?.get(data.message.speaker.actor);
        if (actor && actor.isOwner) {
            return; // we are the owner of the message and shouldn't hide the buttons
        }
        message.find('div.reroll-buttons').each((i, b) => {
            b.style.display = 'none';
        });
    }
}

export async function simpleBroadcast(
    data: SimpleBroadcastMessageData,
    actor?: BWActor
): Promise<ChatMessage | null> {
    const html = await renderTemplate(
        'systems/burningwheel/templates/chat/simple-broadcast.hbs',
        data
    );
    return ChatMessage.create({
        content: html,
        speaker: ChatMessage.getSpeaker({ actor }),
    });
}
export interface SimpleBroadcastMessageData {
    title: string;
    mainText: string;
    extraData?: { title?: string; text?: string }[];
}
