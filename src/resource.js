import Logger from 'septima-utils/logger';

const global = window;

function firstSlash(aValue) {
    if (!aValue.startsWith('/'))
        aValue = `/${aValue}`;
    if (aValue.endsWith('/'))
        aValue = aValue.substring(0, aValue.length - 1);
    return aValue;
}

if (!global.septimajs) {
    const config = {};
    ((() => {
        let dataUri = '/data';
        Object.defineProperty(config, 'dataUri', {
            get: function () {
                return dataUri;
            },
            set: function (aValue) {
                dataUri = firstSlash(aValue);
            }
        });
        let schemaUri = '/schema';
        Object.defineProperty(config, 'schemaUri', {
            get: function () {
                return schemaUri;
            },
            set: function (aValue) {
                schemaUri = firstSlash(aValue);
            }
        });
        let parametersUri = '/parameters';
        Object.defineProperty(config, 'parametersUri', {
            get: function () {
                return parametersUri;
            },
            set: function (aValue) {
                parametersUri = firstSlash(aValue);
            }
        });
        let commitUri = '/commit';
        Object.defineProperty(config, 'commitUri', {
            get: function () {
                return commitUri;
            },
            set: function (aValue) {
                commitUri = firstSlash(aValue);
            }
        });
        let loginUri = '/j_security_check';
        Object.defineProperty(config, 'loginUri', {
            get: function () {
                return loginUri;
            },
            set: function (aValue) {
                loginUri = firstSlash(aValue);
            }
        });
        let loggedInUri = '/logged-in';
        Object.defineProperty(config, 'loggedInUri', {
            get: function () {
                return loggedInUri;
            },
            set: function (aValue) {
                loggedInUri = firstSlash(aValue);
            }
        });
        let logoutUri = '/logout';
        Object.defineProperty(config, 'logoutUri', {
            get: function () {
                return logoutUri;
            },
            set: function (aValue) {
                logoutUri = firstSlash(aValue);
            }
        });
    })());

    global.septimajs = {
        config
    };
    Object.seal(global.septimajs);
}

function remoteApi() {
    return global.septimajs.config.remoteApi ? global.septimajs.remoteApi : baseUri();
}

function baseUri() {
    let s = document.location.href;

    // Pull off any hash.
    let i = s.indexOf('#');
    if (i !== -1)
        s = s.substring(0, i);

    // Pull off any query string.
    i = s.indexOf('?');
    if (i !== -1)
        s = s.substring(0, i);

    // Rip off everything after the last slash and the last slash itself.
    i = s.lastIndexOf('/');
    if (i !== -1)
        s = s.substring(0, i);
    return s;
}

function load(url, binary, manager) {
    return startDownloadRequest(url, binary ? 'arraybuffer' : '', manager)
        .then(xhr => {
            if (200 <= xhr.status && xhr.status < 300) {
                if (xhr.responseType === 'arraybuffer') {
                    const buffer = xhr.response;
                    buffer.length = buffer.byteLength;
                    return buffer;
                } else {
                    return xhr.responseText;
                }
            } else {
                throw xhr.statusText;
            }
        })
        .catch(aResult => {
            throw aResult.status ? `${aResult.status} : ${aResult.statusText}` : "It seems, that request has been cancelled. See browser's console for more details.";
        });
}

function download(from, name) {
    const a = document.createElement('a');
    a.download = name ? name : '';
    a.style.display = 'none';
    a.style.visibility = 'hidden';
    a.href = from;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

function upload(aUri, aFile, aName, onProgress, manager) {
    if (aFile) {
        return new Promise((resolve, reject) => {
            let completed = false;
            startUploadRequest(aUri, aFile, aName, aResult => {
                completed = true;
                resolve(aResult);
            }, aResult => {
                if (!completed) {
                    if (onProgress) {
                        onProgress(aResult);
                    }
                }
            }, reason => {
                reject(reason);
            }, manager);
        });
    } else {
        throw 'aFile is a required argument';
    }
}

function startDownloadRequest(url, responseType, manager) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        if (manager) {
            manager.cancel = function () {
                req.abort();
            };
        }
        req.open('get', url);
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
        if (responseType) {
            req.responseType = responseType;
        }
        req.send();
    });
}

function startUploadRequest(aUri, aFile, aName, onComplete, onProgress, onFailure, manager) {
    const req = new XMLHttpRequest();
    req.open('post', remoteApi() + firstSlash(aUri));
    if (req.upload) {
        req.upload.onloadstart = aEvent => {
            if (onProgress) {
                onProgress(aEvent);
            }
        };

        req.upload.onprogress = aEvent => {
            if (onProgress) {
                onProgress(aEvent);
            }
        };

        req.upload.onload = aEvent => {
            if (onProgress) {
                onProgress(aEvent);
            }
        };

        req.upload.onloadend = aEvent => {
            // No op here because we handle errors explicitly and success we handle explicitly also
        };

        req.upload.ontimeout = aEvent => {
            if (onFailure) {
                onFailure("Upload timed out");
            } else {
                Logger.severe('onFailure callback missing');
            }
        };

        req.upload.onabort = aEvent => {
            if (onFailure) {
                onFailure("Upload aborted");
            } else {
                Logger.severe('onFailure callback missing');
            }
        };

        req.upload.onerror = anEvent => {
            if (onFailure) {
                onFailure(`error: ${anEvent.error}; detail: ${anEvent.detail}`);
            } else {
                Logger.severe('onFailure callback missing');
            }
        };
    }
    const fd = new FormData();
    fd.append(aName, aFile, aFile.name);
    req.overrideMimeType("multipart/form-data");
    // Must set the onreadystatechange handler before calling send().
    req.onreadystatechange = xhr => {
        if (req.readyState === 4 /*RequestState.DONE*/) {
            req.onreadystatechange = null;
            if (req.status === 200) {
                if (onComplete) {
                    onComplete(isJsonResponse(req) ? JSON.parse(req.responseText) : req.responseText);
                }
            } else if (req.status === 201) {
                if (onComplete) {
                    onComplete(req.getResponseHeader('Location'));
                }
            }
        }
    };
    req.send(fd);
    if(manager){
        manager.cancel = () => {
            req.abort();
        };
    }
}

function Icon() {
}

function loadIcon(url) {
    return new Promise((resolve, reject) => {
        const image = document.createElement('img');
        image.onload = () => {
            image.onload = null;
            image.onerror = null;
            resolve(image);
        };
        image.onerror = e => {
            image.onload = null;
            image.onerror = null;
            reject(e);
        };
        image.src = url;
    });
}

Object.defineProperty(Icon, 'load', {
    get: function () {
        return loadIcon;
    }
});

const module = {};

Object.defineProperty(module, 'Icon', {
    enumerable: true,
    configurable: false,
    value: Icon
});
Object.defineProperty(module, 'upload', {
    enumerable: true,
    configurable: false,
    value: upload
});
Object.defineProperty(module, 'load', {
    enumerable: true,
    configurable: false,
    value: function (aResName, manager) {
        return load(aResName, true, manager);
    }
});
Object.defineProperty(module, 'loadText', {
    enumerable: true,
    configurable: false,
    value: function (aResName, manager) {
        return load(aResName, false, manager);
    }
});
Object.defineProperty(module, 'download', {
    enumerable: true,
    configurable: false,
    value: download
});
Object.defineProperty(module, 'baseUri', {
    enumerable: true,
    configurable: false,
    value: baseUri
});
Object.defineProperty(module, 'remoteApi', {
    get: function () {
        return remoteApi;
    }
});
export default module;