// es6 import http://2ality.com/2014/09/es6-modules-final.html

// nodejs
import path from 'path';
import fs from 'fs';

// vendor
import express from 'express';
import { contentType } from 'mime-types';

// hack because __dirname is not defined
// https://github.com/nodejs/node/issues/16844
// fileURLToPath got added in nodejs v10.12.0
import { fileURLToPath } from 'url';

//declare global  {
interface IImportMeta extends ImportMeta {
    url: string;
}
//}

export class Server {

    private application: express.Application;

    constructor() {

        // create a new expressjs application
        this.application = express();

    }

    public run(): void {

        const META = import.meta as IImportMeta;
        const DIRNAME = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(META.url));
        const ROOTPATH = path.join(DIRNAME, '..', '..');

        this.application.use('/client', express.static(ROOTPATH + '/../client/build'));
        this.application.use('/dist', express.static(ROOTPATH + '/../../../dist'));

        // streaming songs
        this.application.get('/streaming/music/:song', (request: express.Request, response: express.Response) => {

            const range = request.headers.range || '0'
            const fullPath = ROOTPATH + '/../../../assets/music/' + request.params.song
            const size = fs.statSync(fullPath).size
            const extension = path.extname(fullPath)
            const mimeType = contentType(extension)
            const chunkSize = 1 * 1e6  //  1MB
            const start = Number(range.replace(/\D/g, ''))
            const end = Math.min(start + chunkSize, size - 1)
            const contentLength = end - start + 1

            if (mimeType !== false) {

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
                response.status(415).send();
            }

        })

        // static songs
        this.application.use('/static/music', express.static(ROOTPATH + '/../../../assets/music'));

        this.application.get('/', (request: express.Request, response: express.Response) => {

            // options list: http://expressjs.com/en/api.html#res.sendFile
            const mainPageSendfileOptions = {
                root: path.join(ROOTPATH, '..', 'html'),
                dotfiles: 'deny',
                headers: {
                    'x-timestamp': Date.now(),
                    'x-sent': true
                }
            };

            response.sendFile('main.html', mainPageSendfileOptions);

        });

        const port = process.env.PORT || 35000;

        this.application.listen(port, () => console.log(`Example app listening on port ${port}!`));

    }

}
