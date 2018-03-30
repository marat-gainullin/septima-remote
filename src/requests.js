import Id from 'septima-utils/id';
import Logger from 'septima-utils/logger';
import Resource from './resource';

const global = window;

const Methods = {
    GET: 'GET',
    PUT: 'PUT',
    POST: 'POST',
    HEAD: 'HEAD',
    DELETE: 'DELETE'
};

class Cancelable {
}

function param(aName, aValue) {
    return `${aName}=${aValue ? encodeURIComponent(aValue) : aValue}`;
}

function params(...args) {
    return args
        .join('&');
}

function objToParams(params) {
    return Object.keys(params)
        .map(key => param(key, params[key]))
        .join('&');
}

function submitForm(formAction, method, formData, manager) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        if (manager) {
            manager.cancel = function () {
                req.abort();
            };
        }
        let url = Resource.remoteApi() + formAction ? formAction : '';
        const paramsData = objToParams(formData);
        if (method.toLowerCase() !== Methods.POST.toLowerCase()) {
            url += `?${paramsData}`;
        }
        req.open(method, url);
        // Must set the onreadystatechange handler before calling send().
        req.onreadystatechange = () => {
            if (req.readyState === 4 /*RequestState.DONE*/) {
                req.onreadystatechange = null;
                if (200 <= req.status && req.status < 300) {
                    resolve(req);
                } else {
                    reject(req.responseText ? req.responseText : (`${req.status} : ${req.statusText}`));
                }
            }
        };
        if (method.toLowerCase() === Methods.POST.toLowerCase()) {
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            req.send(paramsData);
        } else {
            req.send();
        }
    });
}

function dateReviver(k, v) {
    if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v)) {
        return new Date(v);
    } else {
        return v;
    }
}

/**
 *
 * @param uri An URL portion. Must start with a slash.
 * @param urlQuery
 * @param body
 * @param method
 * @param contentType
 * @param manager
 * @returns {Promise<any>}
 */
function startApiRequest(uri, urlQuery, body, method, contentType, manager) {
    const url = Resource.remoteApi() + (uri ? uri : "") + (urlQuery ? `?${urlQuery}` : "");
    const req = new XMLHttpRequest();
    req.open(method, url);
    if (contentType) {
        req.setRequestHeader("Content-Type", contentType);
    }
    req.setRequestHeader("Pragma", "no-cache");
    return new Promise((resolve, reject) => {
        if (manager) {
            manager.cancel = function () {
                req.abort();
            };
        }
        req.onreadystatechange = () => {
            if (req.readyState === 4 /*RequestState.DONE*/) {
                req.onreadystatechange = null;
                if (200 <= req.status && req.status < 300) {
                    resolve(req);
                } else {
                    // Chrome calls 'req.onreadystatechange' in the same control flow as 'req.abort()'
                    // has been called by client code. So, hope promise.reject will adhere right control flow
                    // and there will not be any difference if request was cancelled or not.
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
    let responseType = xhr.getResponseHeader("Content-type");
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

function encodeURIPath(aPath) {
    return aPath.split('/').map(element => encodeURIComponent(element)).join('/');
}

function requestData(aServerEntityName, aParams, manager) {
    const query = objToParams(aParams);
    return startApiRequest(global.septimajs.config.dataUri + '/' + encodeURIPath(aServerEntityName), query, '', Methods.GET, null, manager)
        .then(xhr => {
            if (isJsonResponse(xhr)) {
                return JSON.parse(xhr.responseText, dateReviver);
            } else {
                throw 'Wrong response MIME type. It should be json like MIME type';
            }
        })
        .catch(xhr => {
            if (xhr.status === 0) {
                throw 'Cancel'; // In case of cancelled request, no useful information is presented in xhr.
            } else {
                throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
            }
        });
}

function requestSchema(aServerEntityName, manager) {
    return startApiRequest(global.septimajs.config.schemaUri + '/' + encodeURIPath(aServerEntityName), null, null, Methods.GET, null, manager)
        .then(xhr => {
            if (isJsonResponse(xhr)) {
                return JSON.parse(xhr.responseText);
            } else {
                throw 'Wrong response MIME type. It should be json-like MIME type';
            }
        })
        .catch(xhr => {
            throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
        });
}

function requestParameters(aServerEntityName, manager) {
    return startApiRequest(global.septimajs.config.parametersUri + '/' + encodeURIPath(aServerEntityName), null, null, Methods.GET, null, manager)
        .then(xhr => {
            if (isJsonResponse(xhr)) {
                return JSON.parse(xhr.responseText, dateReviver);
            } else {
                throw 'Wrong response MIME type. It should be json-like MIME type';
            }
        })
        .catch(xhr => {
            throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
        });
}

function requestLogin(user, password, manager) {
    return startApiRequest(global.septimajs.config.loginUri, '', `j_username=${encodeURIComponent(user)}&j_password=${encodeURIComponent(password)}`, Methods.POST, 'application/x-www-form-urlencoded', manager)
        .catch(xhr => {
            throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
        });
}

function requestLogout(manager) {
    return startApiRequest(global.septimajs.config.logoutUri, '', '', Methods.GET, null, manager)
        .catch(xhr => {
            throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
        });
}

function requestLoggedInUser(manager) {
    return startApiRequest(global.septimajs.config.loggedInUri, null, null, Methods.GET, null, manager)
        .then(xhr => {
            if (isJsonResponse(xhr)) {
                let userName;
                if (xhr.responseText) {
                    const oResult = JSON.parse(xhr.responseText, dateReviver);
                    userName = oResult.userName;
                } else {
                    userName = null;
                }
                if (!userName) {
                    userName = `anonymous-${Id.next()}`;
                }
                return userName;
            } else {
                throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
            }
        })
        .catch(xhr => {
            throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
        });
}

function requestCommit(changeLog, manager) {
    return startApiRequest(global.septimajs.config.commitUri, null, JSON.stringify(changeLog), Methods.POST, 'application/json;charset=utf-8', manager)
        .then(xhr => {
            Logger.info(`Commit succeded: ${xhr.status} : ${xhr.statusText}`);
            if (isJsonResponse(xhr)) {
                return JSON.parse(xhr.responseText);
            } else {
                throw 'Wrong response MIME type. It should be json-like MIME type';
            }
        })
        .catch(xhr => {
            Logger.info(`Commit failed: ${xhr.status} : ${xhr.statusText}`);
            throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
        });
}

function requestRpc(aModuleName, aMethodName, aParams, manager) {
    return startApiRequest("/" + encodeURIPath(aModuleName) + "/" + encodeURIPath(aMethodName), null, JSON.stringify(aParams), Methods.POST, 'application/json;charset=utf-8', manager)
        .then(xhr => {
            if (isJsonResponse(xhr)) {
                return JSON.parse(xhr.responseText, dateReviver);
            } else {
                return xhr.responseText;
            }
        })
        .catch(xhr => {
            if (isJsonResponse(xhr)) {
                throw JSON.parse(xhr.responseText, dateReviver);
            } else {
                throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
            }
        });
}

const module = {};

Object.defineProperty(module, 'requestSchema', {
    enumerable: true,
    get: function () {
        return requestSchema;
    }
});

Object.defineProperty(module, 'requestParameters', {
    enumerable: true,
    get: function () {
        return requestParameters;
    }
});

Object.defineProperty(module, 'requestCommit', {
    enumerable: true,
    configurable: false,
    value: requestCommit
});

Object.defineProperty(module, 'requestData', {
    enumerable: true,
    configurable: false,
    value: requestData
});

Object.defineProperty(module, 'requestLoggedInUser', {
    enumerable: true,
    configurable: false,
    value: requestLoggedInUser
});

Object.defineProperty(module, 'requestLogin', {
    enumerable: true,
    configurable: false,
    value: requestLogin
});

Object.defineProperty(module, 'requestLogout', {
    enumerable: true,
    configurable: false,
    value: requestLogout
});

Object.defineProperty(module, 'requestRpc', {
    enumerable: true,
    configurable: false,
    value: requestRpc
});

Object.defineProperty(module, 'submitForm', {
    enumerable: true,
    configurable: false,
    value: submitForm
});

Object.defineProperty(module, 'params', {
    enumerable: true,
    configurable: false,
    value: params
});

Object.defineProperty(module, 'param', {
    enumerable: true,
    configurable: false,
    value: param
});

Object.defineProperty(module, 'dateReviver', {
    enumerable: true,
    configurable: false,
    value: dateReviver
});
Object.defineProperty(module, 'Cancelable', {
    enumerable: true,
    configurable: false,
    value: Cancelable
});
Object.defineProperty(module, 'Methods', {
    enumerable: true,
    configurable: false,
    value: Methods
});
Object.defineProperty(module, 'isJsonResponse', {
    enumerable: true,
    configurable: false,
    value: isJsonResponse
});
Object.defineProperty(module, 'isXmlResponse', {
    enumerable: true,
    configurable: false,
    value: isXmlResponse
});
export default module;