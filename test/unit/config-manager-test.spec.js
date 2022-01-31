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

// jshint ignore: start
/*global describe, it, before, beforeEach, after, afterEach*/

import * as chai from 'chai';
import {
    updateSystemGeneratedConfig,
    getConfig,
    getSystemGeneratedConfig,
    setConfigFilePath,
    onConfigEvent,
    CONFIG_CHANGED_EVENT,
    DEFAULT_CONFIG_FILE_PATH
} from "../../src/config-manager.js";
import {writeAsJson, readJsonFile} from "../../src/utils.js";
import {deleteFile, sleep} from "./test-utils.js";
import path from "path";

let expect = chai.expect;
let defaultConfig = {};
let TEST_CONFIG_FILE_PATH = path.resolve("analytics-config-test.json");

describe('config-manager.js Tests', function() {
    before(async function () {
        defaultConfig = await readJsonFile(DEFAULT_CONFIG_FILE_PATH);
        await writeAsJson(TEST_CONFIG_FILE_PATH, {});
        await setConfigFilePath(TEST_CONFIG_FILE_PATH);
    });

    beforeEach(async function () {
        await writeAsJson(TEST_CONFIG_FILE_PATH, defaultConfig);
        await setConfigFilePath(TEST_CONFIG_FILE_PATH);
    });

    afterEach(async function () {
        await deleteFile(TEST_CONFIG_FILE_PATH);
    });

    after(async function () {
        await setConfigFilePath(DEFAULT_CONFIG_FILE_PATH);
        await deleteFile(TEST_CONFIG_FILE_PATH);
    });

    it('Should get systemGenerated configs', async function() {
        const sysGeneratedConfig = getSystemGeneratedConfig();
        expect(sysGeneratedConfig["webDashboardAccessToken"]).to.exist;
    });

    it('Should update systemGenerated configs in file', async function() {
        await updateSystemGeneratedConfig("test", "value");
        let newConfiguration = await readJsonFile(TEST_CONFIG_FILE_PATH);
        expect(newConfiguration["systemGenerated"]["test"]).to.equal('value');
    });

    it('Should load changed configuration if version upgraded', async function() {
        const currentConfig = await readJsonFile(TEST_CONFIG_FILE_PATH);
        currentConfig["testKey"] = "testValue";
        currentConfig.configVersion = currentConfig.configVersion + 1;
        await writeAsJson(TEST_CONFIG_FILE_PATH, currentConfig);
        await sleep(100);
        expect(getConfig("testKey")).to.equal("testValue");
    });

    it('Should not load changed configuration if version is not upgraded', async function() {
        const currentConfig = await readJsonFile(TEST_CONFIG_FILE_PATH);
        currentConfig["newTestKey"] = "newTestValue";
        await writeAsJson(TEST_CONFIG_FILE_PATH, currentConfig);
        await sleep(100);
        expect(getConfig("newTestKey")).to.be.undefined;
    });

    it('Should generate config changed event', function(done) {
        async function f() {
            const currentConfig = await readJsonFile(TEST_CONFIG_FILE_PATH);
            currentConfig["newTestKey"] = "newTestValue";
            currentConfig.configVersion = currentConfig.configVersion + 1;
            let configEventRaised = false;
            onConfigEvent(CONFIG_CHANGED_EVENT, ()=>{
                if(!configEventRaised){
                    expect(getConfig("newTestKey")).to.equal("newTestValue");
                    configEventRaised = true;
                    done();
                }
            });
            await writeAsJson(TEST_CONFIG_FILE_PATH, currentConfig);
        }
        f();
    });
});
