export async function preloadHandlebarsTemplates(): Promise<unknown[]> {
    // Define template paths to load
    const templatePaths = [
        // Actor Sheet Partials
        'systems/burningwheel/templates/parts/armor.hbs',
        'systems/burningwheel/templates/parts/learning.hbs',
        'systems/burningwheel/templates/parts/ptgs.hbs',
        'systems/burningwheel/templates/parts/relationships.hbs',
        'systems/burningwheel/templates/parts/rollable-item.hbs',
        'systems/burningwheel/templates/parts/rollable-skill.hbs',
        'systems/burningwheel/templates/parts/spell.hbs',
        'systems/burningwheel/templates/parts/trait.hbs',
        'systems/burningwheel/templates/parts/weapons.hbs',

        'systems/burningwheel/templates/sections/attributes.hbs',
        'systems/burningwheel/templates/sections/beliefs.hbs',
        'systems/burningwheel/templates/sections/character-settings.hbs',
        'systems/burningwheel/templates/sections/footer.hbs',
        'systems/burningwheel/templates/sections/gear.hbs',
        'systems/burningwheel/templates/sections/header.hbs',
        'systems/burningwheel/templates/sections/instincts.hbs',
        'systems/burningwheel/templates/sections/learning.hbs',
        'systems/burningwheel/templates/sections/misc.hbs',
        'systems/burningwheel/templates/sections/ptgs.hbs',
        'systems/burningwheel/templates/sections/skills.hbs',
        'systems/burningwheel/templates/sections/social.hbs',
        'systems/burningwheel/templates/sections/spells.hbs',
        'systems/burningwheel/templates/sections/stats.hbs',
        'systems/burningwheel/templates/sections/traits.hbs',
        'systems/burningwheel/templates/sections/weapons-and-armor.hbs',

        'systems/burningwheel/templates/parts/npc-stat.hbs',
        'systems/burningwheel/templates/parts/npc-editable.hbs',
        'systems/burningwheel/templates/parts/npc-skill.hbs',
        'systems/burningwheel/templates/parts/npc-spell.hbs',
        'systems/burningwheel/templates/parts/npc-weapon.hbs',

        'systems/burningwheel/templates/parts/lifepath.hbs',
    ];

    // Load the template parts
    return loadTemplates(templatePaths);
}
