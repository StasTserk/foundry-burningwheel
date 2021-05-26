import * as constants from "../constants.js";

export async function migrateData(): Promise<void> {
    if (!game.user?.isGM) {
        // players can't do this stuff anyhow.
        return;
    }
    const latest = game.system.data.version;
    const recentVersion = (game.settings.get(constants.systemName, constants.settings.version) || "0.0.0") as string;
    await game.settings.set(constants.systemName, constants.settings.version, latest);

    const patchVersions = Object.keys(migrationRoutines);
    for (const version of patchVersions) {
        if (isNewerVersion(version, recentVersion)) {
            // we need to do some updates.
            ui.notifications?.notify(`Beginning ${version} data migration.`, 'info');
            await migrationRoutines[version]();
            ui.notifications?.notify(`Applied ${version} data migration.`, 'info');
        }
    }
}

let migrationRoutines: {[i:string]: () => Promise<void>};
export function registerTask(version: string, task: () => Promise<void>): void {
    if (!migrationRoutines) {
        migrationRoutines = {};
    }
    migrationRoutines[version] = task;
}

import { task021 } from "./task021.js";
import { task022 } from "./task022.js";
import { task041 } from "./task041.js";
import { task061 } from "./task061.js";
import { task063 } from "./task063.js";

registerTask("0.2.1", task021);
registerTask("0.2.2", task022);
registerTask("0.4.1", task041);
registerTask("0.6.1", task061);
registerTask("0.6.3", task063);