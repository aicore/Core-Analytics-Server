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
import {getNewV1FileName} from "../../src/utils.js";

let expect = chai.expect;

describe('util Tests', function() {
    it('Should get correct file name of format: AppName.yyyy-mm-dd-hh-mm-ss.ms.v1.json', function() {
        let fileName = getNewV1FileName("testApp");
        expect(fileName).to.be.a('string');
        expect(fileName.startsWith("testApp")).to.be.true;
        expect(fileName.endsWith(".v1.json")).to.be.true;
        expect(fileName.split("-").length).to.equal(7);
    });
});
