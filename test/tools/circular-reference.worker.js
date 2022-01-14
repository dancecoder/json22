import { JSON22 } from '../../index.js';
import { parentPort } from 'worker_threads'


const a = {};
a.b = a;
try {
    const value = JSON22.stringify(a);
    parentPort.postMessage({ status: 'done', value });
} catch(e) {
    parentPort.postMessage({ status: 'error', e });
}



