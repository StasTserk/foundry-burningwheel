import { BWActor } from '../actors/BWActor';
import { StringIndexedObject } from '../helpers';
import { changesState, ExtendedTestDialog } from './ExtendedTestDialog';
import { handleLearningRoll } from '../rolls/rollLearning';
import { BWCharacter } from '../actors/BWCharacter';
import { handleSkillRoll } from '../rolls/rollSkill';
import { handleNpcSkillRoll } from '../rolls/npcSkillRoll';
import { Npc } from '../actors/Npc';
import { getKeypressModifierPreset } from '../rolls/rolls';
import { Skill } from '../items/skill';

import * as constants from '../constants';

export class DuelOfWitsDialog extends ExtendedTestDialog<DuelOfWitsData> {
    constructor(d: Dialog.Data, o?: Dialog.Options) {
        super(d, o);

        this.data.actionOptions = game.burningwheel.duelOfWitsActions;
        this.data.data.showV1 = this.data.data.showV1 || false;
        this.data.data.showV2 = this.data.data.showV2 || false;
        this.data.data.showV3 = this.data.data.showV3 || false;
        this.data.data.blindS1 = this.data.data.blindS1 || false;
        this.data.data.blindS2 = this.data.data.blindS2 || false;

        this.data.topic = 'Duel';
        this.data.settingName = constants.settings.duelData;
    }

    get template(): string {
        return 'systems/burningwheel/templates/dialogs/duel-of-wits.hbs';
    }

    static get defaultOptions(): Dialog.Options {
        return foundry.utils.mergeObject(
            super.defaultOptions,
            {
                width: 600,
                height: 600,
                resizable: true,
                classes: ['bw-app'],
            },
            { overwrite: true }
        );
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find('input, select, textarea').on('change', (e) =>
            this.propagateChange(e)
        );
        html.find("button[data-action='reset-round']").on('click', (_) =>
            this.clearRound()
        );
        html.find("button[data-action='reset-everything']").on('click', (_) =>
            this.clearEverything()
        );
        html.find("button[data-action='roll-dow']").on('click', (e) =>
            this._handleRoll(e)
        );
    }

    private _handleRoll(e: JQuery.ClickEvent) {
        e.preventDefault();
        const dataPreset = getKeypressModifierPreset(e);
        dataPreset.offerSplitPool = true;

        const target = e.currentTarget as HTMLButtonElement;
        if (target.dataset.actorId === '') {
            return;
        }

        if (target.dataset.skillId === '') {
            return;
        }
        const actor = game.actors?.contents.find(
            (a) => a.id === target.dataset.actorId
        ) as BWActor;
        const skill = actor?.items.get(target.dataset.skillId || '') as
            | Skill
            | undefined;

        dataPreset.deedsPoint = actor.system.deeds !== 0;
        if (actor.system.persona) {
            dataPreset.personaOptions = Array.from(
                Array(Math.min(actor.system.persona, 3)).keys()
            );
        }

        if (!skill) {
            return;
        }
        if (actor?.type === 'character') {
            if (skill.system.learning) {
                handleLearningRoll({
                    actor: actor as BWCharacter,
                    skill,
                    dataPreset,
                });
            } else {
                handleSkillRoll({
                    actor: actor as BWCharacter,
                    skill,
                    dataPreset,
                });
            }
        } else {
            // handle roll as npc
            handleNpcSkillRoll({
                actor: actor as Npc,
                skill,
                dataPreset,
            });
        }
    }

    getData(): DuelOfWitsData {
        const data = super.getData() as DuelOfWitsData;
        const actors = game.actors?.contents || [];
        data.actionOptions = this.data.actionOptions;

        data.side1Options = actors.filter((a) => a.id !== data.side2ActorId);
        data.side2Options = actors.filter((a) => a.id !== data.side1ActorId);

        data.actor1 = actors.find((a) => a.id === data.side1ActorId) as
            | BWActor
            | undefined;
        data.actor1Skills = (data.actor1?.socialSkills || []).map(
            (s: Skill) => {
                return { id: s.id, label: s.name };
            }
        );
        data.actor2 = actors.find((a) => a.id === data.side2ActorId) as
            | BWActor
            | undefined;
        data.actor2Skills = (data.actor2?.socialSkills || []).map(
            (s: Skill) => {
                return { id: s.id, label: s.name };
            }
        );

        data.side1ReadOnly = !data.actor1 || !data.actor1.isOwner;
        data.side2ReadOnly = !data.actor2 || !data.actor2.isOwner;

        data.gmView = game.user?.isGM || false;

        data.showS1Select =
            (data.gmView && !data.blindS1) ||
            (!data.side1ReadOnly && !data.gmView);
        data.showS2Select =
            (data.gmView && !data.blindS2) ||
            (!data.side2ReadOnly && !data.gmView);

        data.showV1S1Card =
            data.showV1 ||
            (data.gmView && !data.blindS1) ||
            (!data.side1ReadOnly && !data.gmView);
        data.showV1S2Card =
            data.showV1 ||
            (data.gmView && !data.blindS2) ||
            (!data.side2ReadOnly && !data.gmView);
        data.showV2S1Card =
            data.showV2 ||
            (data.gmView && !data.blindS1) ||
            (!data.side1ReadOnly && !data.gmView);
        data.showV2S2Card =
            data.showV2 ||
            (data.gmView && !data.blindS2) ||
            (!data.side2ReadOnly && !data.gmView);
        data.showV3S1Card =
            data.showV3 ||
            (data.gmView && !data.blindS1) ||
            (!data.side1ReadOnly && !data.gmView);
        data.showV3S2Card =
            data.showV3 ||
            (data.gmView && !data.blindS2) ||
            (!data.side2ReadOnly && !data.gmView);

        return data;
    }

    @changesState()
    async clearEverything(): Promise<void> {
        await this.clearRound();
        const data = this.data.data;
        data.blindS1 = false;
        data.blindS2 = false;
        data.boa1 = 0;
        data.boa1Max = 0;
        data.boa2 = 0;
        data.boa2Max = 0;
        data.side1ActorId = '';
        data.side2ActorId = '';
        data.statement1 = '';
        data.statement2 = '';
        data.actor1Skill = '';
        data.actor2Skill = '';
    }

    @changesState()
    async clearRound(): Promise<void> {
        const data = this.data.data;
        data.v1s1 = '?';
        data.v1s2 = '?';
        data.v2s1 = '?';
        data.v2s2 = '?';
        data.v3s1 = '?';
        data.v3s2 = '?';

        data.showV1 = false;
        data.showV2 = false;
        data.showV3 = false;
    }

    static addSidebarControl(html: JQuery): void {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = 'Duel of Wits';
        buttonElement.className = 'dow-sidebar-button';
        buttonElement.onclick = () => game.burningwheel.dow.render(true);
        const combatHeader = $(html).find('header');
        combatHeader.prepend(buttonElement);
    }

    data: ExtendedTestDialog<DuelOfWitsData>['data'] & {
        actionOptions: Record<string, string[]>;
    };
}

interface DuelOfWitsData {
    actor1Skills: { id: string; label: string }[];
    actor2Skills: { id: string; label: string }[];
    actor1Skill: string;
    actor2Skill: string;
    side1ActorId: string;
    side2ActorId: string;
    boa1: number;
    boa2: number;
    boa1Max: number;
    boa2Max: number;
    statement1: string;
    statement2: string;
    actor1?: BWActor;
    actor2?: BWActor;

    side1Options: Actor[];
    side2Options: Actor[];
    side1ReadOnly: boolean;
    side2ReadOnly: boolean;
    gmView: boolean;

    showV1: boolean;
    showV2: boolean;
    showV3: boolean;

    blindS1: boolean;
    blindS2: boolean;

    v1s1: string;
    v1s2: string;
    v2s1: string;
    v2s2: string;
    v3s1: string;
    v3s2: string;

    showV1S1Card: boolean;
    showV1S2Card: boolean;
    showV2S1Card: boolean;
    showV2S2Card: boolean;
    showV3S1Card: boolean;
    showV3S2Card: boolean;
    showS1Select: boolean;
    showS2Select: boolean;

    actionOptions: StringIndexedObject<string[]>;
}
