/* global expect */
import Requests from '../src/requests';
import Resource from '../src/resource';
import mockSeptimaServer from "./server-mock";

describe('Septima resources fetch. ', () => {
    it('loadText.abs.success', done => {
        const request = new Requests.Cancelable();
        Resource.loadText('base/assets/text-content.xml', request)
            .then(loaded => {
                expect(loaded).toBeDefined();
                expect(loaded.length).toBeDefined();
                expect(loaded.length).toEqual(63);
                done();
            })
            .catch(e => {
                done.fail(e);
            });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.text as binary.abs.success', done => {
        const request = new Requests.Cancelable();
        Resource.load('base/assets/text-content-as-binary.bin', request)
            .then(buffer => {
                expect(buffer).toBeDefined();
                expect(buffer.length).toBeDefined();
                expect(buffer.length).toEqual(63);
                done();
            }).catch(e => {
            done.fail(e);
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.abs.success', done => {
        const request = new Requests.Cancelable();
        Resource.load('base/assets/binary-content.png', request)
            .then(buffer => {
                expect(buffer).toBeDefined();
                expect(buffer.length).toBeDefined();
                expect(buffer.length).toEqual(564);
                done();
            })
            .catch(e => {
                done.fail(e);
            });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.abs.failure', done => {
        const request = new Requests.Cancelable();
        Resource.load('base/assets/absent-content.png', request)
            .then(buffer => {
                done.fail('Loading of absent content should lead to an error');
            })
            .catch(e => {
                expect(e).toBeDefined();
                done();
            });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.relative.success', done => {
        const request = new Requests.Cancelable();
        Resource.load('../base/../base/assets/binary-content.png', request)
            .then(buffer => {
                expect(buffer).toBeDefined();
                expect(buffer.length).toBeDefined();
                expect(buffer.length).toEqual(564);
                done();
            })
            .catch(e => {
                done.fail(e);
            });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.relative.failure', done => {
        const request = new Requests.Cancelable();
        Resource.load('../../../../assets/absent-content.png', request)
            .then(buffer => {
                done.fail('Loading of absent content should lead to an error');
            })
            .catch(e => {
                expect(e).toBeDefined();
                done();
            });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.global.success', done => {
        const request = new Requests.Cancelable();
        Resource.load('http://localhost:9876/base/assets/binary-content.png', request)
            .then(buffer => {
                expect(buffer).toBeDefined();
                expect(buffer.length).toBeDefined();
                expect(buffer.length).toEqual(564);
                done();
            })
            .catch(e => {
                done.fail(e);
            });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.global.failure', done => {
        const request = new Requests.Cancelable();
        Resource.load('http://localhost:9876/base/assets/absent-content.png', request)
            .then(buffer => {
                done.fail('Loading of absent content should lead to an error');
            })
            .catch(e => {
                expect(e).toBeDefined();
                done();
            });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
});
describe('Septima resources upload. ', () => {
    beforeAll(() => {
        mockSeptimaServer();
    });
    afterAll(() => {
        XMLHttpRequest.restore();
    });

    function uploadSuccessChecker(targetUri) {
        //pending('Run it with manual file selection');
        return done => {
            let uploadedTotal = 0;
            const file = new File([new Blob()], 'dummy.txt');
            const request = new Requests.Cancelable();
            Resource.upload(targetUri, file, 'test-uploaded-resource.bin', progress => {
                uploadedTotal = progress.loaded;
            }, request)
                .then(uploaded => {
                    expect(uploaded).toBeDefined();
                    expect(uploaded.endsWith('just-uploaded')).toBeTruthy();
                    expect(uploadedTotal).toBeGreaterThan(0);
                    done();
                })
                .catch(done.fail);
            expect(request.cancel).toBeDefined();
        };
    }

    function uploadFailureChecker(targetUri) {
        //pending('Run it with manual file selection');
        return done => {
            let uploadedTotal = 0;
            const file = new File([new Blob()], 'dummy.txt');
            const request = new Requests.Cancelable();
            Resource.upload(targetUri, file, 'test-uploaded-resource.bin', progress => {
                uploadedTotal = progress.loaded;
            }, request)
                .then(uploaded => {
                    done.fail("Failure shouldn't lead to success callback call");
                })
                .catch(e => {
                    expect(uploadedTotal).toBeGreaterThan(0);
                    expect(e).toBeDefined();
                    expect(e.length).toBeGreaterThan(0);
                    done();
                });
            expect(request.cancel).toBeDefined();
        };
    }

    it('upload.success.plain.response', uploadSuccessChecker('/avatars-plain'));
    it('upload.success.json.response', uploadSuccessChecker('/avatars-json'));
    it('upload.success.location.response', uploadSuccessChecker('/avatars-location'));
    it('upload.failure.timeout', uploadFailureChecker('/avatars-error-timeout'));
    it('upload.failure.io', uploadFailureChecker('/avatars-error-io'));
    it('upload.failure.abort', uploadFailureChecker('/avatars-error-abort'));
});

