export function registerSystemSettings() {
    game.settings.register("burningwheel", "version", {
        name: "Current World Version",
        scope: "world",
        config: false,
        type: String,
        default: "0.0.0"
      });
}
