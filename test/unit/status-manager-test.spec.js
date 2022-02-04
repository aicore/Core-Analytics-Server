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
/*global describe, it, beforeEach, afterEach*/

import * as chai from 'chai';
import * as FakeTimers from '@sinonjs/fake-timers';
import {
    setupStatusManagerTimers,
    stopStatusManagerTimers,
    addMetricCount,
    getAllSecondsMetric,
    getAllMinutesMetric,
    resetAllMetrics,
    getAllHoursMetric,
    getAllDaysMetric
} from "../../src/status-manager.js";
let expect = chai.expect;

describe('status-manager.js Tests', function() {
    let clock;
    beforeEach(async function () {
        clock = FakeTimers.install();
        setupStatusManagerTimers();
    });
    afterEach(async function () {
        clock.uninstall();
        stopStatusManagerTimers();
        resetAllMetrics();
    });

    it('should add seconds metrics', async function() {
        for(let i=0; i<60; i++){
            addMetricCount("test", 2);
            addMetricCount("yo", 1);
            await clock.tickAsync(500);
        }

        let allSecondsMetrics = getAllSecondsMetric();
        expect(allSecondsMetrics["test"].filter(val => val === 4).length).to.be.equal(30);
        expect(allSecondsMetrics["yo"].filter(val => val === 2).length).to.be.equal(30);
    });

    it('should get minutes metrics', async function() {
        for(let i=0; i<60*31; i++){
            addMetricCount("test", 2);
            addMetricCount("yo", 1);
            await clock.tickAsync("1");
        }

        let allMinutesMetrics = getAllMinutesMetric();
        expect(allMinutesMetrics["test"].filter(val => val === 120).length).to.be.equal(30);
        expect(allMinutesMetrics["yo"].filter(val => val === 60).length).to.be.equal(30);
    });

    it('should get hours metrics', async function() {
        for(let i=0; i<60*10; i++){
            addMetricCount("test", 2);
            addMetricCount("yo", 1);
            await clock.tickAsync("59");
        }

        let allHoursMetrics = getAllHoursMetric();
        expect(allHoursMetrics["test"].filter(val => val === 0).length).to.be.equal(16);
        expect(allHoursMetrics["yo"].filter(val => val === 0).length).to.be.equal(16);
    });

    it('should get days metrics', async function() {
        for(let i=0; i<24*3; i++){
            addMetricCount("test", 2);
            addMetricCount("yo", 1);
            await clock.tickAsync("01:00:00");
        }

        let allDaysMetrics = getAllDaysMetric();
        expect(allDaysMetrics["test"].filter(val => val === 0).length).to.be.equal(360-2);
        expect(allDaysMetrics["yo"].filter(val => val === 0).length).to.be.equal(360-2);
    }).timeout(10000);
});
