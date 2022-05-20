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
import cors from 'cors';
import {getServerStats, processDataFromClient} from "./analytics-data-manager.js";
import {setupFileRotationTimers} from "./file-rotation-manager.js";
import {updateSystemGeneratedConfig, getConfig, getSystemGeneratedConfig, getAppConfig} from "./config-manager.js";
import {setupStatusManagerTimers} from "./status-manager.js";

const app = express();
const port = 3000;
const WEB_STATUS_API_ACCESS_TOKEN = "webStatusApiAccessToken";
const QUERY_STRING_TIME_FRAME = "timeFrame";
const WEB_STATUS_APIS_ENABLED = "webStatusApisEnabled";
const ONE_HOUR_IN_MS = 1000*60*60;

let statusIPList = [];

setTimeout(()=>{
    statusIPList = [];
}, ONE_HOUR_IN_MS);

app.use(express.json()); // for parsing application/json
app.use('/', express.static('www'));
app.use(cors({
    methods: ['POST', 'GET']
}));

/*
The status api: If the status API is enabled, it can be accessed via the link
`http://localhost:3000/status?webStatusApiAccessToken=135492efe8&timeFrame=ss`
* `webStatusApiAccessToken` can be found in the `systemGenerated` section in the configuration file.
* `timeFrame` can be one of the strings
   * `ss` (last 60 seconds)
   * `mm` (last 60 minutes)
   * `hh` (last 24 minutes)
   * `dd` (last 360 minutes)
*/
app.get('/status', async function (req, res, _next) {
    let clientIP= req.headers["x-real-ip"] || req.headers['X-Forwarded-For'] || req.socket.remoteAddress;
    if(!statusIPList.includes(clientIP)){
        console.log('status API accessed from IP: ', clientIP);
        statusIPList.push(clientIP);
    }
    if(getConfig(WEB_STATUS_APIS_ENABLED) !== true
        || req.query["webStatusApiAccessToken"] !== getSystemGeneratedConfig(WEB_STATUS_API_ACCESS_TOKEN)){
        res.status(401);
        res.json({error: "Not Authorised to access server status"});
        return;
    }
    res.status(200);
    res.json(getServerStats(req.query[QUERY_STRING_TIME_FRAME]));
});

app.get('/getAppConfig', async function (req, res, _next) {
    let appName = req.query["appName"],
        accountID = req.query["accountID"],
        appConfig = getAppConfig(accountID, appName);
    if(!appName || !accountID){
        res.status(400);
        res.json({error: "Bad Request: Query parameter appName or accountID missing"});
        return;
    }
    res.status(200);
    res.json(appConfig);
});

app.post('/ingest', async function (req, res, _next) {
    let clientIP= req.headers["x-real-ip"] || req.headers['X-Forwarded-For'] || req.socket.remoteAddress;
    req.body["clientIP"] = clientIP;
    const response = await processDataFromClient(req.body);
    res.set({
        'Access-Control-Allow-Origin': '*'
    });
    res.status(response.statusCode);
    res.status(response.statusCode);
    res.json(response.returnData);
});

app.listen(port, () => {
    console.log(`Analytics server listening at http://localhost:${port}`);
});

setupFileRotationTimers();
setupStatusManagerTimers();

updateSystemGeneratedConfig(WEB_STATUS_API_ACCESS_TOKEN, crypto.randomBytes(5).toString('hex'));

process.on('uncaughtException', function(err){
    console.error("uncaught ERR, silently swallowing hoping for the best!!!!",err);
});


export default app;
