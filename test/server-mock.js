import Sinon from 'sinon';
import Id from 'septima-utils/id';
import Invoke from 'septima-utils/invoke';
import Requests from '../src/requests';

export default () => {
    let petsData = [
        {pets_id: 142841883974964, owner_id: 142841834950629, type_id: 142841300155478, name: 'Vasya', birthdate: new Date('2015-04-29T00:00:00.0')},
        {pets_id: 146158847483835, owner_id: 146158832109238, type_id: 142850046716850, name: 'Mickey', birthdate: new Date('2015-01-14T15:48:05.124')}
    ];
    function isHandledUrl(url) {
        return url.includes('/application');
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
                if (xhr.url.endsWith(`application?__type=${Requests.RequestTypes.rqAppEntity}&__queryId=pets`)) {
                    respondObj(xhr, {
                        appelement: 'pets',
                        title: 'Pets entity',
                        fields: [
                            {name: 'pets_id', description: 'Pet primary key', type: 'Number', pk: true, nullable: false},
                            {name: 'type_id', description: "Pet's type reference", type: 'Number', nullable: false},
                            {name: 'owner_id', description: 'Owner reference field', type: 'Number', nullable: false},
                            {name: 'name', description: "Pet's name", type: 'String', nullable: false},
                            {name: 'birthdate', description: "Pet's bith date", type: 'Date', nullable: true}
                        ],
                        parameters: []
                    });
                } else if (xhr.url.endsWith(`application?__type=${Requests.RequestTypes.rqExecuteQuery}&__queryId=pets`)) {
                    respondObj(xhr, petsData);
                } else if (xhr.url.endsWith(`application?__type=${Requests.RequestTypes.rqCredential}`)) {
                    respondObj(xhr, {userName: `anonymous-${Id.generate()}`});
                } else if (xhr.url.endsWith(`application?__type=${Requests.RequestTypes.rqLogout}`)) {
                    respondObj(xhr, {});
                } else if (xhr.url.includes(`application/test-form`)) {
                    const name = xhr.url.match(/name=([\da-zA-Z]+)/)[1];
                    const age = xhr.url.match(/age=([\da-zA-Z]+)/)[1];
                    respondObj(xhr, name + age);
                } else if (xhr.url.endsWith(`application?__type=${Requests.RequestTypes.rqCommit}`)) {
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
                } else if (xhr.method === 'POST') {
                    const moduleName = xhr.requestBody.match(/__moduleName=([\da-zA-Z%\-]+)/)[1].replace(/%2F/gi, '/');
                    const methodName = xhr.requestBody.match(/__methodName=([\da-zA-Z]+)/)[1];
                    const params = xhr.requestBody.match(/__param\[\]=([\da-zA-Z]+)/g).map((param) => {
                        return param.substring('__param[]='.length, param.length);
                    });
                    try {
                        switch (moduleName) {
                            case 'assets/server-modules/test-server-module':
                                switch (methodName) {
                                    case 'echo':
                                        respondObj(xhr, params.join(' - '));
                                        break;
                                    case 'failureEcho':
                                        respondObj(xhr, {description: 'Application level error'}, 403);
                                        break;
                                    default:
                                        throw `Unknown module method name: ${moduleName}.${methodName}`;
                                }
                                break;
                            default:
                                throw `Unknown server module: ${moduleName}`;
                        }
                    } catch (ex) {
                        respondObj(xhr, JSON.stringify(ex), 403);
                    }
                } else {
                    xhr.respond(404, {"Content-Type": "application/json"},
                            JSON.stringify({error: `Unknown url: ${xhr.url}`}));
                }
            }
        });
    };
};