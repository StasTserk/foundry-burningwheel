import { Ability, BWActor } from "../actors/BWActor.js";
import { TestString } from "../helpers.js";
import { Skill } from "../items/skill.js";
import * as constants from "../constants.js";
import { BWCharacter } from "module/actors/BWCharacter.js";

export class DifficultyDialog extends Application {
    difficulty: number;
    editable: boolean;
    splitPool: boolean;
    customDiff: boolean;
    noTrack: boolean;

    mods: {name: string, amount: number }[];

    extendedTest: boolean;
    actorGroups: ActorTestGroup[];

    constructor(defaultDifficulty: number, mods?: {name: string, amount: number}[], extendedData?: { extendedTest?: boolean, actorGroups?: ActorTestGroup[] } ) {
        super({
            template: "systems/burningwheel/templates/dialogs/gm-difficulty.hbs",
            classes: ["gm-difficulty"],
            popOut: false
        });
        this.difficulty = defaultDifficulty;
        this.editable = game.user.isGM;

        this.splitPool = this.customDiff = this.noTrack = false;
        this.mods = mods || [];

        this.extendedTest = extendedData?.extendedTest || false;
        this.actorGroups = extendedData?.actorGroups || [];
    }

    activateListeners(html: JQuery): void {
        html.find("input.difficultyInput").on("input", (e) => {
            const input = e.currentTarget;
            const difficulty = parseInt($(input).val() as string);
            this.difficulty = difficulty;
            game.settings.set(constants.systemName, constants.settings.gmDifficulty, difficulty);
            game.socket.emit(constants.socketName, { type: "difficulty", difficulty });
        });
        
        html.find("#gm-diff-sp").on('change', e => {
            this.splitPool = $(e.target).prop("checked") as boolean;
        });
        html.find("#gm-diff-custom").on('change', e => {
            this.customDiff = $(e.target).prop("checked") as boolean;
        });
        html.find("#gm-diff-track").on('change', e => {
            this.noTrack = $(e.target).prop("checked") as boolean;
        });
        html.find("#gm-ext-test").on('change', e => {
            this.extendedTest = $(e.target).prop("checked") as boolean;
            this.persistExtendedTestData();
            this.render(true);
        });

        html.find('input[name="newMod"]').on('change', e => {
            const target = $(e.target);
            const name = target.val() as string;
            target.val("");
            this.mods.push({ name, amount: 0});
            this.render();
        });

        html.find('input.mod-name').on('change', e => {
            const target = $(e.target);
            const name = target.val() as string;
            const index = parseInt(e.target.dataset.index || "0");
            if (name) {
                this.mods[index].name = name;
            } else {
                this.mods.splice(index, 1);
            }
            this.persistMods();
            this.render();
        });

        html.find('*[data-action="grant"]').on('click', e => { 
            const skillId = e.target.dataset.skillId;
            const path = e.target.dataset.path;
            const actor = game.actors.get(e.target.dataset.actorId || '') as BWCharacter;
            const difficulty = e.target.dataset.difficulty as "R" | "C" | "D";
            const title = e.target.dataset.title || "";
            if (actor) {
                if (skillId) {
                    console.log(`Granting ${difficulty} test to ${actor} with skill ${skillId}`);
                    this.assignDeferredTest({
                        actor,
                        diff: difficulty,
                        skillId,
                        title
                    });
                } else {
                    console.log(`Granting ${difficulty} test to ${actor} to ${path}`);
                    this.assignDeferredTest({
                        actor,
                        diff: difficulty,
                        path,
                        title
                    });
                }
            }
        });

        html.find('input.mod-amount').on('change', e => {
            const target = $(e.target);
            const amount = parseInt(target.val() as string) || 0;
            const index = parseInt(e.target.dataset.index || "0");
            this.mods[index].amount = amount;
            this.persistMods();
            this.render();
        });

        game.socket.on(constants.socketName, ({ type, difficulty }) => {
            if (type === "difficulty") {
                this.difficulty = difficulty;
                this.render(true);
            }
        });
        game.socket.on(constants.socketName, ({type, mods}) => {
            if (type === "obstacleMods") {
                this.mods = mods;
                this.render(true);
            }
        });
        game.socket.on(constants.socketName, ({type, data}: {type: string, data: { extendedTest: boolean, actorGroups: ActorTestGroup[] } }) => {
            if (type === "extendedTest") {
                this.extendedTest = data.extendedTest;
                this.actorGroups = data.actorGroups;
                this.render(true);
            }
        });

        $(document).on("keydown", e => {
            if (e.key === "Control" || e.key === "Meta") {
                this.splitPool = true;
                this.render();
            } else if (e.key === "Alt") {
                this.noTrack = true;
                this.render(true);
            } else if (e.key === "Shift") {
                this.customDiff = true;
                this.render(true);
            }
        });

        $(document).on("keyup", e => {
            if (e.key === "Control" || e.key === "Meta") {
                this.splitPool = false;
                this.render();
            } else if (e.key === "Alt") {
                this.noTrack = false;
                this.render(true);
            } else if (e.key === "Shift") {
                this.customDiff = false;
                this.render(true);
            }
        });
    }
    
    persistMods(): void {
        game.settings.set(constants.systemName, constants.settings.obstacleList, JSON.stringify(this.mods));
        game.socket.emit(constants.socketName, { type: "obstacleMods", mods: this.mods });
    }

    persistExtendedTestData(): void {
        const data = { extendedTest: this.extendedTest, actorGroups: this.actorGroups };
        game.settings.set(constants.systemName, constants.settings.extendedTestData, JSON.stringify(data));
        game.socket.emit(constants.socketName, { type: "extendedTest", data });
    }

    addDeferredTest({actor, path, name, skill, difficulty}: AddDeferredTestOptions): void {
        console.log(`Adding entry for ${actor.name} and ${path || skill?.name} at ${difficulty}`);
        const existingGroup = this.actorGroups.find(ag => ag.id === actor.id);
        const entries: ActorTestRecord[] = [];
        switch(difficulty) {
            case "Routine":
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "R" });
                break;
            case "Difficult":
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "D" });
                break;
            case "Challenging":
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "C" });
                break;
            case "Routine/Difficult":
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "R" });
                entries.push({ title: name.titleCase(), path, skillId: skill?.id, difficulty: "D" });
                break;
        }
        if (!existingGroup) {
            // there's no entry for this actor yet
            this.actorGroups.push( {
                name: actor.name,
                id: actor.id,
                advancements: entries
            });
            this.persistExtendedTestData();
            this.render();
        } else {
            // merge entries without duplication
            existingGroup.advancements = existingGroup.advancements.concat(entries.filter(e => !existingGroup.advancements.find(a => a.title === e.title && a.difficulty === e.difficulty)));
            existingGroup.advancements.sort((a, b) => {
                return a.title.localeCompare(b.title) === 0 ? a.difficulty.localeCompare(b.difficulty) : a.title.localeCompare(b.title);
            });
            this.persistExtendedTestData();
            this.render();
        }
    }

    assignDeferredTest({ actor, diff, skillId, path, title }: AssignTestOptions): void {
        if (actor) {
            const difficulty: TestString = diff === "R" ? "Routine" : (diff === "C" ? "Challenging" : "Difficult");
            if (skillId) {
                const skill = actor.getOwnedItem(skillId) as Skill | null;
                if (skill) {
                    skill.addTest(difficulty, true);
                }
            } else if (path) {
                const stat = getProperty(actor.data, path) as Ability & { name?: string };
                if (["data.power", "data.will", "data.perception", "data.agility", "data.forte", "data.speed" ].includes(path)) {
                    actor.addStatTest(stat, title, path, difficulty, true, false, true);
                } else {
                    actor.addAttributeTest(stat, title, path, difficulty, true, true);
                }
            }

            const group = this.actorGroups.find(ag => ag.id === actor.id) as ActorTestGroup;
            group.advancements = group.advancements.filter(a => a.title !== title);
            if (!group.advancements.length) {
                this.actorGroups.splice(this.actorGroups.indexOf(group));
            }
            this.persistExtendedTestData();
            this.render();
        }
    }

    getData(): DifficultyDialogData {
        const data = super.getData() as DifficultyDialogData;
        data.difficulty = this.difficulty;
        data.editable = this.editable;
        data.splitPool = this.splitPool;
        data.noTrack = this.noTrack;
        data.customDiff = this.customDiff;
        data.modifiers = this.mods;
        
        data.extendedTest = this.extendedTest;
        data.actorGroups = this.actorGroups;

        return data;
    }
}

interface DifficultyDialogData {
    extendedTest: boolean;
    modifiers: { name: string; amount: number; }[];
    customDiff: boolean;
    noTrack: boolean;
    splitPool: boolean;
    difficulty: number;
    editable: boolean;
    actorGroups: ActorTestGroup[];
}

interface ActorTestGroup {
    id: string;
    name: string;
    advancements: ActorTestRecord[];
}

interface ActorTestRecord {
    title: string;
    path?: string;
    skillId?: string;
    difficulty: "R" | "D" | "C";
}

export interface AddDeferredTestOptions {
    actor: BWActor,
    name: string,
    path?: string;
    skill?: Skill,
    difficulty: TestString
}

interface AssignTestOptions {
    actor: BWCharacter | null,
    title: string,
    path?: string,
    skillId?: string,
    diff: "R" | "C" | "D"
}