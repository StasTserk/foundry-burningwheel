
export async function preloadHandlebarsTemplates() {

    // Define template paths to load
    const templatePaths = [
      // Actor Sheet Partials
      "systems/burningwheel/templates/parts/armor.html",
      "systems/burningwheel/templates/parts/learning.html",
      "systems/burningwheel/templates/parts/ptgs.html",
      "systems/burningwheel/templates/parts/relationships.html",
      "systems/burningwheel/templates/parts/rollable-item.html",
      "systems/burningwheel/templates/parts/rollable-skill.html",
      "systems/burningwheel/templates/parts/weapons.html",
      "systems/burningwheel/templates/parts/character-settings.html"
    ];

    // Load the template parts
    return loadTemplates(templatePaths);
}
