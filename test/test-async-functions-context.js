'use strict';
require('../index');
const assert = require('assert');
const { AsyncContext } = require('async_hooks');

async function foo() {}

async function testAwait() {
    await foo();
    assert.notStrictEqual(asyncContext.getStore(), undefined);
    assert.strictEqual(asyncContext.getStore().get('key'), 'value');
}

const asyncContext = new AsyncContext();
asyncContext.run((store) => {
    store.set('key', 'value');
    testAwait(); // should not reject
});
