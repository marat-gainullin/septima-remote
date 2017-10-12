import Logger from 'septima-utils/logger';
import Caller from 'septima-utils/caller';

const global = window;

if (!global.septimajs) {
    const config = {};
    ((() => {
        let sourcePath = '/';
        let apiUri = '/application';
        Object.defineProperty(config, 'sourcePath', {
            get: function() {
                return sourcePath;
            },
            set: function(aValue) {
                if (aValue) {
                    sourcePath = aValue;
                    if (!sourcePath.endsWith("/")) {
                        sourcePath = `${sourcePath}/`;
                    }
                    if (!sourcePath.startsWith("/")) {
                        sourcePath = `/${sourcePath}`;
                    }
                } else {
                    sourcePath = "/";
                }
            }
        });
        Object.defineProperty(config, 'apiUri', {
            get: function() {
                return apiUri;
            },
            set: function(aValue) {
                if (!aValue.startsWith('/'))
                    aValue = `/${aValue}`;
                if (aValue.endsWith('/'))
                    aValue = aValue.substring(0, aValue.length - 1);
                apiUri = aValue;
            }
        });
    })());

    global.septimajs = {
        config
    };
    Object.seal(global.septimajs);
}

function lookupCallerJsFile() {
    try {
        throw new Error("Current application file test");
    } catch (ex) {
        return Caller.lookupJsFile(ex);
    }
}

function lookupCallerJsDir() {
    return Caller.lookupDir(lookupCallerJsFile());
}

function hostPageBaseURL() {
    let s = document.location.href;

    // Pull off any hash.
    let i = s.indexOf('#');
    if (i !== -1)
        s = s.substring(0, i);

    // Pull off any query string.
    i = s.indexOf('?');
    if (i !== -1)
        s = s.substring(0, i);

    // Rip off everything after the last slash.
    i = s.lastIndexOf('/');
    if (i !== -1)
        s = s.substring(0, i);

    // Ensure a final slash if non-empty.
    return s.length > 0 ? `${s}/` : "";
}

function remoteApi() {
    return global.septimajs.config.remoteApi ? global.septimajs.remoteApi : relativeUri();
}

function relativeUri() {
    let pageUrl = hostPageBaseURL();
    pageUrl = pageUrl.substring(0, pageUrl.length - 1);
    return pageUrl;
}

function resourceUri(aResourceName) {
    if (/https?:\//.test(aResourceName))
        return aResourceName;
    else {
        return relativeUri() + global.septimajs.config.sourcePath + aResourceName;
    }
}

function toFilyAppModuleId(relativePath, startPoint) {
    const moduleIdNormalizer = document.createElement('div');
    moduleIdNormalizer.innerHTML = `<a href="${startPoint}/${relativePath}">o</a>`;
    // TODO: check if decodeURIComponent is applicable instead of decodeURI.
    const mormalizedAbsoluteModuleUrl = decodeURI(moduleIdNormalizer.firstChild.href);
    const hostContextPrefix = relativeUri() + global.septimajs.config.sourcePath;
    const hostContextNormalizer = document.createElement('div');
    hostContextNormalizer.innerHTML = `<a href="${hostContextPrefix}">o</a>`;
    const mormalizedHostContextPrefix = decodeURI(hostContextNormalizer.firstChild.href);
    const mormalizedRelativeModuleUrl = mormalizedAbsoluteModuleUrl.substring(mormalizedHostContextPrefix.length);
    if (mormalizedRelativeModuleUrl === '')
        throw `Module reference '${relativePath}' couldn't be resolved, starting from '${startPoint}'`;
    return mormalizedRelativeModuleUrl;
}

function load(aResourceName, aBinary, onSuccess, onFailure) {
    let url;
    if (aResourceName.startsWith('./') || aResourceName.startsWith('../')) {
        const callerDir = lookupCallerJsDir();
        url = resourceUri(toFilyAppModuleId(aResourceName, callerDir));
    } else {
        url = resourceUri(aResourceName);
    }
    if (onSuccess) {
        return startDownloadRequest(url, aBinary ? 'arraybuffer' : '', xhr => {
            if (200 <= xhr.status && xhr.status < 300) {
                if (xhr.responseType === 'arraybuffer') {
                    const buffer = xhr.response;
                    buffer.length = buffer.byteLength;
                    onSuccess(buffer);
                } else {
                    onSuccess(xhr.responseText);
                }
            } else {
                if (onFailure) {
                    onFailure(xhr.statusText);
                }
            }
        }, aResult => {
            if (onFailure) {
                onFailure(aResult.status ? (`${aResult.status} : ${aResult.statusText}`) : "It seems, that request has been cancelled. See browser's console for more details.");
            }
        });
    }
    return null;
}

function upload(aFile, aName, onComplete, onProgresss, onFailure) {
    if (aFile) {
        let completed = false;
        return startUploadRequest(aFile, aName, aResult => {
            completed = true;
            if (onComplete) {
                onComplete(JSON.parse(aResult));
            }
        }, aResult => {
            try {
                if (!completed) {
                    if (onProgresss) {
                        onProgresss(aResult);
                    }
                }
            } catch (ex) {
                Logger.severe(ex);
            }
        }, reason => {
            if (onFailure) {
                try {
                    onFailure(reason);
                } catch (ex) {
                    Logger.severe(ex);
                }
            }
        });
    }
}

function startDownloadRequest(url, responseType, onSuccess, onFailure) {
    const req = new XMLHttpRequest();
    req.open('get', url);
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
                    onFailure(req);
                }
            }
        }
    };
    if (responseType) {
        req.responseType = responseType;
    }
    req.send();
    return {
        cancel: function() {
            req.onreadystatechange = null;
            req.abort();
        }
    };
}

function startUploadRequest(aFile, aName, onComplete, onProgress, onFailure) {
    const req = new XMLHttpRequest();
    req.open('post', remoteApi() + global.septimajs.config.apiUri);
    if (req.upload) {
        req.upload.onprogress = aProgressEvent => {
            if (onProgress) {
                onProgress(aProgressEvent);
            }
        };

        req.upload.onloadend = aProgressEvent => {
            if (onProgress) {
                onProgress(aProgressEvent);
            }
        };

        req.upload.ontimeout = aProgressEvent => {
            if (onFailure) {
                onFailure("Upload timed out");
            }
        };

        req.upload.onabort = aEvent => {
            if (onFailure) {
                onFailure("Upload aborted");
            }
        };

        req.upload.onerror = aEvent => {
            if (onFailure) {
                onFailure(req.responseText ? req.responseText : (`${req.status} : ${req.statusText}`));
            }
        };
    }
    const fd = new FormData();
    fd.append(aFile.name, aFile, aName);
    req.overrideMimeType("multipart/form-data");
    // Must set the onreadystatechange handler before calling send().
    req.onreadystatechange = xhr => {
        if (req.readyState === 4 /*RequestState.DONE*/ ) {
            req.onreadystatechange = null;
            if (200 <= req.status && req.status < 300) {
                if (onComplete) {
                    onComplete(req.responseText);
                }
            } else {
                if (req.status === 0) {
                    onFailure("Upload canceled");
                } else {
                    onFailure(req.responseText ? req.responseText : (`${req.status} : ${req.statusText}`));
                }
            }
        }
    };
    req.send(fd);
    return {
        cancel: function() {
            req.onreadystatechange = null;
            req.abort();
        }
    };
}

function Icon() {}

function loadIcon(aResourceName, onSuccess, onFailure) {
    let url;
    if (aResourceName.startsWith('./') || aResourceName.startsWith('../')) {
        const callerDir = lookupCallerJsDir();
        url = resourceUri(toFilyAppModuleId(aResourceName, callerDir));
    } else {
        url = resourceUri(aResourceName);
    }
    const image = document.createElement('img');
    image.onload = () => {
        image.onload = null;
        image.onerror = null;
        onSuccess(image);
    };
    image.onerror = e => {
        image.onload = null;
        image.onerror = null;
        if (onFailure)
            onFailure(e);
    };
    image.src = url;
    return url;
}
Object.defineProperty(Icon, 'load', {
    get: function() {
        return loadIcon;
    }
});


const module = {};

Object.defineProperty(module, 'Icon', {
    enumerable: true,
    get: function() {
        return Icon;
    }
});
Object.defineProperty(module, 'upload', {
    enumerable: true,
    get: function() {
        return upload;
    }
});
Object.defineProperty(module, 'load', {
    enumerable: true,
    value: function(aResName, onSuccess, onFailure) {
        return load(aResName, true, onSuccess, onFailure);
    }
});
Object.defineProperty(module, 'loadText', {
    enumerable: true,
    value: function(aResName, onSuccess, onFailure) {
        return load(aResName, false, onSuccess, onFailure);
    }
});
Object.defineProperty(module, 'toFilyAppModuleId', {
    get: function() {
        return toFilyAppModuleId;
    }
});
Object.defineProperty(module, 'hostPageBaseURL', {
    get: function() {
        return hostPageBaseURL;
    }
});
Object.defineProperty(module, 'relativeUri', {
    get: function() {
        return relativeUri;
    }
});
Object.defineProperty(module, 'remoteApi', {
    get: function() {
        return remoteApi;
    }
});
export default module;