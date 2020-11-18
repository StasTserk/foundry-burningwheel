import { BWCharacter } from "./character.js";
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
import { Npc } from "./npc.js";

function factory(entities: Record<string, typeof Entity>, baseClass: typeof Entity): unknown {
    return new Proxy(baseClass, {
        construct: (target, args) => {
            const [data, options] = args;
            const constructor = entities[data.type];
            if (!constructor) {
                throw new Error("Unsupported Entity type for create(): " + data.type);
            }
            return new constructor(data, options);
        },
        get: (target, prop) => {
            switch (prop) {
              case "create":
                //Calling the class' create() static function
                return function (data: EntityData, options: unknown) {
                  const constructor = entities[data.type];
    
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

const actorTypes: Record<string, typeof Actor> = {};
actorTypes["character"] = BWCharacter as typeof Actor;
actorTypes["npc"] = Npc as typeof Actor;
export const actorConstructor = factory(actorTypes, Actor) as typeof Actor;

const itemTypes: Record<string, typeof Item> = {};

itemTypes["belief"] = Belief as typeof Item;
itemTypes["instinct"] = Instinct as typeof Item;
itemTypes["trait"] = Trait as typeof Item;
itemTypes["skill"] = Skill as typeof Item;
itemTypes["armor"] = Armor as typeof Item;
itemTypes["possession"] = Possession as typeof Item;
itemTypes["property"] = Property as typeof Item;
itemTypes["relationship"] = Relationship as typeof Item;
itemTypes["melee weapon"] = MeleeWeapon as typeof Item;
itemTypes["ranged weapon"] = RangedWeapon as typeof Item;
itemTypes["reputation"] = Reputation as typeof Item;
itemTypes["affiliation"] = Relationship as typeof Item;
itemTypes["spell"] = Spell as typeof Item;
export const itemConstructor = factory(itemTypes, Item) as typeof Item;
