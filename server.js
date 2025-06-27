import { on } from 'events';
import { ChatConversationalAgentOutputParserWithRetries } from 'langchain/agents';

import express from 'express';
import cluster from 'cluster';
import bodyParser from 'body-parser';
import { Authorization, Redirect } from './authHelper.js';

import "dotenv/config";

var port = 5173;

var cCPUs = 1;

if (cluster.isMaster) {
    for (var i = 0; i < cCPUs; i++) {
        cluster.fork();
    }

    cluster.on('online', function (worker) {
        console.log('Worker' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function (worker, code, signal) {
        console.log('Worker' + worker.process.pid + ' died');
    });

} else {
    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.listen(port);

    app.get('/api/linkedin/authorize', (req, res) => {
        console.log("starting authorization");
        const result = res.redirect(Authorization());
        console.log(result)
        return result;
    });

    app.get('/linkedincallback', async(req, res) => {
        console.log('Authorization code:', req.query.code);
        const redirect_result = await Redirect(req.query.code);
        console.log(redirect_result);
        return res.json(redirect_result);
    });
}