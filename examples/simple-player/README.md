# web audio API player - simple player example

## build

### tools

install the latest nodejs (if you haven't already) [nodejs](https://nodejs.org)  

update npm to latest version  

`npm install npm@latest -g`

### build the player

first, use the VSCode terminal (or your favorite command line tool) and go into the root of this project:

```shell
cd /YOUR_REPOSITORIES_PATH/web-audio-api-player
```

then use the follwing command (in the root of this repository) to build the "web-audio-api-player" itself:  

`npm run build`

Note: for more instructions about the web-audio-api-player itself check out the [web-audio-api-player README](../../README.md)  

then, build the example (server & client) itself...

### example client

#### go into the client folder

```shell
cd /examples/simple-player/client
```

#### install the client dependencies

```shell
npm i
```

### build the client

```shell
npm run build
```

### example server

#### go into the server folder

```shell
cd /examples/simple-player/server
```

#### install the server dependencies

```shell
npm i
```

#### build the server

```shell
npm run build
```

#### start the server

start the server

`npm run start`

## usage

open the project in your browser:  

`http://127.0.0.1:35000/`

## linting

the linting is now done via the npm run lint command of the main project

## notes about problems I encountered during development

### client problems

#### input type range not triggering change event

Because the value of the input type range element gets constantly updated by the player itself, when using an event listener on **change** will result in the event not firing at all (chrome only?) or it will fire but then at the moment when you read the value it will already have been updated by the player

this is why I recommend using the **input** event instead (which is what is used in this example), so far I had none of the problems I just mentioned using the "input" event instead of the "change" event

### server problems

#### using es6 modules with nodejs

Full nodejs support for es6 modules import/export syntax enabled

nodejs modules official documentation:

[nodejs ecmascript modules readme](https://github.com/nodejs/ecmascript-modules/blob/master/doc/api/esm.md)
[nodejs ecmascript modules documentation](https://nodejs.org/api/esm.html#esm_code_package_json_code_code_type_code_field)

besides adding type=module to the package.json and using the nodejs flag --experimental-modules, it's important to also use the flag --es-module-specifier-resolution=node if you want to be able to load es modules exactly how you would do in the browser:

[extensionless loading of es modules / files explanation](https://medium.com/@nodejs/announcing-a-new-experimental-modules-1be8d2d6c2ff)

so my command (in package.json) to run start the server in nodejs looks like this:

`node --experimental-modules --es-module-specifier-resolution=node ./build/index`

and in package.json you will notice that I also added:

```json
{
  "type": "module"
}
```

#### replacing cjs dirname with esm import.meta.url

When using es modules (esm), the __dirname environment variable is not available anymore, as it is for commonjs (cjs) only, however a replacement is available: meta.import.url

However as of now (25.05.2019) typescript will tell you that "Property 'url' does not exist on type 'ImportMeta'.ts(2339)", the DefinitelyTyped ticket is still unresolved:

[OPEN definitly typed ticket "import.meta object is incompletely defined"](https://github.com/DefinitelyTyped/DefinitelyTyped/issues/35222)

To fix this, add the following Interface to your code:

```typescript
declare global  {
    interface ImportMeta {
        url: string;
    }
}
```