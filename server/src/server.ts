// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/example-express-composition
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {NoteApplication} from './application';
import {ApplicationConfig} from '@loopback/core';
import {Request, Response} from 'express';
import * as express from 'express';
import * as path from 'path';
import pEvent from 'p-event';
import * as http from 'http';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
const proxy = require('http-proxy-middleware');
import {config} from './config';

export class ExpressServer {
  private app: express.Application;
  public readonly lbApp: NoteApplication;
  private server: http.Server;

  constructor(options: ApplicationConfig = {}) {
    this.app = express();
    this.lbApp = new NoteApplication(options);
    this.app.use(
      cors({
        exposedHeaders: [
          'Content-Length',
          'x-paging-count',
          'x-paging-page',
          'x-paging-pages',
          'x-paging-size',
        ],
      }),
    );

    var proxyReq = function(proxyReq: any, req: any, res: any, options: any) {
      if (req.body) {
        let bodyData = JSON.stringify(req.body);
        const headers = req.headers;
        // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
        proxyReq.setHeader('Content-Type', 'application/json');
        //proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        if (headers['token']) {
          proxyReq.setHeader('Authorization', headers['token']);
        }
        // stream the content
        proxyReq.write(bodyData);
      }
    };

    var proxyRes = function(proxyRes: any, req: any, res: any, options: any) {};
    // proxy middleware options
    const adminProxyOptions = {
      target: config.apiAdminUrl, // target host
      changeOrigin: true, // needed for virtual hosted sites
      ws: true, // proxy websockets
      secure: false,
      onProxyReq: proxyReq,
      onProxyRes: proxyRes,
      pathRewrite: {
        '^/api': '/api/admin', // rewrite path
      },
      // router: {
      //   // when request.headers.host == 'dev.localhost:3000',
      //   // override target 'http://www.example.org' to 'http://localhost:8000'
      //   'localhost:3200': 'http://localhost:8000',
      // },
    };

    const memberProxyOptions = {
      target: config.apiAdminUrl, // target host
      changeOrigin: true, // needed for virtual hosted sites
      ws: true, // proxy websockets
      secure: false,
      onProxyReq: proxyReq,
      pathRewrite: {
        '^/api-m': '/api', // rewrite path
      },
      // router: {
      //   // when request.headers.host == 'dev.localhost:3000',
      //   // override target 'http://www.example.org' to 'http://localhost:8000'
      //   'localhost:3200': 'http://localhost:8000',
      // },
    };

    const assetsProxyOptions = {
      target: config.apiResourceUrl, // target host
      changeOrigin: true, // needed for virtual hosted sites
      ws: true, // proxy websockets
      onProxyRes: proxyRes,
      secure: false,
      proxyTimeout: 30000,
      pathRewrite: {
        '^/resources': '/', // rewrite path
      },
      // router: {
      //   // when request.headers.host == 'dev.localhost:3000',
      //   // override target 'http://www.example.org' to 'http://localhost:8000'
      //   'localhost:3200': 'http://localhost:8000',
      // },
    };

    // create the proxy (without context)
    const adminServerProxy = proxy(adminProxyOptions);
    // const memberServerProxy = proxy(memberProxyOptions);
    const assetsServerProxy = proxy(assetsProxyOptions);

    const isMultipartRequest = (req: any) => {
      let contentTypeHeader = req.headers['content-type'];
      return contentTypeHeader && contentTypeHeader.indexOf('multipart') > -1;
    };

    const bodyParserJsonMiddleware = function() {
      return (req: any, res: any, next: any) => {
        if (isMultipartRequest(req)) {
          return next();
        }
        return bodyParser.json()(req, res, next);
      };
    };

    this.app.use(bodyParserJsonMiddleware()); // to support JSON-encoded bodies
    this.app.use(
      bodyParser.urlencoded({
        // to support URL-encoded bodies
        extended: true,
      }),
    );

    this.app.use('/resources', assetsServerProxy);

    this.app.use('/api', adminServerProxy);

    // this.app.use('/api-m', memberServerProxy);

    // Expose the front-end assets via Express, not as LB4 route
    // this.app.use('/api-lc', this.lbApp.requestHandler);

    // this.app.post('/login/account', function(_req: Request, res: Response) {
    //   const data = _req.body;
    //   if (
    //     !(data.userName === 'admin' || data.userName === 'user') ||
    //     data.password !== 'admin'
    //   ) {
    //     return {msg: `Invalid username or password（admin/admin）`};
    //   }
    //
    //   res.json({
    //     msg: 'ok',
    //     user: {
    //       token: '123456789',
    //       name: data.userName,
    //       email: `${data.userName}@qq.com`,
    //       id: 10000,
    //       time: +new Date(),
    //     },
    //   });
    // });

    // Custom Express routes
    this.app.get('/', function(_req: Request, res: Response) {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    // this.app.get('/hello', function(_req: Request, res: Response) {
    //   res.send('Hello world!');
    // });

    // Serve static files in the public folder
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  public async boot() {
    await this.lbApp.boot();
  }

  public async start() {
    const port = this.lbApp.restServer.config.port || 3200;

    /* remove host address because it does not work on cluster and virtual environment
    const host = this.lbApp.restServer.config.host || '127.0.0.1';
    this.server = this.app.listen(port, host);
    */

    this.server = this.app.listen(port);
    await pEvent(this.server, 'listening');
  }

  // For testing purposes
  public async stop() {
    if (!this.server) return;
    this.server.close();
    await pEvent(this.server, 'close');
  }
}
