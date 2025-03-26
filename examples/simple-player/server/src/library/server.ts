// es6 import http://2ality.com/2014/09/es6-modules-final.html

// nodejs
import path from 'path';
import fs from 'fs';

// vendor
import express from 'express';
import type { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import type { SendFileOptions } from 'express-serve-static-core';

// hack because __dirname is not defined
// https://github.com/nodejs/node/issues/16844
// fileURLToPath got added in nodejs v10.12.0
import { fileURLToPath } from 'url';

//declare global  {
interface IImportMeta extends ImportMeta {
    url: string;
}
//}

// Define the contentType function that was missing
function contentType(extension: string): string | false {
    const types: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.ogg': 'audio/ogg',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
    };
    return types[extension] || false;
}

export class Server {

    private application: express.Application;

    constructor() {

        // create a new express.js application
        this.application = express();

    }

    public run(): void {

        const META = import.meta as IImportMeta;
        const DIRNAME = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(META.url));
        const ROOTPATH = path.join(DIRNAME, '..', '..');

        // CORS middleware
        this.application.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
            
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }
            
            next();
        });

        this.application.use('/client', express.static(ROOTPATH + '/../client/build'));
        this.application.use('/dist', express.static(ROOTPATH + '/../../../dist'));
        this.application.use('/static', express.static(ROOTPATH + '/../../../assets'));

        // streaming songs
        this.application.get('/music/:song', (request: ExpressRequest, response: ExpressResponse) => {

            const fullPath = ROOTPATH + '/../../../assets/music/' + request.params.song
            const size = fs.statSync(fullPath).size

            if (request.method === 'HEAD') {
                response.statusCode = 200
                response.setHeader("accept-ranges", "bytes")
                response.setHeader("content-length", size)
                response.end()
            }

            const range = request.headers.range
            let start, end, contentLength

            if (typeof range !== 'undefined') {
                const bytesPrefix = "bytes=";
                if (range.startsWith(bytesPrefix)) {
                    const bytesRange = range.substring(bytesPrefix.length)
                    const parts = bytesRange.split('-')
                    if (parts.length === 2) {
                        const rangeStart = parts[0] && parts[0].trim()
                        if (rangeStart) {
                            start = parseInt(rangeStart)
                        }
                        const rangeEnd = parts[1] && parts[1].trim()
                        if (rangeEnd && rangeEnd.length > 0) {
                            end = parseInt(rangeEnd)
                        } else {
                            const chunkSize = 1 * 1e6  //  1MB
                            end = Math.min(start + chunkSize, size - 1)
                        }
                    }
                }
            } else {
                // no range, so this handle it as a static file request
                contentLength = size
            }

            const extension = path.extname(fullPath)
            const mimeType = contentType(extension)

            contentLength = end - start + 1

            if (mimeType !== false) {

                if (typeof range !== 'undefined') {

                    const headers = {
                        'Content-Range': `bytes ${start}-${end}/${size}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': contentLength,
                        'Content-Type': mimeType,
                    }

                    response.writeHead(206, headers)

                    const stream = fs.createReadStream(fullPath, { start, end })

                    stream.pipe(response);

                } else {

                    response.sendFile(path.resolve(fullPath), {
                        headers: {
                            'Content-Type': mimeType,
                            'Content-Length': contentLength
                        }
                    });

                }

            } else {
                response.status(415).send();
            }

        })

        this.application.get('/', (request: ExpressRequest, response: ExpressResponse) => {

            if (request.method === 'GET') {
                // options list: http://expressjs.com/en/api.html#res.sendFile
                const mainPageSendfileOptions: SendFileOptions = {
                    root: path.join(ROOTPATH, '..', 'html'),
                    dotfiles: 'deny',
                    headers: {
                        'x-timestamp': Date.now(),
                        'x-sent': true
                    }
                };

                response.sendFile('main.html', mainPageSendfileOptions);
            }

        });

        const port = process.env.PORT || 35000;

        // Try to start the server, with fallback ports if the main one is in use
        this.application.listen(port, () => console.log(`Server listening on port ${port}!`))
            .on('error', (error: Error) => {
                if (error.message.includes('EADDRINUSE')) {
                    console.log(`Port ${port} is in use`);
                } else {
                    console.error('Server error:', error);
                }
            });

    }

}
