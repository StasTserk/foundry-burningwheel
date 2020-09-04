
export async function preloadHandlebarsTemplates(): Promise<void> {

    // Define template paths to load
    const templatePaths = [
      // Actor Sheet Partials
      "systems/burningwheel/templates/parts/armor.hbs",
      "systems/burningwheel/templates/parts/learning.hbs",
      "systems/burningwheel/templates/parts/ptgs.hbs",
      "systems/burningwheel/templates/parts/relationships.hbs",
      "systems/burningwheel/templates/parts/rollable-item.hbs",
      "systems/burningwheel/templates/parts/rollable-skill.hbs",
      "systems/burningwheel/templates/parts/spell.hbs",
      "systems/burningwheel/templates/parts/weapons.hbs",
      "systems/burningwheel/templates/parts/character-settings.hbs",

      "systems/burningwheel/templates/parts/npc-stat.hbs",
      "systems/burningwheel/templates/parts/npc-editable.hbs",
      "systems/burningwheel/templates/parts/npc-skill.hbs"
    ];

    // Load the template parts
    return loadTemplates(templatePaths);
}
