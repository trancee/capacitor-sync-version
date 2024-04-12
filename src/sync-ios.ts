import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";

import chalk from "chalk";
import plist from "plist";
import { valid } from "semver";

import { log, readPackage } from "./utils";
import { Config } from "./config";

type PlistVersion = {
  CFBundleShortVersionString: string;
  CFBundleVersion: string;
};

const infoPlistPath = resolve(process.cwd(), "ios/App/App/Info.plist");
const projectPbxProjPath = resolve(process.cwd(), "ios/App/App.xcodeproj/project.pbxproj");

export const syncIos = async (config?: Config) => {
  const { version } = readPackage(resolve(process.cwd(), "package.json"));

  if (!valid(version)) {
    log(chalk`  {red Invalid version: "${version}". Nothing to do.}`);
    process.exit();
  }

  const check = (configValue?: string, currentValue?: string): string | undefined => {
    if (configValue) {
      if (configValue === "VERSION") {
        return version;
      } else if (configValue === "AUTOINCREMENT") {
        return String((Number(currentValue) || 0) + 1);
      }

      return configValue;
    }

    return currentValue;
  }

  try {
    let content = readFileSync(infoPlistPath, { encoding: "utf8" });

    const infoPlist = plist.parse(content) as PlistVersion;

    infoPlist.CFBundleShortVersionString = check(config?.plist?.CFBundleShortVersionString, infoPlist.CFBundleShortVersionString)!;
    infoPlist.CFBundleVersion = check(config?.plist?.CFBundleVersion, infoPlist.CFBundleVersion)!;

    content = plist.build(infoPlist);
    writeFileSync(infoPlistPath, content + "\n", { encoding: "utf8" });
  } catch (e) {
    log(chalk`  {red ${e}; Aborting.}`);
    process.exit();
  }

  try {
    let content = readFileSync(projectPbxProjPath, { encoding: "utf8" });

    const searchReplace = (configKey: string, configValue?: string): [string, string] => {
      const re = new RegExp(`${configKey}\\s*=\\s*(.*?);`);

      const match = content.match(re);
      if (match) {
        const value = check(configValue, match[1]);

        if (match[1] !== value) {
          return [
            match[0],
            match[0].replace(match[1], value!),
          ];
        }
      }

      return ["", ""];
    }

    content.replaceAll(...searchReplace("MARKETING_VERSION", config?.pbxproj?.MARKETING_VERSION));
    content.replaceAll(...searchReplace("CURRENT_PROJECT_VERSION", config?.pbxproj?.CURRENT_PROJECT_VERSION));

    writeFileSync(projectPbxProjPath, content, { encoding: "utf8" });
  } catch (e) {
    log(chalk`  {red ${e}; Aborting.}`);
    process.exit();
  }

  log(chalk`{green ✔} Sync version ${version} for iOS.`);
};
