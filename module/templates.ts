
export async function preloadHandlebarsTemplates() {

    // Define template paths to load
    const templatePaths = [
      // Actor Sheet Partials
      "systems/burningwheel/templates/parts/learning.html",
      "systems/burningwheel/templates/parts/ptgs.html",
      "systems/burningwheel/templates/parts/rollable-item.html",
      "systems/burningwheel/templates/parts/rollable-skill.html"
    ];

    // Load the template parts
    return loadTemplates(templatePaths);
};
