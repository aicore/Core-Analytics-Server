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

// Refer https://github.com/aicore/Core-Analytics-Server/wiki for Architecture
// Schema
// {
//     "schemaVersion" : 1,
//     "appName" : "app1",
//     "uuid": "u1",
//     "sessionID": "s1",
//     "granularitySec" : 3,
//     "unixTimestampUTC" : 1643043376,
//     "events":{
//     "eventType":{
//         "category":{
//             "subCategory": {
//                 "t": [0,3],
//                     "v": [1,[1,3]],
//                     "c": [23,2]
//             }
//         }
//     }
// }
// }

import {getConfig} from "./config-manager.js";
import {pushDataForApp} from "./file-manager.js";
import {getAllSecondsMetric, addMetricCount} from "./status-manager.js";

function _getSuccessResponse() {
    return {
        statusCode: 200,
        returnData: {
            "accepted": "ok",
            "serverBusy": false,
            "errors": []
        }
    };
}

function _getFailureResponse(statusCode, errorsArray) {
    return {
        statusCode: statusCode,
        returnData: {
            "accepted": "no",
            "serverBusy": false,
            "errors": errorsArray
        }
    };
}

function isAllowedAppName(appName) {
    const allowedAppNames = getConfig("allowedAppNames");
    if(appName && allowedAppNames.includes("*") || allowedAppNames.includes(appName)){
        return true;
    }
    return false;
}

function validateInput(clientData) {
    let errors = [];
    if(clientData["schemaVersion"] !== 1){
        errors.push("Invalid_schemaVersion");
    }
    if(!isAllowedAppName(clientData["appName"])){
        errors.push("Invalid_appName");
    }
    if(!clientData["uuid"]){
        errors.push("Invalid_uuid");
    }
    if(!clientData["sessionID"]){
        errors.push("Invalid_sessionID");
    }
    if(!clientData["granularitySec"]){
        errors.push("Invalid_granularitySec");
    }
    if(!clientData["unixTimestampUTC"]){
        errors.push("Invalid_unixTimestampUTC");
    }
    if(!clientData["numEventsTotal"]){
        errors.push("Invalid_numEventsTotal");
    }
    if(!clientData["events"]){
        errors.push("Invalid_events");
    }
    return errors;
}

function getServerStats(timeFrame) {
    if(!timeFrame) {
        return getAllSecondsMetric();
    }
}

function _updateServerStats(clientData) {
    addMetricCount(`${clientData["appName"]}.numEventsTotal`, clientData["numEventsTotal"]);
}

function _updateServerErrorStats(appName, errorList) {
    if(errorList.length > 0){
        addMetricCount(`${appName}.totalErrors`, errorList.length);
    }
    for(let error of errorList){
        addMetricCount(`${appName}.${error}`, 1);
    }
}

async function processDataFromClient(clientData) {
    const errors = validateInput(clientData);
    _updateServerErrorStats(clientData["appName"], errors);
    addMetricCount(`${clientData["appName"]}.totalNumPostRequests`, 1);
    if(errors.length === 0){
        await pushDataForApp(clientData["appName"], JSON.stringify(clientData));
        _updateServerStats(clientData);
        return _getSuccessResponse();
    }
    return _getFailureResponse(400, errors);
}

export {
    processDataFromClient,
    getServerStats
};
