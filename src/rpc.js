import Requests from './requests';

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
                params[j] = arguments[j];
            } else {
                break;
            }
        }
        return Requests.requestRpc(moduleName, functionName, params, manager)
            .then(result => {
                if (typeof result === 'object')
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
export default module;