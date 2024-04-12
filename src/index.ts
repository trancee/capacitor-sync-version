#!/usr/bin/env node

import { resolve } from "path";

import chalk from "chalk";
import { Command } from "commander";

import { log, readPackage } from "./utils";
import { syncAndroid } from "./sync-android";
import { syncIos } from "./sync-ios";
import { loadConfig, Config } from "./config";

// define supported syncing platform
enum Platform {
  android = "android",
  ios = "ios",
}

// mount all syncing methods
const sync: Record<Platform, (config?: Config) => Promise<void>> = {
  android: syncAndroid,
  ios: syncIos
};

const pkgInfo = readPackage(resolve(__dirname, "../package.json"));

const program = new Command();

program
  .usage("[capacitor-platform-name...]")
  .version(pkgInfo.version, "-v, --version", `Print ${pkgInfo.name} version`)
  .helpOption("-h, --help", "Print this help")
  .parse(process.argv);

const args = program.args;

let platforms = [...args];

if (!platforms.length) {
  if (process.env.CAPACITOR_PLATFORM_NAME) {
    platforms.push(process.env.CAPACITOR_PLATFORM_NAME);
  } else {
    console.log(chalk`  {red Missing platform name. Nothing to do.}`);
    process.exit();
  }
}

// ignore web
platforms = platforms.filter(p => p !== "web");

const supportedPlatforms = Object.values(Platform) as string[];
const invalidPlatform = platforms.find(platform => !supportedPlatforms.includes(platform));

if (invalidPlatform) {
  log(chalk`\n  {red Unsupported platform name: "${invalidPlatform}". Nothing to do.}`);
  process.exit();
}

(async () => {
  let config;
  try { config = await loadConfig(); } catch { }
  for (const [i, platform] of (platforms as Platform[]).entries()) {
    !i && console.log(); // print blank line before the 1st platform
    await sync[platform](config);
  }
})();

/* -*- ts -*- */
