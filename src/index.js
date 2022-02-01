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
import {processDataFromClient} from "./analytics-data-manager.js";

const app = express();
const port = 3000;

app.use(express.json()); // for parsing application/json

app.post('/ingest', async function (req, res, next) {
    const response = await processDataFromClient(req.body);
    res.status(response.statusCode);
    res.json(response.returnData);
});

app.listen(port, () => {
    console.log(`Analytics server listening at http://localhost:${port}`);
});

export default app;
