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
import path from "path";
import {getNewV1FileName} from "../../src/utils.js";
import {compressFile} from "../../src/compression-manager.js";
import {fileCanBeRead} from "./test-utils.js";
import {deleteFile} from "../../src/utils.js";

let expect = chai.expect;

describe('compression-manager.js Tests', function() {
    it('Should throw error if no file to compress', async function() {
        let fileName = getNewV1FileName("testApp");
        let compressedFileName = `${fileName}.tar.gz`;
        let err = null;
        try{
            await compressFile(fileName);
        } catch (error) {
            err = error;
        }
        expect(err).to.be.not.null;
        expect(await fileCanBeRead(compressedFileName)).to.be.false;
    });

    it('Should compress valid file with relative path', async function() {
        let fileName = 'package.json';
        let expectedCompressedFileName = path.resolve(`${fileName}.tar.gz`);
        let compressedFileName = "";
        let err = null;
        await deleteFile(expectedCompressedFileName);
        try{
            compressedFileName = await compressFile(fileName);
        } catch (error) {
            err = error;
        }
        expect(err).to.be.null;
        expect(compressedFileName).to.equal(expectedCompressedFileName);
        expect(await fileCanBeRead(compressedFileName)).to.be.true;
        expect(await deleteFile(compressedFileName)).to.be.true;
    });

    it('Should compress valid file with absolute path', async function() {
        let absoluteFilePath = path.resolve('package.json');
        let compressedFileName = "";
        let err = null;
        try{
            compressedFileName = await compressFile(absoluteFilePath);
        } catch (error) {
            err = error;
        }
        expect(err).to.be.null;
        expect(await fileCanBeRead(compressedFileName)).to.be.true;
        expect(await deleteFile(compressedFileName)).to.be.true;
    });
});
