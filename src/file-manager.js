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
import {getNewV1FileName, getUnixTimestampUTCNow, getUTF8StringSizeInBytes, ensureDirExistsSync} from "./utils.js";
import path from "path";

// // file Schema sample , see https://github.com/aicore/Core-Analytics-Server/wiki#analytics-backend
// {
//     "schemaVersion" : 1,
//     "unixTimestampUTCAtServer" : 1643043376,
//     "clientAnalytics":[
//     {"schemaVersion":1,...},
//     {"schemaVersion":1,...},
// ]
// }

import events from "events";

const DUMP_FILE_UPDATED_EVENT = 'DUMP_FILE_UPDATED_EVENT';
const eventEmitter = new events();

function onFileEvent(eventType, cbFn) {
    eventEmitter.on(eventType, cbFn);
}

let appAnalyticsFileHandle = {};
const UTF8 = 'UTF8';

async function _createNewHandleForApp(appName) {
    const dataPath = path.resolve('data');
    const fileNameDetails = getNewV1FileName(appName);
    const fileName = fileNameDetails.fileName;
    const filePath = `${dataPath}/${fileName}`;
    const startTime = getUnixTimestampUTCNow();
    const fileContent = `{
   "appName": "${appName}",
   "schemaVersion" : 1,
   "unixTimestampUTCAtServer" : ${startTime},
   "clientAnalytics":[\n`;
    await ensureDirExistsSync(dataPath);
    const writableStream = fs.createWriteStream(filePath, {flags:'a'});
    writableStream.write(fileContent, UTF8);
    const handle = {
        appName: appName,
        fileName: fileName,
        year: fileNameDetails.year,
        month: fileNameDetails.month,
        day: fileNameDetails.day,
        filePath: filePath,
        startTime: startTime,
        writableStream: writableStream,
        bytesWritten: getUTF8StringSizeInBytes(fileContent)
    };
    appAnalyticsFileHandle[appName] = handle;
    eventEmitter.emit(DUMP_FILE_UPDATED_EVENT, handle);
    return handle;
}

async function getDumpFileToUpload(appName) {
    return new Promise((resolve, reject) => {
        let handle = appAnalyticsFileHandle[appName];
        if(!handle){
            resolve();
        }
        delete appAnalyticsFileHandle[appName];
        const endTime = getUnixTimestampUTCNow();
        handle.writableStream.end(`\t{"endTime": ${endTime}}]\n}`, UTF8, ()=>{
            resolve(handle);
        });
    });
}

async function pushDataForApp(appName, jsonStringData) {
    let handle = appAnalyticsFileHandle[appName];
    if(!handle){
        handle = await _createNewHandleForApp(appName);
        appAnalyticsFileHandle[appName] = handle;
    }
    handle.writableStream.write(`\t${jsonStringData},\n`, UTF8);
    handle.bytesWritten = handle.bytesWritten + getUTF8StringSizeInBytes(jsonStringData);
    eventEmitter.emit(DUMP_FILE_UPDATED_EVENT, handle);
}

function getAllAppNames() {
    return Object.keys(appAnalyticsFileHandle);
}

export {
    pushDataForApp,
    getDumpFileToUpload,
    getAllAppNames,
    onFileEvent,
    DUMP_FILE_UPDATED_EVENT
};
