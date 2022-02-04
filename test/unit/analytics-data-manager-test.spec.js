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
/*global describe, it, after, beforeEach, afterEach*/

import * as chai from 'chai';
import {processDataFromClient, getServerStats} from "../../src/analytics-data-manager.js";
import {onFileEvent, DUMP_FILE_UPDATED_EVENT} from "../../src/file-manager.js";
import {rmrf, sleep} from "./test-utils.js";
import * as FakeTimers from "@sinonjs/fake-timers";
import {resetAllMetrics, setupStatusManagerTimers, stopStatusManagerTimers} from "../../src/status-manager.js";

let expect = chai.expect;

describe('analytics-data-manager.js Tests', function() {
    let clock;
    beforeEach(async function () {
        resetAllMetrics();
    });
    afterEach(async function () {
        if(clock){
            clock.uninstall();
            stopStatusManagerTimers();
            resetAllMetrics();
            clock = null;
        }
    });

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
        expect(response.returnData.errors.includes("Invalid_schemaVersion")).to.be.true;
        expect(response.returnData.errors.length).to.equal(1);
    });

    it('should fail validation if required fields is not present or empty', async function() {
        const response = await processDataFromClient({
            "schemaVersion": 1,
            "uuid": "",
            "sessionID": ""
        });

        expect(response.statusCode).to.equal(400);
        expect(response.returnData.errors.includes("Invalid_appName")).to.be.true;
        expect(response.returnData.errors.includes("Invalid_uuid")).to.be.true;
        expect(response.returnData.errors.includes("Invalid_sessionID")).to.be.true;
        expect(response.returnData.errors.includes("Invalid_granularitySec")).to.be.true;
        expect(response.returnData.errors.includes("Invalid_unixTimestampUTC")).to.be.true;
        expect(response.returnData.errors.includes("Invalid_numEventsTotal")).to.be.true;
        expect(response.returnData.errors.includes("Invalid_events")).to.be.true;
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

    it('should get server error stats with default seconds statistics', async function() {
        clock = FakeTimers.install();
        setupStatusManagerTimers();
        const sampleData = {
            "schemaVersion": 1,
            "appName": "testApp",
            "uuid": "uuid",
            "sessionID": "session1",
            "granularitySec": 3,
            "unixTimestampUTC": 1643043376
        };
        await processDataFromClient(sampleData);
        await processDataFromClient(sampleData);
        await clock.tickAsync("1");
        await processDataFromClient(sampleData);
        await clock.tickAsync("1");

        const response = getServerStats();
        expect(response).to.exist;
        let timeArray = response['testApp.totalNumPostRequests'];
        expect(timeArray[timeArray.length-1]).to.equal(1);
        expect(timeArray[timeArray.length-2]).to.equal(2);
        timeArray = response['testApp.totalErrors'];
        expect(timeArray[timeArray.length-1]).to.equal(2);
        timeArray = response['testApp.Invalid_numEventsTotal'];
        expect(timeArray[timeArray.length-1]).to.equal(1);
        timeArray = response['testApp.Invalid_events'];
        expect(timeArray[timeArray.length-1]).to.equal(1);
    });
});
