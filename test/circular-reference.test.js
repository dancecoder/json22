import { Worker } from 'worker_threads';
import { test, suite } from 'mocha';
import { strict as assert } from 'assert';


suite('Circular reference tests', function () {

    test('object - circle reference', function (done) {
        const worker = new Worker('./test/tools/circular-reference.worker.js');
        worker.on('error', (error) => {
            assert.fail(error.message);
        });
        worker.on('message', (message) => {
            assert.equal(message.status, 'error');
            assert.equal(message.e.message, 'Circular reference found');
        });
        worker.on('exit', (code) => {
            if (code > 0) {
                assert.fail('Worker has been terminated');
            }
            done();
        });
        setTimeout(() => {
            worker.terminate();
        }, 1000);
    });

});

