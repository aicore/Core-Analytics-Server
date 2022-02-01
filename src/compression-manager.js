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
import path from "path";
import util from 'util';
import child_process from 'child_process';
import {ensureDirExists} from "./utils.js";
const exec = util.promisify(child_process.exec);

async function compressFile(filePath) {
    if(!path.isAbsolute(filePath)){
        filePath = path.resolve(filePath);
    }
    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    await ensureDirExists(dirName);
    await fsPromises.stat(filePath); // will throw if file does not exist preventing empty compressed archives
    await exec(`tar -zcvf ${dirName}/${fileName}.tar.gz -C ${dirName} ${fileName}`);
    return `${dirName}/${fileName}.tar.gz`;
}

export {
    compressFile
};
