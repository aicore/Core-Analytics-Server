/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see https://opensource.org/licenses/AGPL-3.0.
 *
 */

import fs from 'fs';
import path from "path";
import {writeAsJson, readJsonFile} from "./utils.js";
const DEFAULT_CONFIG_FILE_PATH = path.resolve('analytics-config.json');

let configFilePath = DEFAULT_CONFIG_FILE_PATH;
let configuration = {};

async function reloadConfigFile() {
    configuration = {};
    configuration = await readJsonFile(configFilePath);
}

reloadConfigFile();

async function updateSystemGeneratedConfig(key, value) {
    configuration.systemGenerated[key] = value;
    await writeAsJson(configFilePath, configuration);
}

function getConfig(key) {
    return configuration[key];
}

function getSystemGeneratedConfig() {
    return configuration.systemGenerated;
}

function setConfigFilePath(newConfigFilePath) {
    configFilePath = newConfigFilePath;
    _setupConfigFileWatcher();
}

function _setupConfigFileWatcher() {
    fs.watch(configFilePath, { persistent: false },
        async function (eventType, filename) {
            if(eventType === 'change'){
                let newConfiguration = await readJsonFile(configFilePath);
                if(newConfiguration.configVersion > configuration.configVersion){
                    reloadConfigFile();
                }
            }
        }
    );
}

_setupConfigFileWatcher();

export {
    getConfig,
    updateSystemGeneratedConfig,
    getSystemGeneratedConfig,
    reloadConfigFile,
    setConfigFilePath,
    DEFAULT_CONFIG_FILE_PATH
};
