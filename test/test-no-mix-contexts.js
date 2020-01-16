'use strict';
require('../index');
const assert = require('assert');
const { AsyncContext } = require('async_hooks');

const asyncContext = new AsyncContext();
const asyncContext2 = new AsyncContext();

setTimeout(() => {
    asyncContext.run((store) => {
        asyncContext2.run((store2) => {
            store.set('hello', 'world');
            store2.set('hello', 'foo');
            setTimeout(() => {
                assert.strictEqual(asyncContext.getStore().get('hello'), 'world');
                assert.strictEqual(asyncContext2.getStore().get('hello'), 'foo');
            }, 200);
        });
    });
}, 100);

setTimeout(() => {
    asyncContext.run((store) => {
        store.set('hello', 'earth');
        setTimeout(() => {
            assert.strictEqual(asyncContext.getStore().get('hello'), 'earth');
        }, 100);
    });
}, 100);
