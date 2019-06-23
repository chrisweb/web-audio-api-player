# web audio API player - simple player example

## build

run gulp build in the root of this repository, to build the player itself [check out the player readme for build instructions](../../README.md)    

now build the example itself  

use your favorite command line and go into the example folder  

```
cd /web-audio-api-player/examples/simple-player
```

install the latest nodejs (if you haven't already) [nodejs](https://nodejs.org)  

update npm to latest version  

`npm install npm@latest -g`

install the server dependencies  

### build the client

```
cd client
npm install
```

build the client  

`npm run build`

### build the server

```
cd server
npm install
```

build the server  

`npm run build`

## start the server

start the server

`npm run start`

## usage

open the project in your browser:  

`http://127.0.0.1:35000/`

## linting

### server

```
npm run lint:server
```

### client

```
npm run lint:client
```

## notes about problems I encountered during development

### using es6 modules with nodejs

Full nodejs support for es6 modules import/export syntax enabled

nodejs modules official documentation:

[nodejs ecmascript modules readme](https://github.com/nodejs/ecmascript-modules/blob/master/doc/api/esm.md)
[nodejs ecmascript modules documentation](https://nodejs.org/api/esm.html#esm_code_package_json_code_code_type_code_field)

besides adding type=module to the package.json and using the nodejs flag --experimental-modules, it's important to also use the flag --es-module-specifier-resolution=node if you want to be able to load es modules exactly how you would do in the browser:

[extensionless loading of es modules / files explanation](https://medium.com/@nodejs/announcing-a-new-experimental-modules-1be8d2d6c2ff)

so my command (in package.json) to run start the server in nodejs looks like this:

`node --experimental-modules --es-module-specifier-resolution=node ./build/index`

and in package.json you will notice that I also added:

```
{
  "type": "module"
}
```

### replacing cjs dirname with esm import.meta.url

When using es modules (esm), the __dirname environment variable is not available anymore, as it is for commonjs (cjs) only, however a replacement is available: meta.import.url

However as of now (25.05.2019) typescript will tell you that "Property 'url' does not exist on type 'ImportMeta'.ts(2339)", the DefinitelyTyped ticket is still unresolved:

[OPEN definitly typed ticket "import.meta object is incompletely defined"](https://github.com/DefinitelyTyped/DefinitelyTyped/issues/35222)

To fix this, add the following Interface to your code:

```
declare global  {
    interface ImportMeta {
        url: string;
    }
}
```