import Requests from './requests';
import Resource from './resource';

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
        return Requests.requestRpc(moduleName, functionName, params, manager);
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


function startRequest(url, method, body, bodyType, onSend, manager) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        if (manager) {
            manager.cancel = function () {
                req.abort();
            };
        }
        req.open(method, /^http.*/i.test(url) ? url : Resource.remoteApi() + url);
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
        onSend(req)
        if (body) {
            req.send(body);
        } else {
            req.send();
        }
    });
}

function asUrlParameters(params) {
    if (params) {
        const names = Object.keys(params)
        if (names.length !== 0) {
            return '?' + names
                .map((item) => {
                    return `${item}=${encodeURIComponent(params[item])}`
                })
                .reduce((p1, p2) => {
                    return `${p1}&${p2}`
                })
        } else {
            return ''
        }
    } else {
        return ''
    }
}

function ifJsonXmlResponse(xhr) {
    if (Requests.isJsonResponse(xhr)) {
        return JSON.parse(xhr.responseText, Requests.dateReviver);
    } else if (Requests.isXmlResponse(xhr)) {
        return xhr.responseXML;
    } else {
        return xhr.responseText;
    }
}

function ifJsonXmlError(xhr) {
    if (Requests.isJsonResponse(xhr)) {
        throw JSON.parse(xhr.responseText, Requests.dateReviver);
    } else if (Requests.isXmlResponse(xhr)) {
        return xhr.responseXML;
    } else {
        throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
    }
}

class Rest {

    constructor(url) {
        this.url = url;
        this.onSend = (req) => {
        }
    }

    get(instanceKey, parameters, manager) {
        return startRequest(this.url + (!!instanceKey ? '/' + encodeURIComponent(instanceKey) : "") + asUrlParameters(parameters), Requests.Methods.GET, null, null, this.onSend, manager)
            .then(ifJsonXmlResponse)
            .catch(ifJsonXmlError);
    }

    post(instance, parameters, manager) {
        return startRequest(this.url + asUrlParameters(parameters), Requests.Methods.POST, JSON.stringify(instance), 'application/json;charset=utf-8', this.onSend, manager)
            .then(xhr => {
                if (xhr.status === 201 && xhr.getResponseHeader("Location")) {
                    return xhr.getResponseHeader("Location");
                } else {
                    return ifJsonXmlResponse(xhr);
                }
            })
            .catch(ifJsonXmlError);
    }

    put(instanceKey, instance, parameters, manager) {
        return startRequest(this.url + '/' + encodeURIComponent(instanceKey) + asUrlParameters(parameters), Requests.Methods.PUT, JSON.stringify(instance), 'application/json;charset=utf-8', this.onSend, manager)
            .then(ifJsonXmlResponse)
            .catch(ifJsonXmlError);
    }

    delete(instanceKey, parameters, manager) {
        return startRequest(this.url + '/' + encodeURIComponent(instanceKey) + asUrlParameters(parameters), Requests.Methods.DELETE, null, null, this.onSend, manager)
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
Object.defineProperty(module, 'startRequest', {
    enumerable: true,
    value: startRequest
});
export default module;