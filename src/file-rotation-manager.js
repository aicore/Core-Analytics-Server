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
import linodeModule from '@aicore/linode-object-storage-lib';

const UPLOAD_RETRY_TIME_SECONDS = 30;
const ALL_DUMPS_ROTATED_EVENT = 'ALL_DUMPS_ROTATED_EVENT';
const APP_DUMP_ROTATED_EVENT = 'APP_DUMP_ROTATED_EVENT';
const UPLOAD_RETRIED_EVENT = 'UPLOAD_RETRIED_EVENT';
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
let uploadRetryQueue = [];
let interval = null;
let uploadRetryInterval = null;

async function rotateAllDumpFiles(){
    let appNames = getAllAppNames();
    for (let appName of appNames){
        await _rotateDumpFile(appName);
    }
    if(appNames.length > 0){
        eventEmitter.emit(ALL_DUMPS_ROTATED_EVENT);
    }
}

function _isLocalDestination() {
    return rotateDumpFiles.storage.destination === "local";
}

function _isLinodeStore() {
    return rotateDumpFiles.storage.destination === "linode";
}

function _isNoneDestination() {
    return rotateDumpFiles.storage.destination === "none";
}

async function _uploadToLinode(filePath) {
    try {
        await linodeModule.uploadFileToLinodeBucket(
            rotateDumpFiles.storage.accessKeyId,
            rotateDumpFiles.storage.secretAccessKey,
            rotateDumpFiles.storage.region,
            filePath,
            rotateDumpFiles.storage.bucket
        );
    } catch (e) {
        uploadRetryQueue.unshift(filePath);
        console.error(`file upload to linode failed for ${filePath}, 
        will retry in ${rotateDumpFiles.storage.uploadRetryTimeSecs}S`, e);
    }
}

function _logFileHandleDetails(handle) {
    console.log("rotating dump file: ", {
        appName: handle.appName,
        fileName: handle.fileName,
        filePath: handle.filePath,
        startTime: handle.startTime,
        uncompressedFileSize: handle.bytesWritten
    });
}

async function _rotateDumpFile(appName) {
    let appFileHandle = await getDumpFileToUpload(appName);
    _logFileHandleDetails(appFileHandle);
    if(appFileHandle){
        let compressedFilePath = await compressFile(appFileHandle.filePath);
        await deleteFile(appFileHandle.filePath);
        if(_isLinodeStore()){
            await _uploadToLinode(compressedFilePath);
            console.log(`Uploaded file ${compressedFilePath} to linode`);
            await deleteFile(compressedFilePath);
        } else if(_isNoneDestination()){
            await deleteFile(compressedFilePath);
            console.log(`Deleted file ${compressedFilePath} as 'none' destination is specified`);
        } else if(!_isLocalDestination()){
            console.error(`unknown storage destination for ${appFileHandle.filePath}: appName:`,
                rotateDumpFiles.storage.destination);
        }
    }
    eventEmitter.emit(APP_DUMP_ROTATED_EVENT, appFileHandle);
}

async function _refreshRotationConfig() {
    rotateDumpFiles = getConfig('rotateDumpFiles') || rotateDumpFiles;
    rotateDumpFiles.storage.uploadRetryTimeSecs = rotateDumpFiles.storage.uploadRetryTimeSecs
        || UPLOAD_RETRY_TIME_SECONDS;
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

    if(uploadRetryInterval){
        clearInterval(uploadRetryInterval);
    }
    uploadRetryInterval = setInterval(async ()=>{
        if(uploadRetryQueue.length > 0){
            await _uploadToLinode(uploadRetryQueue.pop());
            eventEmitter.emit(UPLOAD_RETRIED_EVENT);
        }
    }, rotateDumpFiles.storage.uploadRetryTimeSecs * 1000);

    await rotateAllDumpFiles();
}

async function stopFileRotationTimers() {
    if(interval){
        clearInterval(interval);
    }
    if(uploadRetryInterval){
        clearInterval(uploadRetryInterval);
    }
    interval = null;
    uploadRetryInterval = null;
    await rotateAllDumpFiles();
}

export {
    setupFileRotationTimers,
    stopFileRotationTimers,
    onFileRotationEvent,
    rotateAllDumpFiles,
    UPLOAD_RETRIED_EVENT,
    ALL_DUMPS_ROTATED_EVENT,
    APP_DUMP_ROTATED_EVENT
};
