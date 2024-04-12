import { resolve } from "path";

export const CONFIG_FILE_NAME_JSON = "capacitor.sync.json";

export interface CapacitorSyncConfig {
    plist?: {
        CFBundleShortVersionString?: string;
        CFBundleVersion?: string;
    };

    pbxproj?: {
        MARKETING_VERSION?: string;
        CURRENT_PROJECT_VERSION?: string;
    };
}

export type Config = CapacitorSyncConfig;

export async function loadConfig(): Promise<Config> {
    const appRootDir = process.cwd();

    const extConfigFilePath = await resolve(appRootDir, CONFIG_FILE_NAME_JSON);

    const config: Config = require(extConfigFilePath) ?? {};

    return config;
}
