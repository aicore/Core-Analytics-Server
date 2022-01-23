/* istanbul ignore file */

import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Analytics server listening at http://localhost:${port}`);
});

export default app;
