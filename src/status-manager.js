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

const ONE_SEC=1000, SECONDS_IN_MINUTE = 60, MINUTES_IN_HOUR = 60, HOUR_IN_DAY = 24;
const NUM_DAYS_TO_KEEP_HISTORY = 360;

let metricMap = {
};

function resetAllMetrics() {
    metricMap = {};
}

function _createDefaultMetricsData() {
    return {
        currentValue: 0,
        secondsWindow: new Array(SECONDS_IN_MINUTE).fill(0),
        secondsCarry: 0,
        minutesWindow: new Array(MINUTES_IN_HOUR).fill(0),
        minutesCarry: 0,
        hoursWindow: new Array(HOUR_IN_DAY).fill(0),
        hoursCarry: 0,
        daysWindow: new Array(NUM_DAYS_TO_KEEP_HISTORY).fill(0)
    };
}

function addMetricCount(metricName, value) {
    if(!metricMap[metricName]){
        metricMap[metricName] = _createDefaultMetricsData();
    }
    metricMap[metricName].currentValue = metricMap[metricName].currentValue + value;
}

function getAllSecondsMetric() {
    let allMetrics ={};
    for(let key of Object.keys(metricMap)){
        allMetrics[key] = metricMap[key].secondsWindow;
    }
    return allMetrics;
}

function getAllMinutesMetric() {
    let allMetrics ={};
    for(let key of Object.keys(metricMap)){
        allMetrics[key] = metricMap[key].minutesWindow;
    }
    return allMetrics;
}

function getAllHoursMetric() {
    let allMetrics ={};
    for(let key of Object.keys(metricMap)){
        allMetrics[key] = metricMap[key].hoursWindow;
    }
    return allMetrics;
}

function getAllDaysMetric() {
    let allMetrics ={};
    for(let key of Object.keys(metricMap)){
        allMetrics[key] = metricMap[key].daysWindow;
    }
    return allMetrics;
}

function _everySecondTimer() {
    for(let key of Object.keys(metricMap)){
        let carry = metricMap[key].secondsWindow.shift();
        metricMap[key].secondsWindow.push(metricMap[key].currentValue);
        metricMap[key].currentValue = 0;
        metricMap[key].secondsCarry = metricMap[key].secondsCarry + carry;
    }
}

function _everyMinuteTimer() {
    for(let key of Object.keys(metricMap)){
        let carry = metricMap[key].minutesWindow.shift();
        metricMap[key].minutesWindow.push(metricMap[key].secondsCarry);
        metricMap[key].secondsCarry = 0;
        metricMap[key].minutesCarry = metricMap[key].minutesCarry + carry;
    }
}

function _everyHourTimer() {
    for(let key of Object.keys(metricMap)){
        let carry = metricMap[key].hoursWindow.shift();
        metricMap[key].hoursWindow.push(metricMap[key].minutesCarry);
        metricMap[key].minutesCarry = 0;
        metricMap[key].hoursCarry = metricMap[key].hoursCarry + carry;
    }
}

function _everyDayTimer() {
    for(let key of Object.keys(metricMap)){
        metricMap[key].daysWindow.shift();
        metricMap[key].daysWindow.push(metricMap[key].hoursCarry);
        metricMap[key].hoursCarry = 0;
    }
}

let intervalSeconds, intervalMinutes, intervalHours, intervalDays;
function setupStatusManagerTimers() {
    if(intervalSeconds){
        clearInterval(intervalSeconds);
    }
    intervalSeconds = setInterval(_everySecondTimer, ONE_SEC);
    if(intervalMinutes){
        clearInterval(intervalMinutes);
    }
    intervalMinutes = setInterval(_everyMinuteTimer, SECONDS_IN_MINUTE*ONE_SEC);
    if(intervalHours){
        clearInterval(intervalHours);
    }
    intervalHours = setInterval(_everyHourTimer, SECONDS_IN_MINUTE*MINUTES_IN_HOUR*ONE_SEC);
    if(intervalDays){
        clearInterval(intervalDays);
    }
    intervalDays = setInterval(_everyDayTimer, SECONDS_IN_MINUTE*MINUTES_IN_HOUR*HOUR_IN_DAY*ONE_SEC);
}
function stopStatusManagerTimers() {
    if(intervalSeconds){
        clearInterval(intervalSeconds);
    }
    if(intervalMinutes){
        clearInterval(intervalMinutes);
    }
    if(intervalHours){
        clearInterval(intervalHours);
    }
    if(intervalDays){
        clearInterval(intervalDays);
    }
    intervalSeconds = null;
    intervalMinutes = null;
    intervalHours = null;
    intervalDays = null;
}


export {
    setupStatusManagerTimers,
    stopStatusManagerTimers,
    resetAllMetrics,
    addMetricCount,
    getAllSecondsMetric,
    getAllMinutesMetric,
    getAllHoursMetric,
    getAllDaysMetric
};
