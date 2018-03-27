/* global expect */
import Id from 'septima-utils/id';
import Requests from '../src/requests';
import Resource from '../src/resource';
import mockSeptimaServer from './server-mock';

describe('Septima Requests. ', () => {
    beforeAll(() => {
        mockSeptimaServer();
    });
    afterAll(() => {
        XMLHttpRequest.restore();
    });

    it('commit(insert -> update -> delete).success', done => {
        const newPetId = Id.next();
        const manager = {};
        Requests.requestCommit([
            {
                kind: 'insert',
                entity: 'pets',
                data: {
                    pets_id: newPetId,
                    type_id: 142841300155478,
                    owner_id: 142841834950629,
                    name: 'test-pet'
                }
            }
        ], manager)
                .then(result => {expect(result).toBeDefined();
                    expect(result).toEqual(1);
                    return Requests.requestCommit([
                        {
                            kind: 'update',
                            entity: 'pets',
                            keys: {
                                pets_id: newPetId
                            },
                            data: {
                                name: 'test-pet-updated'
                            }
                        }
                    ]);
                })
                .then(result => {
                    expect(result).toBeDefined();
                    expect(result).toEqual(1);
                    return Requests.requestCommit([
                        {
                            kind: 'delete',
                            entity: 'pets',
                            keys: {
                                pets_id: newPetId
                            }
                        }
                    ]);
                })
                .then(result => {
                    expect(result).toBeDefined();
                    expect(result).toEqual(1);
                    done();
                })
                .catch(reason => {
                    done.fail(reason);
                });
        expect(manager).toBeDefined();
        expect(manager.cancel).toBeDefined();
    });
    it('commit.failure.1', done => {
        const request = new Requests.Cancelable();
        Requests.requestCommit([
            {
                kind: 'insert',
                entity: 'pets',
                data: {
                    name: 'test-pet',
                    type_id: 142841300155478,
                    owner_id: 142841834950629
                }
            }
        ], request)
                .then(result => {
                    done.fail('Commit without datum for primary key should lead to an error');
                })
                .catch(reason => {
                    expect(reason).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('commit.failure.2', done => {
        const request = new Requests.Cancelable();
        Requests.requestCommit([
            {
                kind: 'insert',
                entity: 'absent-entity',
                data: {
                    pets_id: Id.next(),
                    type_id: 142841300155478,
                    owner_id: 142841834950629,
                    name: 'test-pet'
                }
            }
        ], request)
                .then(result => {
                    done.fail('Commit to absent entity should lead to an error');
                })
                .catch(reason => {
                    expect(reason).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('data.success', done => {
        const request = new Requests.Cancelable();
        Requests.requestData('pets', {}, request)
                .then(data => {
                    expect(data).toBeDefined();
                    expect(data.length).toBeDefined();
                    expect(data.length).toBeGreaterThan(1);
                    done();
                })
                .catch(reason => {
                    fail(reason);
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('data.failure', done => {
        const request = new Requests.Cancelable();
        Requests.requestData('absent-entity', {}, request)
                .then(data => {
                    fail('Data request for an absent entity should lead to an error');
                    done();
                })
                .catch(reason => {
                    expect(reason).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('schema.success.1', done => {
        const request = new Requests.Cancelable();
        Requests.requestSchema('pets', request)
                .then(petsFields => {
                    expect(petsFields).toBeDefined();
                    expect(petsFields.pets_id).toBeDefined();
                    expect(petsFields.birthdate).toBeDefined();
                    expect(petsFields.type_id).toBeDefined();
                    done();
                })
                .catch(e => {
                    done.fail(e);
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('schema.success.2', done => {
        const request = new Requests.Cancelable();
        Requests.requestSchema('fake-pets', request)
                .then(fakePetsFields => {
                    expect(fakePetsFields).toBeDefined();
                    expect(fakePetsFields.fake_pets_id).toBeDefined();
                    done();
                })
                .catch(e => {
                    done.fail(e);
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('schema.failure', done => {
        const request = new Requests.Cancelable();
        Requests.requestSchema('absent-entity', request)
                .then(fields => {
                    done.fail('Request about absent entity should lead to an error.');
                })
                .catch(e => {
                    expect(e).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('schema.failure.cyclic', done => {
        pending('Till cyclic dependencies in entities detection');
        const request = new Requests.Cancelable();
        Requests.requestSchema('cyclicPets', request)
                .then(fields => {
                    done.fail('Request about entity with cyclic reference should lead to an error.');
                })
                .catch(e => {
                    expect(e).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('parameters.success', done => {
        const request = new Requests.Cancelable();
        Requests.requestParameters('pets', request)
            .then(petsParameters => {
                expect(petsParameters).toBeDefined();
                expect(petsParameters.owner).toBeDefined();
                done();
            })
            .catch(e => {
                done.fail(e);
            });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('parameters.failure', done => {
        const request = new Requests.Cancelable();
        Requests.requestParameters('absent-entity', request)
                .then(petsParameters => {
                    done.fail('Request about absent entity should lead to an error.');
                })
                .catch(e => {
                    expect(e).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('loggedInUser.success', done => {
        const request = new Requests.Cancelable();
        Requests.requestLoggedInUser(request)
                .then(princiaplName => {
                    expect(princiaplName).toBeDefined();
                    expect(princiaplName).toContain('anonymous-');
                    done();
                })
                .catch(e => {
                    done.fail(e);
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('loggedInUser.failure', done => {
        const loggedInUri = window.septimajs.config.loggedInUri;
        window.septimajs.config.loggedInUri = 'absent-uri';
        try {
            const request = new Requests.Cancelable();
            Requests.requestLoggedInUser(request)
                    .then(() => {
                        done.fail("Invalid 'loggedInUser' request should lead to an error");
                    })
                    .catch(e => {
                        expect(e).toBeDefined();
                        done();
                    });
            expect(request).toBeDefined();
            expect(request.cancel).toBeDefined();
        } finally {
            window.septimajs.config.loggedInUri = loggedInUri;
        }
    });
    it('logout.success', done => {
        const request = new Requests.Cancelable();
        Requests.requestLogout(request)
                .then(xhr => {
                    expect(xhr).toBeDefined();
                    expect(xhr.status).toEqual(200);
                    done();
                }).catch(e => {
            done.fail(e);
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('logout.failure', done => {
        const logoutUri = window.septimajs.config.logoutUri;
        window.septimajs.config.logoutUri = 'absent-uri';
        try {
            const request = new Requests.Cancelable();
            Requests.requestLogout(request)
                    .then(xhr => {
                        fail("Invalid 'logout' request shoiuld lead to an error");
                        done();
                    })
                    .catch(e => {
                        expect(e).toBeDefined();
                        done();
                    });
            expect(request).toBeDefined();
            expect(request.cancel).toBeDefined();
        } finally {
            window.septimajs.config.logoutUri = logoutUri;
        }
    });
    it('rpc.success', done => {
        const request = new Requests.Cancelable();
        Requests.requestRpc('assets/server-modules/test-server-module', 'echo', [
            JSON.stringify(0),
            JSON.stringify(1),
            JSON.stringify(2),
            JSON.stringify(3)], request)
                .then(echo => {
                    expect(echo).toBeDefined();
                    expect(echo).toEqual('0 - 1 - 2 - 3');
                    done();
                })
                .catch(e => {
                    done.fail(e);
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('rpc.failure.1', done => {
        const request = new Requests.Cancelable();
        Requests.requestRpc('absent-server-module', 'echo', [
            JSON.stringify(0),
            JSON.stringify(1),
            JSON.stringify(2),
            JSON.stringify(3)], request)
                .then(echo => {
                    done.fail('Absent server module should request should lead to an error');
                })
                .catch(e => {
                    expect(e).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('rpc.failure.2', done => {
        const request = new Requests.Cancelable();
        Requests.requestRpc('assets/server-modules/test-server-module', 'failureEcho', [
            JSON.stringify(0),
            JSON.stringify(1),
            JSON.stringify(2),
            JSON.stringify(3)], request)
                .then(echo => {
                    done.fail('Error from server code should request should lead to an error');
                })
                .catch(e => {
                    expect(e).toBeDefined();
                    expect(e.description).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('submitForm.get.success', done => {
        const request = new Requests.Cancelable();
        Requests.submitForm(`${Resource.remoteApi()}/test-form`, 'get', {
            name: 'Jane',
            age: 22
        }, request)
                .then(xhr => {
                    expect(xhr).toBeDefined();
                    expect(xhr.responseText).toBeDefined();
                    expect(JSON.parse(xhr.responseText)).toEqual('Jane22');
                    done();
                })
                .catch(e => {
                    done.fail(e);
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('submitForm.post.success', done => {
        const request = new Requests.Cancelable();
        Requests.submitForm(`${Resource.remoteApi()}/test-form`, 'post', {
            name: 'Jane',
            age: 22
        }, request)
                .then(xhr => {
                    expect(xhr).toBeDefined();
                    expect(xhr.responseText).toBeDefined();
                    expect(JSON.parse(xhr.responseText)).toEqual('Jane22');
                    done();
                })
                .catch(e => {
                    done.fail(e);
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('submitForm.get.failure', done => {
        const request = new Requests.Cancelable();
        Requests.submitForm(`${Resource.remoteApi()}/absent-form`, 'get', {
            name: 'Jane',
            age: 22
        }, request)
                .then(xhr => {
                    done.fail('Form submission to absent endpoint should lead to error');
                })
                .catch(e => {
                    expect(e).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('submitForm.post.failure', done => {
        const request = new Requests.Cancelable();
        Requests.submitForm(`${Resource.remoteApi()}/absent-form`, 'post', {
            name: 'Jane',
            age: 22
        }, request)
                .then(xhr => {
                    done.fail('Form submission to absent endpoint should lead to error');
                })
                .catch(e => {
                    expect(e).toBeDefined();
                    done();
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
});