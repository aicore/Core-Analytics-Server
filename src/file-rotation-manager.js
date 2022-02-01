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

import {onConfigEvent, CONFIG_CHANGED_EVENT, getConfig} from "./config-manager.js";
import {getAllAppNames, getDumpFileToUpload, onFileEvent, DUMP_FILE_UPDATED_EVENT} from "./file-manager.js";
import {compressFile} from "./compression-manager.js";
import {deleteFile} from "./utils.js";
import events from "events";

const ALL_DUMPS_ROTATED_EVENT = 'ALL_DUMPS_ROTATED';
const APP_DUMP_ROTATED_EVENT = 'APP_DUMP_ROTATED';
const eventEmitter = new events();

function onFileRotationEvent(eventType, cbFn) {
    eventEmitter.on(eventType, cbFn);
}

let rotateDumpFiles = {
    maxFileSizeBytes: 100000000,
    rotateInEveryNSeconds: 600,
    storage: {
        destination: "none",
        accessKeyId: "LinodeAccessKeyId",
        secretAccessKey: "LinodeSecretAccessKey",
        region: "LinodeRegion",
        bucket: "LinodeBucket"
    }
};

let interval = null;

async function rotateAllDumpFiles(){
    let appNames = getAllAppNames();
    for (let appName of appNames){
        await _rotateDumpFile(appName);
    }
    if(appNames.length > 0){
        eventEmitter.emit(ALL_DUMPS_ROTATED_EVENT);
    }
}

function isLocalDestination() {
    return rotateDumpFiles.storage.destination === "none";
}

async function _rotateDumpFile(appName) {
    let appFileHandle = await getDumpFileToUpload(appName);
    if(appFileHandle){
        let compressedFilePath = await compressFile(appFileHandle.filePath);
        // upload file to object storage
        await deleteFile(appFileHandle.filePath);
        if(!isLocalDestination()){
            await deleteFile(compressedFilePath);
        }
    }
    eventEmitter.emit(APP_DUMP_ROTATED_EVENT, appFileHandle);
}

async function _refreshRotationConfig() {
    rotateDumpFiles = getConfig('rotateDumpFiles') || rotateDumpFiles;
    await setupFileRotationTimers();
}

onConfigEvent(CONFIG_CHANGED_EVENT, async ()=>{
    await _refreshRotationConfig();
});

onFileEvent(DUMP_FILE_UPDATED_EVENT, async (handle)=>{
    if(handle.bytesWritten >= rotateDumpFiles.maxFileSizeBytes){
        await _rotateDumpFile(handle.appName);
    }
});

async function setupFileRotationTimers() {
    if(interval){
        clearInterval(interval);
    }
    interval = setInterval(rotateAllDumpFiles, rotateDumpFiles.rotateInEveryNSeconds * 1000);
    await rotateAllDumpFiles();
}

async function stopFileRotationTimers() {
    if(interval){
        clearInterval(interval);
    }
    interval = null;
    await rotateAllDumpFiles();
}

export {
    setupFileRotationTimers,
    stopFileRotationTimers,
    onFileRotationEvent,
    rotateAllDumpFiles,
    ALL_DUMPS_ROTATED_EVENT,
    APP_DUMP_ROTATED_EVENT
};
