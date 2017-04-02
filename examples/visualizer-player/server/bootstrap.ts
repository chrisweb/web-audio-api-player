

'use strict';

// vendor
import * as express from 'express';

// nodejs
import * as path from 'path';

export default class Bootsrtrap {

    private application: express.Application;

    constructor() {

        // create a new expressjs application
        this.application = express();

    }

    public run() {

        let buildRoot = __dirname + '/..';

        this.application.use('/javascripts', express.static(buildRoot + '/client'));
        this.application.use('/javascripts/vendor', express.static(buildRoot + '/../node_modules'));

        this.application.get('/', (request: express.Request, response: express.Response) => {

            // options list: http://expressjs.com/en/api.html#res.sendFile
            let mainPageSendfileOptions = {
                root: path.join(buildRoot, 'html'),
                dotfiles: 'deny',
                headers: {
                    'x-timestamp': Date.now(),
                    'x-sent': true
                }
            };

            response.sendFile('main.html', mainPageSendfileOptions);

        });

        let port = process.env.PORT || 35000;

        this.application.listen(port, function () {
            console.log('app listening on port ' + port + '...');
        });

    }

}
