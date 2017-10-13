/* global expect */
import Request from '../src/requests';
import Resource from '../src/resource';
import Id from 'septima-utils/id';
import Invoke from 'septima-utils/invoke';

describe('Septima resources. ', () => {
    it('loadText.abs.success', done => {
        const request = new Request.Cancelable();
        Resource.loadText('base/assets/text-content.xml', request)
                .then(loaded => {
                    expect(loaded).toBeDefined();
                    expect(loaded.length).toBeDefined();
                    expect(loaded.length).toEqual(59);
                    done();
                })
                .catch(e => {
                    done.fail(e);
                });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.text as binary.abs.success', done => {
        const request = new Request.Cancelable();
        Resource.load('base/assets/text-content-as-binary.bin', request)
                .then(buffer => {
                    expect(buffer).toBeDefined();
                    expect(buffer.length).toBeDefined();
                    expect(buffer.length).toEqual(59);
                    done();
                }).catch(e => {
            done.fail(e);
        });
        expect(request).toBeDefined();
        expect(request.cancel).toBeDefined();
    });
    it('load.abs.success', done => {
        const request = new Request.Cancelable();
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
        const request = new Request.Cancelable();
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
        const request = new Request.Cancelable();
        Resource.load('../../../../assets/binary-content.png', request)
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
        const request = new Request.Cancelable();
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
        const request = new Request.Cancelable();
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
        const request = new Request.Cancelable();
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
                done.fail(e);
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