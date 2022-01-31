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
/*global describe, it*/

import * as chai from 'chai';
import {pushDataForApp, getDumpFileToUpload} from "../../src/file-manager.js";
import {readJsonFile, getUnixTimestampUTCNow} from "../../src/utils.js";
import {deleteFile} from "./test-utils.js";

let expect = chai.expect;

describe('config-manager.js Tests', function() {
    it('Should get dump file to Upload if exists', async function() {
        const appName = "testApp";
        await pushDataForApp(appName, JSON.stringify({"message": "hello"}));
        await pushDataForApp(appName, JSON.stringify({"message": "world"}));
        const fileToUpload = await getDumpFileToUpload(appName);

        expect(fileToUpload).to.be.not.null;
        let writtenDumpFile = await readJsonFile(fileToUpload.filePath);
        expect(writtenDumpFile["schemaVersion"]).to.equal(1);
        expect(writtenDumpFile["unixTimestampUTCAtServer"]).to.be.lessThan(getUnixTimestampUTCNow());
        expect(writtenDumpFile["clientAnalytics"][2]['endTime']).to.be.lessThan(getUnixTimestampUTCNow());
        await deleteFile(fileToUpload.filePath);
    });

    it('Should get empty if there is no dump file to upload', async function() {
        const appName = "testApp";
        const fileToUpload = await getDumpFileToUpload(appName);
        expect(fileToUpload).to.be.undefined;
    });
});
