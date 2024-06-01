import { runWorker } from '../utils';
import { SyncWorker } from './Worker';

runWorker(new SyncWorker());
