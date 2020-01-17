# UserlandAsyncContext
Userland implementation of https://github.com/nodejs/node/pull/26540

# Usage
```shell script
$ npm install userland-async-context
```

Then, in your code:
```javascript
require('userland-async-context');
const { AsyncContext } = require('async_hooks');
```

#Documentation

## Class: AsyncContext
<!-- YAML
added: REPLACEME
-->

This class is used to create asynchronous state between callbacks and promise
chains. It allows you to keep variables throughout the lifetime of a web request
or any other asynchronous duration. It is similar to thread local storage
 in other languages.

The following example builds a logger that will always know the current HTTP
request and use it to display enhanced logs without needing to explicitly pass
the current HTTP request to it.

```js
const { AsyncContext } = require('async_hooks');
const http = require('http');

const kReq = 'CURRENT_REQUEST';
const asyncContext = new AsyncContext();

function log(...args) {
  const store = asyncContext.getStore();
  // Make sure the store exists and it contains a request.
  if (store && store.has(kReq)) {
    const req = store.get(kReq);
    // Prints `GET /items ERR could not do something
    console.log(req.method, req.url, ...args);
  } else {
    console.log(...args);
  }
}

http.createServer((request, response) => {
  asyncContext.run((store) => {
    store.set(kReq, request);
    someAsyncOperation((err, result) => {
      if (err) {
        log('ERR', err.message);
      }
    });
  });
})
.listen(8080);
```

### new AsyncContext()

* Returns: {Object}

Creates a new instance of `AsyncContext`. Storage is only provided inside a `run`
 method call.

### asyncContext.run(callback)

* `callback` {Function}
  * `store` {Map}

Calling `asyncContext.enter(callback)` will create a new asynchronous context.
This method will call the callback with a `Map` known as the store as argument.

This store will be persistent through the following asynchronous calls.

### asyncContext.exit(callback)

* `callback` {Function}

Calling `asyncContext.exit(callback)` will exit the context.
Asynchronous operations following the callback cannot access the
 store.

### asyncContext.getStore()

* Returns: {Map}

This methods returns the current store.
If this method is called  outside of an asynchronous context initialized by
calling `asyncContext.run` will return `undefined`.

