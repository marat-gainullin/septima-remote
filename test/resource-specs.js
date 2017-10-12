/* global expect */
import Request from '../src/requests';
import Resource from '../src/resource';
import Id from 'septima-utils/id';
import Invoke from 'septima-utils/invoke';

describe('Septima resources. ', () => {
    it('loadText.abs.success', done => {
        const request = Resource.loadText('base/assets/text-content.xml', loaded => {
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
        const request = Resource.load('base/assets/text-content-as-binary.bin', buffer => {
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
        const request = Resource.load('base/assets/binary-content.png', buffer => {
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
        const request = Resource.load('base/assets/absent-content.png', buffer => {
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
        const request = Resource.load('../../../../assets/binary-content.png', buffer => {
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
        const request = Resource.load('../../../../assets/absent-content.png', buffer => {
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
        const request = Resource.load('http://localhost:9876/base/assets/binary-content.png', buffer => {
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
        const request = Resource.load('http://localhost:9876/base/assets/absent-content.png', buffer => {
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