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
    let res = "";
    for (const p in params) {
        if (res.length > 0) {
            res += "&";
        }
        res += param(p, params[p]);
    }
    return res;
}

function arrayToParams(paramsName, params) {
    let res = "";
    for (let p = 0; p < params.length; p++) {
        if (res.length > 0) {
            res += "&";
        }
        res += param(paramsName, params[p]);
    }
    return res;
}

function submitForm(aAction, aMethod, aFormData, onSuccess, onFailure) {
    const req = new XMLHttpRequest();
    let url = aAction ? aAction : "";
    const paramsData = objToParams(aFormData);
    if (aMethod !== Methods.POST) {
        url += `?${paramsData}`;
    }
    req.open(aMethod, url);
    // Must set the onreadystatechange handler before calling send().
    req.onreadystatechange = event => {
        if (req.readyState === 4 /*RequestState.DONE*/ ) {
            req.onreadystatechange = null;
            if (200 <= req.status && req.status < 300) {
                if (onSuccess) {
                    onSuccess(req);
                }
            } else {
                if (onFailure) {
                    onFailure(req.responseText ? req.responseText : (`${req.status} : ${req.statusText}`));
                }
            }
        }
    };
    if (aMethod === Methods.POST) {
        req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        req.send(paramsData);
    } else {
        req.send();
    }
    return {
        cancel: function() {
            req.onreadystatechange = null;
            req.abort();
        }
    };
}

function dateReviver(k, v) {
    if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v)) {
        return new Date(v);
    } else {
        return v;
    }
}

function startApiRequest(aUrlPrefix, aUrlQuery, aBody, aMethod, aContentType, onSuccess, onFailure) {
    const url = Resource.remoteApi() + global.septimajs.config.apiUri + (aUrlPrefix ? aUrlPrefix : "") + (aUrlQuery ? `?${aUrlQuery}` : "");
    const req = new XMLHttpRequest();
    req.open(aMethod, url);
    if (aContentType) {
        req.setRequestHeader("Content-Type", aContentType);
    }
    req.setRequestHeader("Pragma", "no-cache");
    return startRequest(req, aBody, onSuccess, onFailure);
}

function startRequest(req, aBody, onSuccess, onFailure) {
    // Must set the onreadystatechange handler before calling send().
    req.onreadystatechange = () => {
        if (req.readyState === 4 /*RequestState.DONE*/ ) {
            req.onreadystatechange = null;
            if (200 <= req.status && req.status < 300) {
                if (onSuccess) {
                    onSuccess(req);
                }
            } else {
                if (onFailure) {
                    if (req.status === 0) {
                        // Chrome calls 'req.onreadystatechange' in the same control flow as 'req.abort()'
                        // has been called by client code. So, we have to emulate network like error control flow.
                        Invoke.later(() => {
                            onFailure(req);
                        });
                    } else {
                        onFailure(req);
                    }
                }
            }
        }
    };
    if (aBody) {
        req.send(aBody);
    } else {
        req.send();
    }
    return {
        cancel: function() {
            req.abort();
        }
    };
}

function syncApiRequest(aUrlPrefix, aUrlQuery, aResponseType) {
    const url = `${Resource.remoteApi() + global.septimajs.config.apiUri + (aUrlPrefix ? aUrlPrefix : "")}?${aUrlQuery}`;
    const req = syncRequest(url, aResponseType, null, Methods.GET);
    if (200 <= req.status && req.status < 300) {
        return req;
    } else {
        throw `${req.status} : ${req.statusText}`;
    }
}

function syncRequest(aUrl, aResponseType, aBody, aMethod) {
    const req = new XMLHttpRequest();
    req.open(aMethod, aUrl, false);
    /*
     * Since W3C standard about sync XmlHttpRequest and response type. if
     * (aResponseType != null && aResponseType != ResponseType.Default)
     * req.setResponseType(aResponseType);
     */
    req.setRequestHeader("Pragma", "no-cache");
    if (aBody) {
        req.send(aBody);
    } else {
        req.send();
    }
    if (200 <= req.status && req.status < 300) {
        return req;
    } else {
        throw `${req.status} : ${req.statusText}`;
    }
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

function requestEntity(entityName, onSuccess, onFailure) {
    const url = params(param(RequestParams.TYPE, RequestTypes.rqAppEntity), param(RequestParams.ENTITY_NAME, entityName));
    return startApiRequest(null, url, "", Methods.GET, null, xhr => {
        if (isJsonResponse(xhr)) {
            if (onSuccess) {
                const entity = JSON.parse(xhr.responseText);
                onSuccess(entity);
            }
        } else {
            if (onFailure) {
                onFailure('Wrong response MIME type. It should be json like MIME type');
            }
        }
    }, xhr => {
        if (onFailure) {
            onFailure(xhr.responseText ? xhr.responseText : (`${xhr.status} : ${xhr.statusText}`));
        }
    });
}

function requestLogout(onSuccess, onFailure) {
    const query = param(RequestParams.TYPE, RequestTypes.rqLogout);
    return startApiRequest(null, query, null, Methods.GET, null, onSuccess, xhr => {
        onFailure(xhr.responseText ? xhr.responseText : (`${xhr.status} : ${xhr.statusText}`));
    });
}

function requestLoggedInUser(onSuccess, onFailure) {
    const query = param(RequestParams.TYPE, RequestTypes.rqCredential);
    return startApiRequest(null, query, "", Methods.GET, null, xhr => {
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
            if (onSuccess) {
                onSuccess(principal);
            }
        } else {
            if (onFailure) {
                onFailure(xhr.responseText);
            }
        }
    }, xhr => {
        if (onFailure) {
            onFailure(xhr.responseText ? xhr.responseText : (`${xhr.status} : ${xhr.statusText}`));
        }
    });
}

function requestCommit(changeLog, onSuccess, onFailure) {
    const query = param(RequestParams.TYPE, RequestTypes.rqCommit);
    return startApiRequest(null, query, JSON.stringify(changeLog), Methods.POST, "application/json; charset=utf-8", xhr => {
        Logger.info(`Commit succeded: ${xhr.status} : ${xhr.statusText}`);
        if (onSuccess) {
            if (isJsonResponse(xhr)) {
                const touched = JSON.parse(xhr.responseText);
                onSuccess(touched);
            } else {
                onFailure('Wrong response MIME type. It should be json like MIME type');
            }
        }
    }, xhr => {
        Logger.info(`Commit failed: ${xhr.status} : ${xhr.statusText}`);
        if (onFailure) {
            onFailure(xhr.responseText ? xhr.responseText : (`${xhr.status} : ${xhr.statusText}`));
        }
    });
}

function requestServerMethodExecution(aModuleName, aMethodName, aParams, onSuccess, onFailure) {
    const query = params(
        param(RequestParams.TYPE, RequestTypes.rqExecuteServerModuleMethod),
        param(RequestParams.MODULE_NAME, aModuleName),
        param(RequestParams.METHOD_NAME, aMethodName),
        arrayToParams(RequestParams.PARAMS_ARRAY, aParams));
    if (onSuccess) {
        return startApiRequest(null, null, query, Methods.POST, "application/x-www-form-urlencoded; charset=utf-8", xhr => {
            if (isJsonResponse(xhr)) {
                // WARNING!!!Don't edit to JSON.parse()!
                // It is parsed in high-level js-code.
                onSuccess(xhr.responseText);
            } else if (isReportResponse(xhr)) {
                onSuccess(new Report(xhr.responseText));
            } else {
                onSuccess(xhr.responseText);
            }
        }, xhr => {
            if (onFailure) {
                if (isJsonResponse(xhr)) {
                    onFailure(JSON.parse(xhr.responseText));
                } else {
                    onFailure(xhr.responseText ? xhr.responseText : (`${xhr.status} : ${xhr.statusText}`));
                }
            }
        });
    } else {
        const executed = syncApiRequest(null, query, '');
        if (executed) {
            if (200 <= executed.status && executed.status < 300) {
                const responseType = executed.getResponseHeader("content-type");
                if (responseType) {
                    if (isJsonResponse(executed)) {
                        // WARNING!!!Don't edit to Utils.jsonParse!
                        // It is parsed in high-level js-code.
                        return executed.responseText;
                    } else if (responseType.toLowerCase().contains(REPORT_LOCATION_CONTENT_TYPE)) {
                        return new Report(executed.responseText);
                    } else {
                        return executed.responseText;
                    }
                } else {
                    return executed.responseText;
                }
            } else {
                const msg = executed.responseText ? executed.responseText : (`${executed.status} : ${executed.statusText}`);
                throw msg;
            }
        } else {
            return null;
        }
    }
}

function requestData(aServerEntityName, aParams, onSuccess, onFailure) {
    const query = params(
        param(RequestParams.TYPE, RequestTypes.rqExecuteQuery),
        param(RequestParams.ENTITY_NAME, aServerEntityName), objToParams(aParams)
    );
    return startApiRequest(null, query, "", Methods.GET, null, xhr => {
        if (isJsonResponse(xhr)) {
            // TODO: Check all JSON.parse() against date reviver
            const parsed = JSON.parse(xhr.responseText, dateReviver);
            if (onSuccess) {
                onSuccess(parsed);
            }
        } else {
            if (onFailure) {
                onFailure('Wrong response MIME type. It should be json like MIME type');
            }
        }
    }, xhr => {
        if (onFailure) {
            if (xhr.status === 0) {
                onFailure('Cancel'); // In case of cancelled request, no useful information is presented in xhr.
            } else {
                onFailure(xhr.responseText ? xhr.responseText : (`${xhr.status} : ${xhr.statusText}`));
            }
        }
    });
}

const module = {};

Object.defineProperty(module, 'requestEntity', {
    enumerable: true,
    get: function() {
        return requestEntity;
    }
});

Object.defineProperty(module, 'requestCommit', {
    enumerable: true,
    get: function() {
        return requestCommit;
    }
});

Object.defineProperty(module, 'requestData', {
    enumerable: true,
    get: function() {
        return requestData;
    }
});

Object.defineProperty(module, 'requestLoggedInUser', {
    enumerable: true,
    get: function() {
        return requestLoggedInUser;
    }
});

Object.defineProperty(module, 'requestLogout', {
    enumerable: true,
    get: function() {
        return requestLogout;
    }
});

Object.defineProperty(module, 'requestServerMethodExecution', {
    enumerable: true,
    get: function() {
        return requestServerMethodExecution;
    }
});

Object.defineProperty(module, 'submitForm', {
    enumerable: true,
    get: function() {
        return submitForm;
    }
});

Object.defineProperty(module, 'params', {
    enumerable: true,
    get: function() {
        return params;
    }
});

Object.defineProperty(module, 'param', {
    enumerable: true,
    get: function() {
        return param;
    }
});

Object.defineProperty(module, 'RequestTypes', {
    enumerable: true,
    get: function() {
        return RequestTypes;
    }
});

Object.defineProperty(module, 'RequestParams', {
    enumerable: true,
    get: function() {
        return RequestParams;
    }
});

Object.defineProperty(module, 'dateReviver', {
    get: function() {
        return dateReviver;
    }
});
export default module;