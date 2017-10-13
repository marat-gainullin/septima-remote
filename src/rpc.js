import Invoke from 'septima-utils/invoke';
import Report from './report';
import Requests from './requests';

function requireRemotes(remotesNames) {
    return new Promise((resolve, reject) => {
        const _remotesNames = Array.isArray(remotesNames) ? remotesNames : [remotesNames];
        const proxies = [];
        for (let r = 0; r < _remotesNames.length; r++) {
            proxies.push(new createProxy(_remotesNames[r]));
        }
        Invoke.later(() => {
            resolve(proxies);
        });
    });
}

function generateFunction(moduleName, functionName) {
    return function () {
        let argsLength = arguments.length;
        let manager = new Requests.Cancelable();
        if (arguments.length > 0 && arguments[arguments.length - 1] instanceof Requests.Cancelable) {
            manager = arguments[arguments.length - 1];
            argsLength--;
        }
        const params = [];
        for (let j = 0; j < argsLength; j++) {
            const to = typeof arguments[j];
            if (to !== 'undefined' && to !== 'function' && !(to instanceof Requests.Cancelable)) {
                params[j] = JSON.stringify(arguments[j]);
            } else {
                break;
            }
        }
        return Requests.requestServerMethodExecution(moduleName, functionName, params, manager)
                .then(result => {
                    if (typeof result === 'object' && result instanceof Report)
                        return result;
                    else {
                        let parsed;
                        try {
                            parsed = JSON.parse(result, Requests.dateReviver);
                        } catch (ex) {
                            parsed = result;
                        }
                        return parsed;
                    }
                });
    };
}

function isValidFunctionName(name) {
    return /^[_a-zA-Z][_a-zA-Z0-9]+$/.test(name);
}

function createProxy(aModuleName) {
    return new Proxy({}, {
        has: function (target, name) {
            return name in target || isValidFunctionName(name);
        },
        get: function (target, name) {
            if (!(name in target) && isValidFunctionName(name)) {
                target[name] = generateFunction(aModuleName, name);
            }
            return target[name];
        }
    });
}
const module = {};
Object.defineProperty(module, 'proxy', {
    enumerable: true,
    value: createProxy
});
Object.defineProperty(module, 'requireRemotes', {
    enumerable: true,
    value: requireRemotes
});
export default module;