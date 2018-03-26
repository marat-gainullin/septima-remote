import Sinon from 'sinon';
import Id from 'septima-utils/id';
import Invoke from 'septima-utils/invoke';

export default () => {
    let petsData = [
        {
            pets_id: 142841883974964,
            owner_id: 142841834950629,
            type_id: 142841300155478,
            name: 'Vasya',
            birthdate: new Date('2015-04-29T00:00:00.0')
        },
        {
            pets_id: 146158847483835,
            owner_id: 146158832109238,
            type_id: 142850046716850,
            name: 'Mickey',
            birthdate: new Date('2015-01-14T15:48:05.124')
        }
    ];

    const restSamples = [
        {name: 'sample1', flag: false, moment: new Date(), amount: 10},
        {name: 'sample2', flag: true,  moment: new Date(), amount: 20},
        {name: 'sample3', flag: false, moment: new Date(), amount: 30},
        {name: 'sample4', flag: false, moment: new Date(), amount: 40}
    ];

    function isHandledUrl(url) {
        return url.includes('/avatars') ||
            url.includes('/commit') ||
            url.includes('/schema') ||
            url.includes('/parameters') ||
            url.includes('/data') ||
            url.includes('/logged-in') ||
            url.includes('/logout') ||
            url.includes('/test-server-module') ||
            url.includes('/test-form') ||
            url.includes('/rest-samples');
    }

    let xhrSpy = Sinon.useFakeXMLHttpRequest();
    xhrSpy.useFilters = true;
    xhrSpy.addFilter((method, url) => {
        return !isHandledUrl(url);
    });
    xhrSpy.onCreate = (xhr) => {

        function respondObj(xhr, bodyObj, statusCode = 200) {
            if (xhr.readyState !== 0) {
                xhr.respond(statusCode, {"Content-Type": "application/json"}, JSON.stringify(bodyObj));
            } else {
                xhr.error();
            }
        }

        Invoke.later(() => {
            if (isHandledUrl(xhr.url)) {
                if (xhr.method.toLowerCase() === 'get') {
                    if (xhr.url.endsWith('schema/pets')) {
                        respondObj(xhr, {
                            pets_id: {
                                description: 'Pet primary key',
                                type: 'Number',
                                pk: true,
                                nullable: false
                            },
                            type_id: {description: "Pet's type reference", type: 'Number', nullable: false},
                            owner_id: {
                                description: 'Owner reference field',
                                type: 'Number',
                                nullable: false
                            },
                            name: {description: "Pet's name", type: 'String', nullable: false},
                            birthdate: {description: "Pet's bith date", type: 'Date', nullable: true}
                        });
                    } else if (xhr.url.endsWith('schema/fake-pets')) {
                        respondObj(xhr, {fake_pets_id: {}});
                    } else if (xhr.url.endsWith('parameters/pets')) {
                        respondObj(xhr, {
                            owner: {
                                description: "Pet's owner key",
                                type: 'Number'
                            }
                        });
                    } else if (xhr.url.endsWith('data/pets')) {
                        respondObj(xhr, petsData);
                    } else if (xhr.url.endsWith('rest-samples')) {
                        respondObj(xhr, restSamples);
                    } else if (xhr.url.endsWith('rest-samples/sample2')) {
                        respondObj(xhr, restSamples[1]);
                    } else if (xhr.url.endsWith('logged-in')) {
                        respondObj(xhr, {userName: `anonymous-${Id.next()}`});
                    } else if (xhr.url.endsWith('logout')) {
                        respondObj(xhr, {});
                    } else if (xhr.url.includes('test-form')) {
                        const name = xhr.url.match(/name=([\da-zA-Z]+)/)[1];
                        const age = xhr.url.match(/age=([\da-zA-Z]+)/)[1];
                        respondObj(xhr, name + age);
                    } else {
                        respondObj(xhr, `Unknown url for GET: ${xhr.url}`, 404);
                    }
                } else if (xhr.method.toLowerCase() === 'post') {
                    if (xhr.url.includes('/avatars')) {
                        if (xhr.url.includes('/avatars-error')) {
                            Invoke.later(() => {
                                xhr.upload.onloadstart({loaded: 0, total: 10});
                                xhr.upload.onprogress({loaded: 3, total: 10});
                                if (xhr.url.includes('/avatars-error-timeout')) {
                                    xhr.upload.ontimeout({loaded: 0, total: 10});
                                    xhr.upload.onloadend({loaded: 3, total: 10});
                                } else if (xhr.url.includes('/avatars-error-io')) {
                                    xhr.upload.onerror({detail: 0, error: 'IOException occured'});
                                    xhr.upload.onloadend({loaded: 3, total: 10});
                                } else if (xhr.url.includes('/avatars-error-abort')) {
                                    xhr.upload.onabort({detail: 0});
                                    xhr.upload.onloadend({loaded: 3, total: 10});
                                } else {
                                    throw `Unknown avatar erroneous upload url '${xhr.url}'`;
                                }
                                xhr.readyState = 4;
                                xhr.status = 0;
                                xhr.onreadystatechange();
                            });
                        } else {
                            Invoke.later(() => {
                                xhr.upload.onloadstart({loaded: 0, total: 10});
                                xhr.upload.onprogress({loaded: 0, total: 10});
                                xhr.upload.onprogress({loaded: 5, total: 10});
                                xhr.upload.onprogress({loaded: 10, total: 10});
                                xhr.upload.onload({loaded: 10, total: 10});
                                xhr.upload.onloadend({loaded: 10, total: 10});
                                Invoke.later(() => {
                                    if (xhr.url.includes('/avatars-plain')) {
                                        xhr.responseText = xhr.url + '/just-uploaded';
                                        xhr.status = 200;
                                        xhr.responseHeaders = {};
                                    } else if (xhr.url.includes('/avatars-json')) {
                                        xhr.responseText = JSON.stringify(xhr.url + '/just-uploaded');
                                        xhr.status = 200;
                                        xhr.responseHeaders = {'content-type': 'application/json;charset=utf-8'};
                                    } else if (xhr.url.includes('/avatars-location')) {
                                        xhr.status = 201;
                                        xhr.responseHeaders = {'location': xhr.url + '/just-uploaded'};
                                    }
                                    xhr.readyState = 4;
                                    xhr.onreadystatechange();
                                });
                            });
                        }
                        //xhr.upload.ontimeout({});
                        //xhr.upload.onabort({});
                        //xhr.upload.onerror({});
                        //xhr.upload.onload({});
                    } else if (xhr.url.includes('test-server-module')) {
                        const params = JSON.parse(xhr.requestBody);
                        const moduleName = 'test-server-module';
                        try {
                            if (xhr.url.endsWith(moduleName + '/echo')) {
                                respondObj(xhr, params.join(' - '));
                            } else if (xhr.url.endsWith(moduleName + '/failureEcho')) {
                                respondObj(xhr, {description: 'Application level error'}, 405);
                            } else {
                                throw `Unknown RPC end point: ${xhr.url}`;
                            }
                        } catch (ex) {
                            respondObj(xhr, JSON.stringify(ex), 405);
                        }
                    } else if (xhr.url.endsWith('commit')) {
                        if (xhr.readyState !== 0) {
                            const log = JSON.parse(xhr.requestBody);
                            let affected = 0;
                            try {
                                log.forEach((item) => {
                                    console.log(item);
                                    switch (item.entity) {
                                        case 'pets':
                                            switch (item.kind) {
                                                case 'insert':
                                                    if (!('pets_id' in item.data))
                                                        throw `Primary key datum missing for entity: ${item.entity}`;
                                                    petsData.push(item.data);
                                                    affected++;
                                                    break;
                                                case 'delete':
                                                    const werePets = petsData.length;
                                                    petsData = petsData.filter((pet) => {
                                                        return pet.pets_id !== item.keys.pets_id;
                                                    });
                                                    affected += werePets - petsData.length;
                                                    break;
                                                case 'update':
                                                    petsData.filter((pet) => {
                                                        return pet.pets_id === item.keys.pets_id;
                                                    }).forEach((pet) => {
                                                        for (let d in item.data) {
                                                            pet[d] = item.data[d];
                                                            affected++;
                                                        }
                                                    });
                                                    break;
                                            }
                                            break;
                                        case 'add-pet':
                                            switch (item.kind) {
                                                case 'command':
                                                    petsData.push({
                                                        pets_id: item.parameters.id,
                                                        owner_id: item.parameters.ownerId,
                                                        type_id: item.parameters.typeId,
                                                        name: item.parameters.name
                                                    });
                                                    affected++;
                                                    break;
                                            }
                                            break;
                                        default:
                                            throw `Unknown entity ${item.entity}`;
                                    }
                                });
                                respondObj(xhr, affected);
                            } catch (ex) {
                                respondObj(xhr, JSON.stringify(ex), 403);
                            }
                        } else {
                            xhr.error();
                        }
                    } else if (xhr.url.includes('test-form')) {
                        const name = xhr.requestBody.match(/name=([\da-zA-Z]+)/)[1];
                        const age = xhr.requestBody.match(/age=([\da-zA-Z]+)/)[1];
                        respondObj(xhr, name + age);
                    } else if (xhr.url.includes('rest-samples')) {
                        restSamples.push(JSON.parse(xhr.requestBody));
                        xhr.respond(201, {"Location": "/rest-samples/sample5"});
                    } else {
                        throw `Unknown url for POST: ${xhr.url}`;
                    }
                } else if (xhr.method.toLowerCase() === 'put') {
                    if(xhr.url.endsWith('rest-samples/sample3')) {
                        const sample3 = JSON.parse(xhr.requestBody);
                        restSamples[2].name = sample3.name;
                        restSamples[2].flag = sample3.flag;
                        restSamples[2].moment = new Date(sample3.moment);
                        restSamples[2].amount = sample3.amount;
                        xhr.respond(200);
                    } else {
                        throw `Unknown url for PUT: ${xhr.url}`;
                    }
                } else if (xhr.method.toLowerCase() === 'delete') {
                    if(xhr.url.endsWith('rest-samples/sample2')) {
                        restSamples.splice(1, 1);
                        xhr.respond(200);
                    } else {
                        throw `Unknown url for DELETE: ${xhr.url}`;
                    }
                } else {
                    xhr.respond(404, {"Content-Type": "application/json"},
                        JSON.stringify({error: `Unknown url: ${xhr.url}`}));
                }
            }
        });
    };
};