# Directver

Directver is a Node.js framework for building web apps with a different approach.

## TODOS

- [ ] A dignified doc!
- [ ] Add Model
- [ ] Add Guards
- [ ] Add Dtos
- [ ] Add common erorr classes

## Installation

You can install Directver with npm;

```
npm install directver
```

## How Directver works?

Directver has not very common approach for buliding web apps. although you can see this pattern in some frameworks like Next.js for making routes.

Directver uses the directories to manage route handlers. it means that you should just make a directory tree and provide handlers and directver take care of generating paths, handling errors and etc.

just for getting familiar with the Directver principles consider the below directory.

```
test-project
├── api
│   └── login
│       └── _.ts
└── index.ts
```

we have `test-project` as our root folder. in the root folder we have `api` folder. this is a special folder for Directver. the `api` folder is main entry point for scanning the files and folders to create routes based on them. in the `api` we have `login` folder. in that we have a special file called `_.ts` (or perhaps `_.js` if you are writing javascript, see ###here)

Directver with this `api` directory will run a server that handles the `/login` route. `_.ts` exports a function that handles the requsts to this path. this function will return a response and directver uses that and responses to the request.

so we add another folder to `api` folder.

```
test-project
├── api
│   ├── login
│   │   └── _.ts
│   └── register
│       └── _.post.ts
└── index.ts
```

We added `register` folder. in this folder we have `_.post.ts` file that exports a function for handling requests to `/register` path but with `POST` http method. with just changing the file name from `_.ts` to `_.post.ts` we specified the method we want to handle. so if you make a request to `/request` route with any method but `POST` you give a 404 error.

These files are _Controllers_. controllers has responsibility to response to a request. we have other files as well, you will read about them later. but before that you should be familiar with naming convention.

## Naming files and folders

As i said the `api` folder is a special one. every file and folder in this folder should follow a naming pattern. Directver uses the name of files and folders to do the work.

consider that in a Directver app folders are just signs. they do nothing without the files. so if you have a project this:

```
test-project
├── api
│   └── posts
└── index.ts
```

Directver does nothing! maybe we should have a route with `/posts` path. but there is no file in `posts` folder to handle the requests; because of that Directver just ignores this folder. later you will find out that every folder doesn't need a _Controller file_.

So the real work are done by the files and the functions (or classes) that they exporting.

### Files name

Files name should have this general pattern:

```
{FileType}.{?FileMethod}.{?FileScope}.{?FileName}.(ts/js)
```

a `FileType` is necessary part of the file name. `_` is a symbol for _Controller FileType_. we have other types as well. for example _pipe_ and _out_. you will read about FileTypes later.

Unlike the _FileType_ other parts are not necessary. so you just used them for some additional functionality.

a `FileMethod` will limited the file to specific http method. remeber that we use `_.post.ts` name for getting just the `POST` requests. a file method can be one of these: _get, post, put, patch, delete, all_. if you ignore the FileMethod the _all_ value will be used.

`FileScope` are trivial for most of the file types. just `Dtos` will use them.

`FileName` can be provided to do some configuration and access the file withing other files.

#### What is cover sign "@"

a cover sign is symbol that can be used for all files but Controllers to make a file to cover all the subdirectories. let me explain with an example. consider this project:

```
test-project
├── api
│   ├── _.ts
│   ├── pipe.ts
│   ├── admin
│   │   ├── _.get.ts
│   │   └── _.post.ts
│   └── user
│       └── _.get.ts
└── index.ts
```

At this project we have a new FileType called _pipe_. pipes are files that will execute before controllers. pipes can do some works to help controllers. for example can get user data from database and set a metadata for controller to use that data. you can implement authentication and authorization with pipes and _guards_. a pipe file should export a function. pipes should not return a value. returned values will be ignored.

this project has three routes:

- `/`
- `/admin`
- `/user`

admin route have two controllers. one for `POST` requests and another for `GET`. look at `pipe.ts`
this file is in `api` folder so it will be executed only if request path is `/` so. but what if other routes need the functionality of this pipe. so you just be forced to add pipe for every route.

but with cover sybmbol you can solve this problem. with chaning the `pipe.ts` to `@pipe.ts` this pipe will be executed for not just `/` route but every route that will be generated based on the subfolders of its root. so `@pipe.ts` will be executed for `/admin` and `/user` as well.

as i said controllers can't have a cover symbol.

### Folders name

folders name are much limited in compared with files. we have two type of folders in Directver.

#### Static folders

static folders are just a placeholder that their name will be added to route path with no manipulation. every folders that we saw until now are static ones.

#### Dynamic folders

dynamic folders will transpile to dynamic routes in the end. a folder will be dynamic if it starts with `[` and ends with `]`;

```
test-project
├── api
│   ├── _.ts
│   ├── pipe.ts
│   └── user
│       └── [userId]
│           └── _.get.ts
└── index.ts
```

you can see folder with `[userId]` name. the controller in this folder will executed for all request with `/user/*` form. you can have anything in `*` position. for example `/user/duniyalr` or `/user/345436354`.

you can access these values in controllers and pipes with `userId` name.(you will see that later)

## Getting started

Every Directver project should have `api` folder. this structure is a very basic Directver project.

```
test-project
├── api
└── index.ts
```

in the `index.ts` we should import `Directver`.

```js
// index.ts
import Directver from "directver";

async function bootstrap() {
  const app = await Directver({
    port: 2323,
  });
}

bootstrap();
```

Directver gets an optio object. you can specify the port with this object.

now we want add route with `/hello-world` path. so add a new folder in `api` with `hello-world` and add a controller.

```
test-project
├── api
│   └── hello-world
│       └── _.ts
├── package.json
└── index.ts
```

controller should export function to handle request.

```js
// api/hello-world/_.ts
import { Context } from "directver";
export default function helloWorldController(ctx: Context) {
  return {
    message: "Hello world!",
  };
}
```

the controller should return the response. in this controller we just returned an object. controllers get an argument with `Context` type.

Directver is built on top of express. Context is Directver special class that simplifies the access to some useful methods and properties for handling request. but Directver allow you access to Express Request and Response objects.

That's it! you can run your project. if you make a request to port 2323 you will get

```json
{
  "message": "Hello world!"
}
```

as response.

now i want add a pipe to limit access to this route. so we want to add a meta data with pipe to specifies that user have access to this route or not.

this will done with add a `user` property to _metaData_. meta data transfer by Context withing pipes and controllers and other files and you can set or get data from it. so just add pipe in route and make it _cover_ by adding _@_ to its name.

```
test-project
├── api
│   └── hello-world
│       └── _.ts
├── @pipe.setUser.ts
└── index.ts
```

File `@pipe.setUser.ts` added.

```js
// api/@pipe.setUser.ts
import { Context } from "directver";
export default function setUserPipe({ setMeta }: Context) {
  if (isUser()) {
    setMeta("isUser", true);
  }
}
```

this pipe is in root `api` folder and has a cover symbol(@) so this pipe will execute for all the requests. pipes like controllers get a Context as argument. in this pipe we used `setMeta`. `setMeta` is a method that context uses for moving data between files. `setMeta` gets a _key_ and a _value_.

later in other files you can get this value with `getMeta` method. `isUser` is a fake method that holds logic for user authentication.

now i add antother route.

```
test-project
├── api
│   ├── hello-world
│   │   └── _.ts
│   └── just-user
│       └── _.ts
├── @pipe.setUser.ts
└── index.ts
```

route `/just-user` added to project. it's controller can be like this:

```js
// api/just-user/_.ts
import { Context } from "directver";
export default function ({ getMeta }: Context) {
  const isUser = getMeta("isUser");
  if (!isUser)
    return {
      message: "Sorry just users!",
    };

  return {
    message: "Hello my user!",
  };
}
```

Controller uses `getMeta` for reading data that pipe maybe setted in the metas. by the way this not a right way to protect a route! Directver has `guards` for handling this task. but later.
