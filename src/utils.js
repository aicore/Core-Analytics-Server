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

// file name is of the format AppName.yyyy-mm-dd-hh-mm-ss.ms.v1.json
function getNewV1FileName(appName) {
    const now = new Date(Date.now()),
        year = `${now.getUTCFullYear()}`,
        month = `${now.getUTCMonth()+1}`,
        day = `${now.getUTCDate()}`;
    let fileName = `${appName}.${year}-${month}-${now.getUTCDate()}-${now.getUTCHours()}` +
        `-${now.getUTCMinutes()}-${now.getUTCSeconds()}-${now.getUTCMilliseconds()}.v1.json`;
    return {
        fileName,
        year,
        month,
        day
    };
}

function getUnixTimestampUTCNow() {
    return Date.now();
}

async function writeAsJson(fileName, jsObject) {
    let jsonString = JSON.stringify(jsObject, null, '  ' );
    await fsPromises.writeFile(fileName, jsonString, 'utf8');
}

async function readTextFile(fileName) {
    return fsPromises.readFile(fileName, 'utf8');
}

async function readJsonFile(fileName) {
    return JSON.parse(await fsPromises.readFile(fileName, 'utf8'));
}

function ensureDirExistsSync(path) {
    fs.mkdirSync(path, { recursive: true });
}

function getUTF8StringSizeInBytes(str) {
    return Buffer.byteLength(str, 'utf8');
}

async function deleteFile(fileName) {
    try {
        await fsPromises.unlink(fileName);
        return true;
    }catch (e) {
        return false;
    }
}

export {
    getNewV1FileName,
    getUnixTimestampUTCNow,
    ensureDirExistsSync,
    readJsonFile,
    readTextFile,
    writeAsJson,
    deleteFile,
    getUTF8StringSizeInBytes
};
