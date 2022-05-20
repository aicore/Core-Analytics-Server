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
import events from "events";
import cloneDeep from 'clone-deep';
import {writeAsJson, readJsonFile} from "./utils.js";

const ACCOUNT_CONFIG_KEY = "accountConfig",
    SYSTEM_GENERATED_CONFIG_KEY = "systemGenerated";
const DEFAULT_CONFIG_FILE_PATH = path.resolve('analytics-config.json');
const CONFIG_CHANGED_EVENT = 'CONFIG_CHANGED_EVENT';
const eventEmitter = new events();

function onConfigEvent(eventType, cbFn) {
    eventEmitter.on(eventType, cbFn);
}

let configFilePath = DEFAULT_CONFIG_FILE_PATH;
let configuration = {};

function _printConfig() {
    let filteredConfig = cloneDeep(configuration);
    if(filteredConfig.rotateDumpFiles && filteredConfig.rotateDumpFiles.storage){
        filteredConfig.rotateDumpFiles.storage.accessKeyId = 'xxxx';
        filteredConfig.rotateDumpFiles.storage.secretAccessKey = 'xxxx';
    }
    console.log("configuration updated: ", filteredConfig);
}

async function reloadConfigFile() {
    configuration = await readJsonFile(configFilePath);
    eventEmitter.emit(CONFIG_CHANGED_EVENT);
    _printConfig();
}

reloadConfigFile();

async function updateSystemGeneratedConfig(key, value) {
    await reloadConfigFile();
    configuration[SYSTEM_GENERATED_CONFIG_KEY][key] = value;
    await writeAsJson(configFilePath, configuration);
    await reloadConfigFile();
}

function getConfig(key) {
    return configuration[key];
}

function getSystemGeneratedConfig(key) {
    if(configuration[SYSTEM_GENERATED_CONFIG_KEY]){
        return configuration[SYSTEM_GENERATED_CONFIG_KEY][key];
    }
}

function getAppConfig(accountID, appName) {
    const config = configuration[ACCOUNT_CONFIG_KEY] || {};
    const accountConfig = config[accountID] || {};
    const defaultAccountConfig = accountConfig['*'];
    const appSpecificConfig = accountConfig[appName];
    return appSpecificConfig || defaultAccountConfig || {};
}

async function setConfigFilePath(newConfigFilePath) {
    configFilePath = newConfigFilePath;
    _setupConfigFileWatcher();
    await reloadConfigFile();
}

function _setupConfigFileWatcher() {
    fs.watch(configFilePath, { persistent: false },
        async function (eventType, _filename) {
            if(eventType === 'change'){
                let newConfiguration = await readJsonFile(configFilePath);
                if(newConfiguration.configVersion > configuration.configVersion){
                    await reloadConfigFile();
                }
            }
        }
    );
}

_setupConfigFileWatcher();

export {
    getConfig,
    // setConfig is not present by design as the system is not supposed to update user config.
    // use updateSystemGeneratedConfig section for that.
    updateSystemGeneratedConfig,
    getSystemGeneratedConfig,
    getAppConfig,
    reloadConfigFile,
    setConfigFilePath,
    onConfigEvent,
    CONFIG_CHANGED_EVENT,
    DEFAULT_CONFIG_FILE_PATH
};
