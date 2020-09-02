import { BWActorSheet } from "./bwactor-sheet.js";
import { ShadeString } from "./helpers.js";
import { BWActor } from "./bwactor.js";
import { TraitDataRoot } from "./items/item.js";

export class NpcSheet extends BWActorSheet {
    getData(): ActorSheetData<unknown> {
        const data = super.getData() as NpcSheetData;
        const actor = this.actor;
        data.statRow = [
            { label: "Wi", value: actor.data.data.will.exp, valuePath: "will.exp", shade: actor.data.data.will.shade, shadePath: "will.shade" },
            { label: "Pe", value: actor.data.data.perception.exp, valuePath: "perception.exp", shade: actor.data.data.perception.shade, shadePath: "perception.shade" },
            { label: "Ag", value: actor.data.data.agility.exp, valuePath: "agility.exp", shade: actor.data.data.agility.shade, shadePath: "agility.shade" },
            { label: "Sp", value: actor.data.data.speed.exp, valuePath: "speed.exp", shade: actor.data.data.speed.shade, shadePath: "speed.shade" },
            { label: "Po", value: actor.data.data.power.exp, valuePath: "power.exp", shade: actor.data.data.power.shade, shadePath: "power.shade" },
            { label: "Fo", value: actor.data.data.forte.exp, valuePath: "forte.exp", shade: actor.data.data.forte.shade, shadePath: "forte.shade" },
            { label: "Hea", value: actor.data.data.health.exp, valuePath: "health.exp", shade: actor.data.data.health.shade, shadePath: "health.shade" },
            { label: "Ref", value: actor.data.data.reflexesExp || 0, valuePath: "", shade: actor.data.data.reflexesShade, shadePath: "" },
            { label: "MW", value: actor.data.data.mortalWound || 0, valuePath: "", shade: actor.data.data.mortalWoundShade, shadePath: "" },
            { label: "Ste", value: actor.data.data.steel.exp, valuePath: "steel.exp", shade: actor.data.data.steel.shade, shadePath: "steel.shade" },
            { label: "Hes", value: actor.data.data.hesitation || 0, valuePath: "" },
            { label: "Res", value: actor.data.data.resources.exp, valuePath: "resources.exp", shade: actor.data.data.resources.shade, shadePath: "resources.shade" },
            { label: "Cir", value: actor.data.data.circles.exp, valuePath: "circles.exp", shade: actor.data.data.circles.shade, shadePath: "circles.shade" },
            { label: "Str", value: actor.data.data.stride, valuePath: "stride" },
        ];
        data.beliefs = [];
        data.traits = [];
        data.instincts = [];
        actor.items.forEach((i: ItemData) => {
            if (i.type === "belief") { data.beliefs.push(i); }
            if (i.type === "trait") { data.traits.push(i as TraitDataRoot); }
            if (i.type === "instinct") { data.instincts.push(i); }
        });

        return data;
    }
}

export interface NpcSheetData extends ActorSheetData {
    statRow: NPCStatEntry[];
    beliefs: ItemData[];
    instincts: ItemData[];
    traits: TraitDataRoot[];
    actor: BWActor;
}

interface NPCStatEntry {

    label: string;
    valuePath: string;
    value: string | number;
    shade?: ShadeString;
    shadePath?: string;
}