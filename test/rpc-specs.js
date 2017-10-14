/* global expect */

import Requests from '../src/requests';
import Rpc from '../src/rpc';
import mockSeptimaServer from './server-mock';

describe('Septima Rpc', () => {
    beforeAll(() => {
        mockSeptimaServer();
    });
    afterAll(() => {
        XMLHttpRequest.restore();
    });

    it('Rpc.proxy', (done) => {
        const proxy = new Rpc.proxy('assets/server-modules/test-server-module');
        const request = new Requests.Cancelable();
        proxy.echo(1, 2, request)
                .then(result => {
                    expect(result).toEqual('1 - 2');
                    done();
                })
                .catch(done.fail);
        expect(request.cancel).toBeDefined();
    });
    it('Rpc.requireRemotes', (done) => {
        Rpc.requireRemotes('assets/server-modules/test-server-module')
                .then((proxy) => {
                    expect(proxy).toBeDefined();
                    done();
                })
                .catch(done.fail);
    });
});