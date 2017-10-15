import Id from 'septima-utils/id';
import Logger from 'septima-utils/logger';
import Invoke from 'septima-utils/invoke';
import Report from './report';
import Resource from './resource';

const global = window;

const REPORT_LOCATION_CONTENT_TYPE = "text/septima-report-location";

const RequestTypes = {
    rqCredential: '5',
    rqModuleStructure: '19',
    rqResource: '20',
    rqAppEntity: '6',
    rqExecuteQuery: '7',
    rqCommit: '8',
    rqCreateServerModule: '12',
    rqDisposeServerModule: '13',
    rqExecuteServerModuleMethod: '14',
    rqLogout: '18'
};
Object.seal(RequestTypes);

const RequestParams = {
    CACHE_BUSTER: "__cb",
    ENTITY_NAME: "__queryId",
    TYPE: "__type",
    MODULE_NAME: "__moduleName",
    METHOD_NAME: "__methodName",
    PARAMS_ARRAY: "__param[]"
};
Object.seal(RequestParams);

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

function params() {
    let res = "";
    for (let i = 0; i < arguments.length; i++) {
        if (arguments[i]) {
            if (res.length > 0) {
                res += "&";
            }
            res += arguments[i];
        }
    }
    return res;
}

function objToParams(params) {
    let res = '';
    for (const p in params) {
        if (res.length > 0) {
            res += '&';
        }
        res += param(p, params[p]);
    }
    return res;
}

function arrayToParams(paramsName, params) {
    let res = '';
    for (let p = 0; p < params.length; p++) {
        if (res.length > 0) {
            res += '&';
        }
        res += param(paramsName, params[p]);
    }
    return res;
}

function submitForm(formAction, method, formData, manager) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        if (manager) {
            manager.cancel = function () {
                req.abort();
            };
        }
        let url = formAction ? formAction : '';
        const paramsData = objToParams(formData);
        if (method !== Methods.POST) {
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
        if (method === Methods.POST) {
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

function startApiRequest(urlPrefix, urlQuery, body, method, contentType, manager) {
    const url = Resource.remoteApi() + global.septimajs.config.apiUri + (urlPrefix ? urlPrefix : "") + (urlQuery ? `?${urlQuery}` : "");
    const req = new XMLHttpRequest();
    req.open(method, url);
    if (contentType) {
        req.setRequestHeader("Content-Type", contentType);
    }
    req.setRequestHeader("Pragma", "no-cache");
    return startRequest(req, body, manager);
}

function startRequest(req, body, manager) {
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
    let responseType = xhr.getResponseHeader("content-type");
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

function isReportResponse(aResponse) {
    const responseType = aResponse.getResponseHeader("content-type");
    if (responseType) {
        return responseType.toLowerCase().contains(REPORT_LOCATION_CONTENT_TYPE);
    } else {
        return false;
    }
}

function requestEntity(entityName, manager) {
    const url = params(param(RequestParams.TYPE, RequestTypes.rqAppEntity), param(RequestParams.ENTITY_NAME, entityName));
    return startApiRequest(null, url, '', Methods.GET, null, manager)
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

function requestLogout(manager) {
    const query = param(RequestParams.TYPE, RequestTypes.rqLogout);
    return startApiRequest(null, query, null, Methods.GET, null, manager)
            //.then(xhr => xhr)
            .catch(xhr => {
                throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
            });
}

function requestLoggedInUser(manager) {
    const query = param(RequestParams.TYPE, RequestTypes.rqCredential);
    return startApiRequest(null, query, "", Methods.GET, null, manager)
            .then(xhr => {
                if (isJsonResponse(xhr)) {
                    let principal;
                    if (xhr.responseText) {
                        const oResult = JSON.parse(xhr.responseText);
                        principal = oResult.userName;
                    } else {
                        principal = null;
                    }
                    if (!principal) {
                        principal = `anonymous-${Id.generate()}`;
                    }
                    return principal;
                } else {
                    throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
                }
            })
            .catch(xhr => {
                throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
            });
}

function requestCommit(changeLog, manager) {
    const query = param(RequestParams.TYPE, RequestTypes.rqCommit);
    return startApiRequest(null, query, JSON.stringify(changeLog), Methods.POST, 'application/json; charset=utf-8', manager)
            .then(xhr => {
                Logger.info(`Commit succeded: ${xhr.status} : ${xhr.statusText}`);
                if (isJsonResponse(xhr)) {
                    const affected = JSON.parse(xhr.responseText);
                    return affected;
                } else {
                    throw 'Wrong response MIME type. It should be json like MIME type';
                }
            })
            .catch(xhr => {
                Logger.info(`Commit failed: ${xhr.status} : ${xhr.statusText}`);
                throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
            });
}

function requestServerMethodExecution(aModuleName, aMethodName, aParams, manager) {
    const query = params(
            param(RequestParams.TYPE, RequestTypes.rqExecuteServerModuleMethod),
            param(RequestParams.MODULE_NAME, aModuleName),
            param(RequestParams.METHOD_NAME, aMethodName),
            arrayToParams(RequestParams.PARAMS_ARRAY, aParams));
    return startApiRequest(null, null, query, Methods.POST, 'application/x-www-form-urlencoded;charset=utf-8', manager)
            .then(xhr => {
                if (isJsonResponse(xhr)) {
                    // WARNING!!!Don't edit to JSON.parse()!
                    // It is parsed in high-level js-code.
                    return xhr.responseText;
                } else if (isReportResponse(xhr)) {
                    return new Report(xhr.responseText);
                } else {
                    return xhr.responseText;
                }
            })
            .catch(xhr => {
                if (isJsonResponse(xhr)) {
                    throw JSON.parse(xhr.responseText);
                } else {
                    throw xhr.responseText ? xhr.responseText : `${xhr.status} : ${xhr.statusText}`;
                }
            });
}

function requestData(aServerEntityName, aParams, manager) {
    const query = params(
            param(RequestParams.TYPE, RequestTypes.rqExecuteQuery),
            param(RequestParams.ENTITY_NAME, aServerEntityName), objToParams(aParams)
            );
    return startApiRequest(null, query, '', Methods.GET, null, manager)
            .then(xhr => {
                if (isJsonResponse(xhr)) {
                    // TODO: Check all JSON.parse() against date reviver
                    const parsed = JSON.parse(xhr.responseText, dateReviver);
                    return parsed;
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

const module = {};

Object.defineProperty(module, 'requestEntity', {
    enumerable: true,
    get: function () {
        return requestEntity;
    }
});

Object.defineProperty(module, 'requestCommit', {
    enumerable: true,
    get: function () {
        return requestCommit;
    }
});

Object.defineProperty(module, 'requestData', {
    enumerable: true,
    get: function () {
        return requestData;
    }
});

Object.defineProperty(module, 'requestLoggedInUser', {
    enumerable: true,
    get: function () {
        return requestLoggedInUser;
    }
});

Object.defineProperty(module, 'requestLogout', {
    enumerable: true,
    get: function () {
        return requestLogout;
    }
});

Object.defineProperty(module, 'requestServerMethodExecution', {
    enumerable: true,
    get: function () {
        return requestServerMethodExecution;
    }
});

Object.defineProperty(module, 'submitForm', {
    enumerable: true,
    get: function () {
        return submitForm;
    }
});

Object.defineProperty(module, 'params', {
    enumerable: true,
    get: function () {
        return params;
    }
});

Object.defineProperty(module, 'param', {
    enumerable: true,
    get: function () {
        return param;
    }
});

Object.defineProperty(module, 'RequestTypes', {
    enumerable: true,
    get: function () {
        return RequestTypes;
    }
});

Object.defineProperty(module, 'RequestParams', {
    enumerable: true,
    get: function () {
        return RequestParams;
    }
});
Object.defineProperty(module, 'dateReviver', {
    get: function () {
        return dateReviver;
    }
});
Object.defineProperty(module, 'Cancelable', {
    enumerable: true,
    configurable: true,
    value: Cancelable
});
export default module;