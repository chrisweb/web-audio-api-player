
'use strict';

// vendor
import * as express from 'express';
import * as passport from 'passport';
const DeezerStrategy = require('passport-deezer');

// nodejs
import * as path from 'path';
import * as request from 'request';

// configuration
import { Configuration, IConfiguration } from './configuration';

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

        // PASSPORT OAUTH
        // https://github.com/krachot/passport-deezer
        // https://github.com/krachot/passport-deezer/blob/master/examples/login/app.js
        // http://developers.deezer.com/api/oauth
        this.application.use(passport.initialize());

        let configuration: IConfiguration = new Configuration();

        const DEEZER_CLIENT_ID = configuration.clientID;
        const DEEZER_CLIENT_SECRET = configuration.clientSecret;
        const DEEZER_CALLBACK_URL = 'http://127.0.0.1:35000/oauth/deezer/callback';
        //const DEEZER_SCOPE = ['basic_access', 'email', 'offline_access', 'manage_library'];
        const DEEZER_SCOPE = ['basic_access'];

        // Passport session setup.
        //   To support persistent login sessions, Passport needs to be able to
        //   serialize users into and deserialize users out of the session.  Typically,
        //   this will be as simple as storing the user ID when serializing, and finding
        //   the user by ID when deserializing.  However, since this example does not
        //   have a database of user records, the complete Deezer profile is serialized
        //   and deserialized.
        passport.serializeUser(function (user, done) {
            done(null, user);
        });

        passport.deserializeUser(function (obj, done) {
            done(null, obj);
        });

        // Use the DeezerStrategy within Passport.
        //   Strategies in Passport require a `verify` function, which accept
        //   credentials (in this case, an accessToken, refreshToken, and Deezer
        //   profile), and invoke a callback with a user object.
        passport.use(new DeezerStrategy({
            clientID: DEEZER_CLIENT_ID,
            clientSecret: DEEZER_CLIENT_SECRET,
            callbackURL: DEEZER_CALLBACK_URL,
            scope: DEEZER_SCOPE
        },
        function (accessToken: string, refreshToken: string | undefined, profile: passport.Profile, done: Function) {

            console.log(accessToken, refreshToken, profile);

            let parameters = {
                access_token: accessToken
                // index (default 0)
                // limit (default  25)
            };

            let deezerApiBaseUrl = 'http://api.deezer.com';
            let deezerApiUri = '/playlist';
            let deezerResourceId = 2002496842;

            let apiRequest = request({
                url: deezerApiBaseUrl + deezerApiUri + '/' + deezerResourceId + '/tracks',
                method: 'GET',
                qs: parameters,
                json: true
            }, (error, response, body) => {

                if ('error' in body) {
                    // TODO: error
                }

                // body:
                // checksum: string
                // data: string
                // next: string
                // total: number

                let playlistTracks = body.data;

                console.log(playlistTracks);

            });

            /*let deezerApiUri = '/track';
            let deezerResourceId = 2002496842;

            let apiRequest = request({
                url: deezerApiBaseUrl + deezerApiUri + '/' + deezerResourceId,
                method: 'GET',
                qs: parameters,
                json: true
            }, (error, response, body) => {

                if ('error' in body) {
                    // TODO: error
                }

                // body:
                // checksum: string
                // data: string
                // next: string
                // total: number

                let playlistTracks = body.data;

                console.log(parsedResponse);

            });*/



            // asynchronous verification, for effect...
            process.nextTick(function () {

                // To keep the example simple, the user's Deezer profile is returned to
                // represent the logged-in user.  In a typical application, you would want
                // to associate the Deezer account with a user record in your database,
                // and return that user instead.
                return done(null, profile);

            });

        }));

        // GET /auth/deezer
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  The first step in Deezer authentication will involve redirecting
        //   the user to deezer.com.  After authorization, Deezer will redirect the user
        //   back to this application at /oauth/deezer/callback
        this.application.get('/oauth/deezer',
            passport.authenticate('deezer'),
            function (request: express.Request, response: express.Response) {
                // The request will be redirected to Deezer for authentication, so this
                // function will not be called.
            }
        );

        // GET /auth/deezer/callback
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        this.application.get('/oauth/deezer/callback',
            passport.authenticate('deezer', { failureRedirect: '/login' }),
            function (request: express.Request, response: express.Response) {

                console.log('foo');

                //res.redirect('/');

            }
        );

    }

}
