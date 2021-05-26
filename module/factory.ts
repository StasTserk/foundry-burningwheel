import { BWCharacter } from "./actors/BWCharacter.js";
import { Armor } from "./items/armor.js";
import { Belief } from "./items/belief.js";
import { Instinct } from "./items/instinct.js";
import { MeleeWeapon } from "./items/meleeWeapon.js";
import { Possession } from "./items/possession.js";
import { Property } from "./items/property.js";
import { RangedWeapon } from "./items/rangedWeapon.js";
import { Relationship } from "./items/relationship.js";
import { Reputation } from "./items/reputation.js";
import { Skill } from "./items/skill.js";
import { Spell } from "./items/spell.js";
import { Trait } from "./items/trait.js";
import { Npc } from "./actors/Npc.js";
import { Lifepath } from "./items/lifepath.js";
import { BWSetting } from "./actors/BWSetting.js";

function factory(entities: Record<string, typeof Entity>, baseClass: typeof Entity): unknown {
    return new Proxy(baseClass, {
        construct: (target, args) => {
            const [data, options] = args;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const constructor = entities[data.type] as any;
            if (!constructor) {
                throw new Error("Unsupported Entity type for create(): " + data.type);
            }
            return new constructor(data, options);
        },
        get: (target, prop) => {
            switch (prop) {
                case "create":
                //Calling the class' create() static function
                    return function (data: Entity.Data, options: unknown) {
                    
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const constructor = entities[data.type] as any;

                    if (!constructor) {
                        throw new Error(
                          "Unsupported Entity type for create(): " + data.type
                        );
                    }
                    return constructor.create(data, options as never);
                };
    
                case Symbol.hasInstance:
                    //Applying the "instanceof" operator on the instance object
                    return function (instance: Entity) {
                    const constr = entities[instance.data.type];
                    if (!constr) {
                        return false;
                    }
                    return instance instanceof constr;
                    };
                default:
                    //Just forward any requested properties to the base Actor class
                    return baseClass[prop];
            }
        }
    });
}

const actorTypes: Record<string, typeof Entity> = {};
actorTypes["character"] = BWCharacter as typeof Entity;
actorTypes["npc"] = Npc as typeof Entity;
actorTypes["setting"] = BWSetting as typeof Entity;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actorConstructor = factory(actorTypes, Actor as any) as typeof Actor;

const itemTypes: Record<string, typeof Entity> = {};

itemTypes["belief"] = Belief as typeof Entity;
itemTypes["instinct"] = Instinct as typeof Entity;
itemTypes["trait"] = Trait as typeof Entity;
itemTypes["skill"] = Skill as typeof Entity;
itemTypes["armor"] = Armor as typeof Entity;
itemTypes["possession"] = Possession as typeof Entity;
itemTypes["property"] = Property as typeof Entity;
itemTypes["relationship"] = Relationship as typeof Entity;
itemTypes["melee weapon"] = MeleeWeapon as typeof Entity;
itemTypes["ranged weapon"] = RangedWeapon as typeof Entity;
itemTypes["reputation"] = Reputation as typeof Entity;
itemTypes["affiliation"] = Relationship as typeof Entity;
itemTypes["spell"] = Spell as typeof Entity;
itemTypes["lifepath"] = Lifepath as typeof Entity;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const itemConstructor = factory(itemTypes, Item as any) as typeof Item;
