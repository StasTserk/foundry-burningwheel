import { Locator, Page } from 'playwright/test';
import { GameFixture } from '../gameFixture';

class ChatWidget {
    constructor(readonly locator: Locator) {}

    get obstacles() {
        return this.locator.getByLabel('obstacles').locator('div');
    }

    get dice() {
        return this.locator.getByLabel('dice').locator('div');
    }

    get results() {
        return this.locator.locator('.roll-die');
    }
}

export class ChatFixture {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture
    ) {}

    async getChatMessage(name: string | RegExp) {
        await this.gamePage.openTab('Chat Messages');
        return new ChatWidget(
            this.page.locator('#chat-log > li.chat-message').filter({
                has: this.page.locator('.message-title', { hasText: name }),
            })
        );
    }
}
