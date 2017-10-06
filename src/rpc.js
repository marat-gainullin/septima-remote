import Invoke from 'septima-utils/invoke';
import Report from './report';
import Requests from './requests';

function requireRemotes(aRemotesNames, aOnSuccess, aOnFailure) {
    const remotesNames = Array.isArray(aRemotesNames) ? aRemotesNames : [aRemotesNames];
    const proxies = [];
    for (let r = 0; r < remotesNames.length; r++) {
        proxies.push(new createProxy(remotesNames[r]));
    }
    Invoke.later(() => {
        aOnSuccess(proxies);
    });
}

function generateFunction(aModuleName, aFunctionName) {
    return function() {
        let onSuccess = null;
        let onFailure = null;
        let argsLength = arguments.length;
        if (arguments.length > 1 && typeof arguments[arguments.length - 1] === "function" && typeof arguments[arguments.length - 2] === "function") {
            onSuccess = arguments[arguments.length - 2];
            onFailure = arguments[arguments.length - 1];
            argsLength -= 2;
        } else if (arguments.length > 1 && typeof arguments[arguments.length - 1] === "undefined" && typeof arguments[arguments.length - 2] === "function") {
            onSuccess = arguments[arguments.length - 2];
            argsLength -= 2;
        } else if (arguments.length > 0 && typeof arguments[arguments.length - 1] === "function") {
            onSuccess = arguments[arguments.length - 1];
            argsLength -= 1;
        }
        const params = [];
        for (let j = 0; j < argsLength; j++) {
            const to = typeof arguments[j];
            if (to !== 'undefined' && to !== 'function') {
                params[j] = JSON.stringify(arguments[j]);
            } else {
                break;
            }
        }
        if (onSuccess) {
            Requests.requestServerMethodExecution(aModuleName, aFunctionName, params,
                aResult => {
                    if (typeof aResult === 'object' && aResult instanceof Report)
                        onSuccess(aResult);
                    else {
                        let parsed;
                        try {
                            parsed = JSON.parse(aResult, Requests.dateReviver);
                        } catch (ex) {
                            parsed = aResult;
                        }
                        onSuccess(parsed);
                    }
                }, onFailure, Report);
        } else {
            const result = Requests.requestServerMethodExecution(aModuleName, aFunctionName, params, null, null, Report);
            if (typeof result === 'object' && result instanceof Report)
                return result;
            else {
                try {
                    return JSON.parse(result, Requests.dateReviver);
                } catch (ex) {
                    return result;
                }
            }
        }
    };
}

function isValidFunctionName(name) {
    return /^[_a-zA-Z][_a-zA-Z0-9]+$/.test(name);
}

function createProxy(aModuleName) {
    const target = {};
    return new Proxy(target, {
        has: function(name) {
            return name in target || isValidFunctionName(name);
        },
        get: function(name) {
            if (!(name in target) && isValidFunctionName(name)) {
                target.name = generateFunction(aModuleName, name);
            }
            return target.name;
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