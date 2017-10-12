/* global expect */
import Id from 'septima-utils/id';
import Invoke from 'septima-utils/invoke';
import Request from '../src/requests';
import Resource from '../src/resource';
import mockSeptimaServer from './server-mock';

describe('Septima Api. ', () => {
    beforeAll(() => {
        mockSeptimaServer();
    });
    afterAll(() => {
        XMLHttpRequest.restore();
    });

    it('commit(insert -> update -> delete).success', done => {
        const newPetId = Id.generate();
        const insertRequest = Request.requestCommit([
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
        ], result => {
            expect(result).toBeDefined();
            expect(result).toEqual(1);
            Request.requestCommit([
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
            ], result => {
                expect(result).toBeDefined();
                expect(result).toEqual(1);
                Request.requestCommit([
                    {
                        kind: 'delete',
                        entity: 'pets',
                        keys: {
                            pets_id: newPetId
                        }
                    }
                ], result => {
                    expect(result).toBeDefined();
                    expect(result).toEqual(1);
                    done();
                }, reason => {
                    fail(reason);
                    done();
                });
            }, reason => {
                fail(reason);
                done();
            });
        }, reason => {
            fail(reason);
            done();
        });
        expect(insertRequest).toBeDefined();
        expect(insertRequest.cancel).toBeDefined();
    });
    it('commit.failure.1', done => {
        const request = Request.requestCommit([
            {
                kind: 'insert',
                entity: 'pets',
                data: {
                    name: 'test-pet',
                    type_id: 142841300155478,
                    owner_id: 142841834950629
                }
            }
        ], result => {
            fail('Commit without datum for primary key should lead to an error');
            done();
        }, reason => {
            expect(reason).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('commit.failure.2', done => {
        const request = Request.requestCommit([
            {
                kind: 'insert',
                entity: 'absent-entity',
                data: {
                    pets_id: Id.generate(),
                    type_id: 142841300155478,
                    owner_id: 142841834950629,
                    name: 'test-pet'
                }
            }
        ], result => {
            fail('Commit to absent entity should lead to an error');
            done();
        }, reason => {
            expect(reason).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('data.success', done => {
        const request = Request.requestData('pets', {}, data => {
            expect(data).toBeDefined();
            expect(data.length).toBeDefined();
            expect(data.length).toBeGreaterThan(1);
            done();
        }, reason => {
            fail(reason);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('data.failure', done => {
        const request = Request.requestData('absent-entity', {}, data => {
            fail('Data request for an absent entity should lead to an error');
            done();
        }, reason => {
            expect(reason).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('entity.success.1', done => {
        const request = Request.requestEntity('pets', petsEntity => {
            expect(petsEntity).toBeDefined();
            expect(petsEntity.fields).toBeDefined();
            expect(petsEntity.fields.length).toBeDefined();
            expect(petsEntity.fields.length).toEqual(5);
            expect(petsEntity.parameters).toBeDefined();
            expect(petsEntity.parameters.length).toBeDefined();
            expect(petsEntity.title).toBeDefined();
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('entity.success.2', done => {
        const request = Request.requestEntity('fake-pets', petsEntity => {
            expect(petsEntity).toBeDefined();
            expect(petsEntity.fields).toBeDefined();
            expect(petsEntity.fields.length).toBeDefined();
            expect(petsEntity.fields.length).toEqual(0);
            expect(petsEntity.parameters).toBeDefined();
            expect(petsEntity.parameters.length).toBeDefined();
            expect(petsEntity.title).toBeDefined();
            expect(petsEntity).toBeDefined();
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('entity.failure.1', done => {
        const request = Request.requestEntity('absent-entity', entity => {
            fail('Request about absent entity should lead to an error.');
            done();
        }, e => {
            expect(e).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('entity.failure.cyclic', done => {
        pending('Till cyclic dependencies in entities detection');
        const request = Request.requestEntity('cyclicPets', entity => {
            fail('Request about entity with cyclic reference should lead to an error.');
            done();
        }, e => {
            expect(e).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('loggedInUser.success', done => {
        const request = Request.requestLoggedInUser(princiaplName => {
            expect(princiaplName).toBeDefined();
            expect(princiaplName).toContain('anonymous-');
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('loggedInUser.failure', done => {
        const apiUri = window.septimajs.config.apiUri;
        window.septimajs.config.apiUri = 'absent-uri';
        try {
            const request = Request.requestLoggedInUser(() => {
                fail("Invalid 'loggedInUser' request should lead to anerror");
                done();
            }, e => {
                expect(e).toBeDefined();
                done();
            });
            expect(request).toBeDefined();
            expect(request.cancel).toBeDefined();
        } finally {
            window.septimajs.config.apiUri = apiUri;
        }
    });
    it('logout.success', done => {
        const request = Request.requestLogout(xhr => {
            expect(xhr).toBeDefined();
            expect(xhr.status).toEqual(200);
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('logout.failure', done => {
        const apiUri = window.septimajs.config.apiUri;
        window.septimajs.config.apiUri = 'absent-uri';
        try {
            const request = Request.requestLogout(xhr => {
                fail("Invalid 'logout' request shoiuld lead to an error");
                done();
            }, e => {
                expect(e).toBeDefined();
                done();
            });
            expect(request).toBeDefined();
            expect(request.cancel).toBeDefined();
        } finally {
            window.septimajs.config.apiUri = apiUri;
        }
    });
    it('serverMethodExecution.success', done => {
        const request = Request.requestServerMethodExecution('assets/server-modules/test-server-module', 'echo', [
            JSON.stringify(0),
            JSON.stringify(1),
            JSON.stringify(2),
            JSON.stringify(3)], echo => {
            expect(echo).toBeDefined();
            expect(JSON.parse(echo)).toEqual('0 - 1 - 2 - 3');
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('serverMethodExecution.failure.1', done => {
        const request = Request.requestServerMethodExecution('absent-server-module', 'echo', [
            JSON.stringify(0),
            JSON.stringify(1),
            JSON.stringify(2),
            JSON.stringify(3)], echo => {
            fail('Absent server module should request should lead to an error');
            done();
        }, e => {
            expect(e).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('serverMethodExecution.failure.2', done => {
        const request = Request.requestServerMethodExecution('assets/server-modules/test-server-module', 'failureEcho', [
            JSON.stringify(0),
            JSON.stringify(1),
            JSON.stringify(2),
            JSON.stringify(3)], echo => {
            fail('Error from server code should request should lead to an error');
            done();
        }, e => {
            expect(e).toBeDefined();
            expect(e.description).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('submitForm.success', done => {
        const request = Request.submitForm(`${Resource.remoteApi() + window.septimajs.config.apiUri}/test-form`, 'get', {
            name: 'Jane',
            age: 22
        }, xhr => {
            expect(xhr).toBeDefined();
            expect(xhr.responseText).toBeDefined();
            expect(JSON.parse(xhr.responseText)).toEqual('Jane22');
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('submitForm.failure', done => {
        const request = Request.submitForm(`${Resource.remoteApi() + window.septimajs.config.apiUri}/absent-form`, 'get', {
            name: 'Jane',
            age: 22
        }, xhr => {
            fail('Form submission to absent endpoint should lead to error');
            done();
        }, e => {
            expect(e).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
});