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

import express from 'express';
import crypto from 'crypto';
import {getServerStats, processDataFromClient} from "./analytics-data-manager.js";
import {setupFileRotationTimers} from "./file-rotation-manager.js";
import {updateSystemGeneratedConfig, getConfig, getSystemGeneratedConfig} from "./config-manager.js";
import {setupStatusManagerTimers} from "./status-manager.js";

const app = express();
const port = 3000;
const WEB_STATUS_API_ACCESS_TOKEN = "webStatusApiAccessToken";
const QUERY_STRING_TIME_FRAME = "timeFrame";
const WEB_STATUS_APIS_ENABLED = "webStatusApisEnabled";

app.use(express.json()); // for parsing application/json

app.get('/status', async function (req, res, next) {
    if(getConfig(WEB_STATUS_APIS_ENABLED) !== true
        || req.query["webStatusApiAccessToken"] !== getSystemGeneratedConfig(WEB_STATUS_API_ACCESS_TOKEN)){
        res.status(401);
        res.json({error: "Not Authorised to access server status"});
        return;
    }
    res.status(200);
    res.json(getServerStats(req.query[QUERY_STRING_TIME_FRAME]));
});

app.use('/', express.static('www'));

app.post('/ingest', async function (req, res, next) {
    const response = await processDataFromClient(req.body);
    // req.headers["x-real-ip"] || req.headers['X-Forwarded-For'] || request.socket.remoteAddress
    // to get ip address from loadbalancer.
    res.status(response.statusCode);
    res.json(response.returnData);
});

app.listen(port, () => {
    console.log(`Analytics server listening at http://localhost:${port}`);
});

setupFileRotationTimers();
setupStatusManagerTimers();

updateSystemGeneratedConfig(WEB_STATUS_API_ACCESS_TOKEN, crypto.randomBytes(5).toString('hex'));

export default app;
