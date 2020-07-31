export async function migrateData() {
    const latest = game.system.data.version;
    const recentVersion = await game.settings.get("burningwheel", "version") || "0.0.0";
    await game.settings.set("burningwheel", "version", latest);

    if (isNewerVersion(latest, recentVersion)) {
        // we need to do some updates.
        if (isNewerVersion("0.2.1", recentVersion)) {
            // refactored intiatilization code to use a flag for actors
            // to initialize fists, beliefs and instincts on new characters
            // only if a flag was set.
            // these items will have already been initialized on existing
            // characters so avoid re-initalizing them by setting the flag to true.
            const actors: Actor[] = Array.from(game.actors.values());
            for (const actor of actors) {
                await actor.setFlag("burningwheel", "initialized", true);
            }
            ui.notifications.notify(`Your data has been updated to version 0.2.1 from ${recentVersion}`, 'info');
        }
    }
}
