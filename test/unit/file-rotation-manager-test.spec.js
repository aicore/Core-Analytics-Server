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
    setConfigFilePath,
    DEFAULT_CONFIG_FILE_PATH
} from "../../src/config-manager.js";
import {
    onFileRotationEvent,
    ALL_DUMPS_ROTATED_EVENT,
    APP_DUMP_ROTATED_EVENT,
    setupFileRotationTimers, stopFileRotationTimers, rotateAllDumpFiles,
    UPLOAD_RETRIED_EVENT
} from "../../src/file-rotation-manager.js";
import {deleteFile, writeAsJson, readJsonFile, readTextFile} from "../../src/utils.js";
import {pushDataForApp} from "../../src/file-manager.js";
import {sleep, rmrf} from "./test-utils.js";
import path from "path";

let expect = chai.expect;
let defaultConfig = {};
let TEST_CONFIG_FILE_PATH = path.resolve("analytics-config-test.json");

describe('file-rotation-manager.js Tests', function() {
    async function _writeDefaultConfigTestFile() {
        await writeAsJson(TEST_CONFIG_FILE_PATH, defaultConfig);
        await setConfigFilePath(TEST_CONFIG_FILE_PATH);
    }

    before(async function () {
        defaultConfig = await readJsonFile(DEFAULT_CONFIG_FILE_PATH);
        await writeAsJson(TEST_CONFIG_FILE_PATH, {});
        await setConfigFilePath(TEST_CONFIG_FILE_PATH);
    });

    beforeEach(async function () {
        defaultConfig["rotateDumpFiles"] = {
            maxFileSizeBytes: 100000000,
            rotateInEveryNSeconds: 600,
            storage: {
                destination: "none"
            }
        };
        await _writeDefaultConfigTestFile();
        await setupFileRotationTimers();
    });

    afterEach(async function () {
        await deleteFile(TEST_CONFIG_FILE_PATH);
    });

    after(async function () {
        await setConfigFilePath(DEFAULT_CONFIG_FILE_PATH);
        await deleteFile(TEST_CONFIG_FILE_PATH);
        await stopFileRotationTimers();
        await rmrf('data');
    });

    it('Should rotate all files on every time out', function(done) {
        async function f() {
            defaultConfig["rotateDumpFiles"] = {
                maxFileSizeBytes: 100000000,
                rotateInEveryNSeconds: .2,
                storage: {
                    destination: "none"
                }
            };
            await _writeDefaultConfigTestFile();
            let numTimeFileRotated = 0;
            await rotateAllDumpFiles();

            onFileRotationEvent(ALL_DUMPS_ROTATED_EVENT, async ()=>{
                numTimeFileRotated ++;
            });
            await pushDataForApp("appx", "hello");
            await pushDataForApp("appy", "world");
            await sleep(300);
            expect(numTimeFileRotated).equal(1);
            await pushDataForApp("appx", "hello");
            await pushDataForApp("appy", "world");
            await sleep(300);
            expect(numTimeFileRotated).equal(2);
            await stopFileRotationTimers();
            done();
        }
        f();
    });

    it('Should rotate file on bytes exceeded even if destination is unknown', function(done) {
        async function f() {
            defaultConfig["rotateDumpFiles"] = {
                maxFileSizeBytes: 1000,
                rotateInEveryNSeconds: 600,
                storage: {
                    destination: "lols"
                }
            };
            await _writeDefaultConfigTestFile();
            let numTimeFileRotated = 0;
            let rotatedAppName = "";
            await rotateAllDumpFiles();

            onFileRotationEvent(APP_DUMP_ROTATED_EVENT, async (appFileHandle)=>{
                rotatedAppName = appFileHandle.appName;
                numTimeFileRotated ++;
            });
            let sample = await readTextFile('package.json');
            await pushDataForApp("app1", sample);
            await pushDataForApp("app2", "world");
            await sleep(100);
            expect(numTimeFileRotated).to.equal(1);
            expect(rotatedAppName).to.equal("app1");
            await rotateAllDumpFiles();
            done();
        }
        f();
    });

    it('Should upload file on bytes exceeded to linode', function(done) {
        async function f() {
            defaultConfig["rotateDumpFiles"] = {
                maxFileSizeBytes: 1000,
                rotateInEveryNSeconds: 600,
                storage: {
                    destination: "linode",
                    accessKeyId: "LinodeAccessKeyId",
                    secretAccessKey: "LinodeSecretAccessKey",
                    region: "LinodeRegion",
                    bucket: "LinodeBucket",
                    uploadRetryTimeSecs: 1
                }
            };
            await _writeDefaultConfigTestFile();
            let uploadRetried = false;
            await rotateAllDumpFiles();

            onFileRotationEvent(UPLOAD_RETRIED_EVENT, async ()=>{
                uploadRetried = true;
            });
            let sample = await readTextFile('package.json');
            await pushDataForApp("app1", sample);
            await pushDataForApp("app2", "world");
            while(!uploadRetried){
                await sleep(100);
            }
            expect(uploadRetried).to.equal(true);
            done();
        }
        f();
    }).timeout(10000);
});
