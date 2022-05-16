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
/*global describe, it*/

import * as chai from 'chai';
import {deleteFile, getNewV1FileName, getUTF8StringSizeInBytes} from "../../src/utils.js";

let expect = chai.expect;

describe('util Tests', function() {
    it('Should get correct file name of format: AppName.yyyy-mm-dd-hh-mm-ss.ms.v1.json', function() {
        let fileNameObject = getNewV1FileName("testApp");
        const fileName = fileNameObject.fileName,
            year = fileNameObject.year,
            month = fileNameObject.month,
            day = fileNameObject.day;
        expect(fileName).to.be.a('string');
        expect(year).to.be.a('string');
        expect(month).to.be.a('string');
        expect(day).to.be.a('string');
        expect(fileName.startsWith("testApp")).to.be.true;
        expect(fileName.endsWith(".v1.json")).to.be.true;
        expect(fileName.split("-").length).to.equal(7);
    });

    it('Should get compute correct utf8 string size in bytes', function() {
        let byteSize = getUTF8StringSizeInBytes("testApp");
        expect(byteSize).to.equal(7);
    });

    it('Should return false if delete file failed', async function() {
        let deleteStatus = await deleteFile('nonExistentFile');
        expect(deleteStatus).to.be.false;
    });
});

