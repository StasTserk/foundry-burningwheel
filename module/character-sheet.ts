import { Ability } from "./actor.js";
import { BWActorSheet } from "./bwactor-sheet.js";
import { Belief } from "./items/belief.js";
import { Instinct } from "./items/instinct.js";
import { Skill } from "./items/skill.js";
import { Trait } from "./items/trait.js";

export class BWCharacterSheet extends BWActorSheet {
    getData(): ActorSheetData {
        const data = super.getData() as CharacterSheetData;
        const beliefs = [];
        const instincts = [];
        const traits: Trait[] = [];
        const items = data.items;
        const skills = [];

        for (const i of items) {
            switch(i.type) {
                case "belief": beliefs.push(i as Belief); break;
                case "instinct": instincts.push(i as Instinct); break;
                case "trait": traits.push(i as Trait); break;
                case "skill": skills.push(i); break;
            }
        }

        if (beliefs.length === 0 && instincts.length === 0) {
            console.log("adding default beliefs");
            this.addDefaultItems();
        }

        data.beliefs = beliefs;
        data.instincts = instincts;
        data.skills = skills;

        const traitLists = { character: [], die: [], callon: [] } as CharacterSheetTraits;

        if (traits.length !== 0) {
            traits.forEach((trait) => {
                switch (trait.data.traittype) {
                    case "character": traitLists.character.push(trait); break;
                    case "die": traitLists.die.push(trait); break;
                    default: traitLists.callon.push(trait); break;
                }
            });
        }
        data.traits = traitLists;
        return data;
    }

    activateListeners(html: JQuery) {
        // add/delete buttons
        html.find(".trait-category i").click(e => this._manageTraits(e));
        // roll macros
        html.find("button.rollable").click(e => this._handleRollable(e));
        super.activateListeners(html);
    }

    private async _handleRollable(e: JQuery.ClickEvent<HTMLElement, null, HTMLElement, HTMLElement>): Promise<unknown> {
        const target = e.currentTarget as HTMLButtonElement;
        let skill: Ability;
        if (target.dataset.accessor) {
            skill = getProperty(this.actor.data, target.dataset.accessor);
        } else {
            skill = (this.actor.getOwnedItem(target.dataset.skillId) as Skill).data.data;
        }
        const template = "systems/burningwheel/templates/chat/roll-dialog.html";
        const templateData = {
            name: target.dataset.rollableName,
            difficulty: 3,
            bonusDice: 0,
            arthaDice: 0,
            skill
        };
        const html = await renderTemplate(template, templateData);
        const speaker = ChatMessage.getSpeaker({actor: this.actor})
        return new Promise(resolve =>
            new Dialog({
                title: "Roll Test",
                content: html,
                buttons: {
                    roll: {
                        label: "Roll",
                        callback: async (dialogHtml: JQuery<HTMLElement>) => {
                            const diff = parseInt(dialogHtml.find("input[name=\"difficulty\"]").val() as string, 10);
                            const bDice = parseInt(dialogHtml.find("input[name=\"bonusDice\"]").val() as string, 10);
                            const aDice = parseInt(dialogHtml.find("input[name=\"arthaDice\"]").val() as string, 10);
                            const exp = parseInt("" + skill.exp, 10);
                            const mTemplate = "systems/burningwheel/templates/chat/roll-message.html";
                            const roll = new Roll(`${exp+bDice+aDice}d6cs>3`).roll();
                            const data = {
                                successes: roll.result,
                                difficulty: diff,
                                success: parseInt(roll.result, 10) >= diff,
                                rolls: roll.dice[0].rolls,
                                difficultyGroup: difficultyGroup(exp + bDice, diff)
                            }

                            const messageHtml = await renderTemplate(mTemplate, data)
                            ChatMessage.create({
                                content: messageHtml,
                                speaker
                            });
                        }
                    }
                }
            }).render(true)
        );
    }

    private async _manageTraits(e:  JQuery.ClickEvent) {
        e.preventDefault();
        const t = event.currentTarget;
        const action = $(t).data("action");
        const id = $(t).data("id") as string;
        let options = {};
        switch (action) {
            case "addTrait":
                options = { name: `New ${id.titleCase()} Trait`, type: "trait", data: { traittype: id }};
                return this.actor.createOwnedItem(options)
            case "delTrait":
                return this.actor.deleteOwnedItem(id);

        }
        return null;
    }

    async addDefaultItems() {
        return this.actor.createOwnedItem({ name: "Instinct 1", type: "instinct", data: {}})
            .then(() => this.actor.createOwnedItem({ name: "Instinct 2", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Instinct 3", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 1", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 2", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 3", type: "belief", data: {}}))
    }
}

function difficultyGroup(dice: number, difficulty: number): string {
    if (difficulty > dice) {
        return "Challenging";
    }
    if (dice === 1) {
        return "Routine/Difficult";
    }
    if (dice === 2) {
        return difficulty === 2 ? "Difficult" : "Routine";
    }

    let spread = 1;
    if (dice > 6) {
        spread = 3;
    } else if (dice > 3) {
        spread = 2;
    }

     return (dice - spread >= difficulty) ? "Routine" : "Difficult";
}

interface CharacterSheetData extends ActorSheetData {
    beliefs: Belief[];
    instincts: Instinct[];
    skills: Skill[];
    traits: CharacterSheetTraits;
}

interface CharacterSheetTraits {
    character: Trait[];
    die: Trait[];
    callon: Trait[];
}