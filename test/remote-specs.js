/* global expect */
import Request from '../src/requests';
import Resource from '../src/resource';
import Id from 'septima-utils/id';
import Invoke from 'septima-utils/invoke';

describe('Septima AJAX requests', () => {
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
            fail('Request about abesent entity should lead to an error.');
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
                fail("Invalid 'loggedInUser' request shoiuld lead to anerror");
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
        const request = Request.requestServerMethodExecution('assets/server-modules/test-sever-module', 'echo', [
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
        const request = Request.requestServerMethodExecution('absent-sever-module', 'echo', [
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
        const request = Request.requestServerMethodExecution('assets/server-modules/test-sever-module', 'failureEcho', [
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
    it('loadText.abs.success', done => {
        const request = Resource.loadText('assets/text-content.xml', loaded => {
            expect(loaded).toBeDefined();
            expect(loaded.length).toBeDefined();
            expect(loaded.length).toEqual(59);
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.text as binary.abs.success', done => {
        const request = Resource.load('assets/text-content.xml', buffer => {
            expect(buffer).toBeDefined();
            expect(buffer.length).toBeDefined();
            expect(buffer.length).toEqual(59);
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.abs.success', done => {
        const request = Resource.load('assets/binary-content.png', buffer => {
            expect(buffer).toBeDefined();
            expect(buffer.length).toBeDefined();
            expect(buffer.length).toEqual(564);
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.abs.failure', done => {
        const request = Resource.load('assets/absent-content.png', buffer => {
            fail('Loading of absent content should lead to an error');
            done();
        }, e => {
            expect(e).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.relative.success', done => {
        const request = Resource.load('../../app/assets/binary-content.png', buffer => {
            expect(buffer).toBeDefined();
            expect(buffer.length).toBeDefined();
            expect(buffer.length).toEqual(564);
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.relative.failure', done => {
        const request = Resource.load('../../app/assets/absent-content.png', buffer => {
            fail('Loading of absent content should lead to an error');
            done();
        }, e => {
            expect(e).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.global.success', done => {
        const request = Resource.load('http://localhost:8085/septima-js-tests/app/assets/binary-content.png', buffer => {
            expect(buffer).toBeDefined();
            expect(buffer.length).toBeDefined();
            expect(buffer.length).toEqual(564);
            done();
        }, e => {
            fail(e);
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.global.failure', done => {
        const request = Resource.load('http://localhost:8085/septima-js-tests/app/assets/absent-content.png', buffer => {
            fail('Loading of absent content should lead to an error');
            done();
        }, e => {
            expect(e).toBeDefined();
            done();
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('upload.success', done => {
        pending('Run it with manual file selection');
        let uploadedTotal = 0;
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            document.body.removeChild(fileInput);
            const request = Resource.upload(file, 'test-uploaded-resource.bin', uploaded => {
                expect(uploaded).toBeDefined();
                expect(Array.isArray(uploaded)).toBeTruthy();
                expect(uploaded.length).toEqual(1);
                expect(uploadedTotal).toBeGreaterThan(0);
                done();
            }, progress => {
                uploadedTotal = progress.total;
            }, e => {
                fail(e);
                done();
            });
            expect(request).toBeDefined();
            expect(request.cancel).toBeDefined();
        };
        document.body.appendChild(fileInput);
        Invoke.later(() => {
            fileInput.click();
        });
    });
});