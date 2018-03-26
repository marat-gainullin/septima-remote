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


function startRequest(url, method, body, bodyType, manager) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        if (manager) {
            manager.cancel = function () {
                req.abort();
            };
        }
        req.open(method, url);
        if (bodyType) {
            req.setRequestHeader("Content-Type", bodyType);
        }
        // Must set the onreadystatechange handler before calling send().
        req.onreadystatechange = () => {
            if (req.readyState === 4 /*RequestState.DONE*/) {
                req.onreadystatechange = null;
                if (200 <= req.status && req.status < 300) {
                    resolve(req);
                } else {
                    reject(req);
                }
            }
        };
        if (body) {
            req.send(body);
        } else {
            req.send();
        }
    });
}

function isJsonResponse(xhr) {
    let responseType = xhr.getResponseHeader("Content-Type");
    if (responseType) {
        responseType = responseType.toLowerCase();
        return responseType.includes("application/json") ||
            responseType.includes("application/javascript") ||
            responseType.includes("text/json") ||
            responseType.includes("text/javascript");
    } else {
        return false;
    }
}

function isXmlResponse(xhr) {
    let responseType = xhr.getResponseHeader("Content-Type");
    if (responseType) {
        responseType = responseType.toLowerCase();
        return (responseType.startsWith("application/") || responseType.startsWith("text/")) && responseType.endsWith("xml"); // application/atom+xml for example
    } else {
        return false;
    }
}

function ifJsonXmlResponse(xhr) {
    if (isJsonResponse(xhr)) {
        return JSON.parse(xhr.responseText);
    } else if (isXmlResponse(xhr)) {
        return xhr.responseXML;
    } else {
        return xhr.responseText;
    }
}

function ifJsonXmlError(xhr) {
    if (isJsonResponse(xhr)) {
        throw JSON.parse(xhr.responseText);
    } else if (isXmlResponse(xhr)) {
        return xhr.responseXML;
    } else {
        throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
    }
}

class Rest {

    constructor(url) {
        this.url = url;
    }

    get(instanceKey, manager) {
        return startRequest(this.url + (!!instanceKey ? "/" + instanceKey : ""), Requests.Methods.GET, null, null, manager)
            .then(ifJsonXmlResponse)
            .catch(ifJsonXmlError);
    }

    post(instance, manager) {
        return startRequest(this.url, Requests.Methods.POST, JSON.stringify(instance), 'application/json;charset=utf-8', manager)
            .then(xhr => {
                if (xhr.status === 201 && xhr.getResponseHeader("Location")) {
                    return xhr.getResponseHeader("Location");
                } else {
                    return ifJsonXmlResponse(xhr);
                }
            })
            .catch(ifJsonXmlError);
    }

    put(instanceKey, instance, manager) {
        return startRequest(this.url + "/" + instanceKey, Requests.Methods.PUT, JSON.stringify(instance), 'application/json;charset=utf-8', manager)
            .then(ifJsonXmlResponse)
            .catch(ifJsonXmlError);
    }

    delete(instanceKey, manager) {
        return startRequest(this.url + "/" + instanceKey, Requests.Methods.DELETE, null, null, manager)
            .then(ifJsonXmlResponse)
            .catch(ifJsonXmlError);
    }

}


const module = {};
Object.defineProperty(module, 'proxy', {
    enumerable: true,
    value: createProxy
});
Object.defineProperty(module, 'Rest', {
    enumerable: true,
    value: Rest
});
export default module;