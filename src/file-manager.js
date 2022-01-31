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
const fsPromises = fs.promises;
import {getNewV1FileName, getUnixTimestampUTCNow, getUTF8StringSizeInBytes, ensureDirExists} from "./utils.js";
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


let appAnalyticsFileHandle = {};
const UTF8 = 'UTF8';

async function _createNewHandleForApp(appName) {
    const dataPath = path.resolve('data');
    const fileName = getNewV1FileName(appName);
    const filePath = `${dataPath}/${fileName}`;
    const startTime = getUnixTimestampUTCNow();
    const fileContent = `{
   "schemaVersion" : 1,
   "unixTimestampUTCAtServer" : ${startTime},
   "clientAnalytics":[\n`;
    await ensureDirExists(dataPath);
    const writableStream = fs.createWriteStream(filePath, {flags:'a'});
    writableStream.write(fileContent, UTF8);
    const handle = {
        fileName: fileName,
        filePath: filePath,
        startTime: startTime,
        writableStream: writableStream,
        bytesWritten: getUTF8StringSizeInBytes(fileContent)
    };
    appAnalyticsFileHandle[appName] = handle;
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
    }
    handle.writableStream.write(`\t${jsonStringData},\n`, UTF8);
    handle.bytesWritten = handle.bytesWritten + getUTF8StringSizeInBytes(jsonStringData);
}

export {
    pushDataForApp,
    getDumpFileToUpload
};
