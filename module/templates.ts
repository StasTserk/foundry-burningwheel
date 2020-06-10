
export async function preloadHandlebarsTemplates() {

    // Define template paths to load
    const templatePaths = [
      // Actor Sheet Partials
      "systems/burningwheel/templates/parts/stat.html"
    ];

    // Load the template parts
    return loadTemplates(templatePaths);
};
