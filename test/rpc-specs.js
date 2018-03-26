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

    it('Rpc.proxy', done => {
        const proxy = new Rpc.proxy('test-server-module');
        const request = new Requests.Cancelable();
        proxy.echo(1, 2, request)
            .then(result => {
                expect(result).toEqual('1 - 2');
                done();
            })
            .catch(done.fail);
        expect(request.cancel).toBeDefined();
    });
    it('Rpc.Rest.get', done => {
        const point = new Rpc.Rest('/rest-samples');
        point.get()
            .then(samples => {
                expect(samples).toBeDefined();
                expect(samples.length).toEqual(4);
                expect(samples[0].name).toEqual('sample1');
                expect(samples[1].flag).toBeTruthy();
                expect(samples[2].moment).toBeDefined();
                expect(samples[3].amount).toEqual(40);
            })
            .then(done)
            .catch(done.fail)
    });
    it('Rpc.Rest.get.byKey', done => {
        const point = new Rpc.Rest('/rest-samples/sample2');
        point.get()
            .then(sample => {
                expect(sample).toBeDefined();
                expect(sample.name).toEqual('sample2');
                expect(sample.flag).toBeTruthy();
                expect(sample.moment).toBeDefined();
                expect(sample.amount).toEqual(20);
            })
            .then(done)
            .catch(done.fail)
    });
    it('Rpc.Rest.post', done => {
        const point = new Rpc.Rest('/rest-samples');
        point.post({name: 'sample5', flag: true, moment: new Date(), amount: 50})
            .then(location => {
                expect(location).toBeDefined();
                expect(location).toEqual('/rest-samples/sample5');
            })
            .then(done)
            .catch(done.fail)
    });
    it('Rpc.Rest.put.byKey', done => {
        const point = new Rpc.Rest('/rest-samples');
        point.put('sample3', {name: 'sample3-updated', flag: true, moment: new Date(), amount: 33})
            .then(responseText => {
                expect(responseText).toBeDefined();
                expect(responseText).toEqual('');
            })
            .then(done)
            .catch(done.fail)
    });
    it('Rpc.Rest.delete.byKey', done => {
        const point = new Rpc.Rest('/rest-samples');
        point.delete('sample2')
            .then(responseText => {
                expect(responseText).toBeDefined();
                expect(responseText).toEqual('');
            })
            .then(done)
            .catch(done.fail)
    });
});
