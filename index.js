'use strict';
const v8 = require('v8');
const vm = require('vm');
const asyncHooks = require('async_hooks');
const { createHook, executionAsyncId } = asyncHooks;

v8.setFlagsFromString('--harmony-weak-refs');
const WeakReference = vm.runInNewContext('WeakRef');
WeakReference.prototype.get = WeakReference.prototype.deref;

function getResource(id) {
    const weak = idResourcePairing.get(id);
    if (!weak) {
        return undefined;
    }
    return weak.get();
}

function getCurrentResource() {
    const id = executionAsyncId();
    return getResource(id);
}

const idResourcePairing = new Map();
const contexts = new Set();
const asyncContextHook = createHook({
    init(asyncId, type, triggerAsyncId, resource) {
        // Save new resource.
        idResourcePairing.set(asyncId, new WeakReference(resource));
        const triggerResource = getResource(triggerAsyncId);
        if (triggerResource) {
            contexts.forEach((context) => {
                context._propagate(resource, triggerResource);
            });
        }
    },
    destroy(asyncId) {
        idResourcePairing.delete(asyncId);
    }
});

class AsyncContext {
    constructor() {
        this.kResourceStore = Symbol('kResourceStore');
    }

    /**
     * Propagate the context from a parent resource to a child one.
     */
    _propagate(resource, triggerResource) {
        const store = triggerResource[this.kResourceStore];
        if (store) {
            resource[this.kResourceStore] = store;
        }
    }

    /**
     * get the current store, i.e. the unique map associated with current
     * async resource and (maybe) inherited from the parent async resource
     * will return null if no map is currently associated
     */
    getStore() {
        const resource = getCurrentResource();
        if (resource) {
            return resource[this.kResourceStore];
        }
    }

    /**
     * after this point calling getStore will return a map
     * if called within the callback chain of another start call a new map will
     * replace the previous one.
     */
    run(callback) {
        asyncContextHook.enable();
        contexts.add(this);
        process.nextTick(() => {
            const store = new Map();
            const resource = getCurrentResource(); // will always be here
            resource[this.kResourceStore] = store;
            return callback(store);
        });
    }

    /**
     * Exists the current context and call the callback
     * @param callback
     */
    exit(callback) {
        process.nextTick(() => {
            const resource = getCurrentResource(); // will always be here
            resource[this.kResourceStore] = undefined;
            return callback();
        });
    }
}
asyncHooks.AsyncContext = AsyncContext;
