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
/*global describe, it, after*/

import * as chai from 'chai';
import {processDataFromClient, getServerStats} from "../../src/analytics-data-manager.js";
import {onFileEvent, DUMP_FILE_UPDATED_EVENT} from "../../src/file-manager.js";
import {rmrf, sleep} from "./test-utils.js";

let expect = chai.expect;

describe('analytics-data-manager.js Tests', function() {
    after(async function () {
        await sleep(1000);
        await rmrf('data');
    });

    it('should fail validation if schema version is not 1', async function() {
        const response = await processDataFromClient({
            "schemaVersion": 2,
            "appName": "testApp",
            "uuid": "default",
            "sessionID": "def",
            "granularitySec": 3,
            "unixTimestampUTC": 1643043376,
            "numEventsTotal": 5,
            "events": {}
        });

        expect(response.statusCode).to.equal(400);
        expect(response.returnData.errors.includes("Invalid schemaVersion")).to.be.true;
        expect(response.returnData.errors.length).to.equal(1);
    });

    it('should fail validation if required fields is not present or empty', async function() {
        const response = await processDataFromClient({
            "schemaVersion": 1,
            "uuid": "",
            "sessionID": ""
        });

        expect(response.statusCode).to.equal(400);
        expect(response.returnData.errors.includes("Invalid appName")).to.be.true;
        expect(response.returnData.errors.includes("Invalid uuid")).to.be.true;
        expect(response.returnData.errors.includes("Invalid sessionID")).to.be.true;
        expect(response.returnData.errors.includes("Invalid granularitySec")).to.be.true;
        expect(response.returnData.errors.includes("Invalid unixTimestampUTC")).to.be.true;
        expect(response.returnData.errors.includes("Invalid numEventsTotal")).to.be.true;
        expect(response.returnData.errors.includes("Invalid events")).to.be.true;
        expect(response.returnData.errors.length).to.equal(7);
    });

    it('should push to dump file if validation success', async function() {
        let fileUpdated = false;
        onFileEvent(DUMP_FILE_UPDATED_EVENT, ()=>{
            fileUpdated = true;
        });
        const response = await processDataFromClient({
            "schemaVersion": 1,
            "appName": "testApp",
            "uuid": "uuid",
            "sessionID": "session1",
            "granularitySec": 3,
            "unixTimestampUTC": 1643043376,
            "numEventsTotal": 5,
            "events": {}
        });

        await sleep(100);
        expect(response.statusCode).to.equal(200);
        expect(fileUpdated).to.be.true;
        expect(response.returnData.errors.length).to.equal(0);
    });

    it('should get server stats', async function() {
        const response = getServerStats();

        expect(response).to.exist;
    });
});
