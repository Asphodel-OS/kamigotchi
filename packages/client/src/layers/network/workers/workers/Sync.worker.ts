import { runWorker } from "./utils";
import { SyncWorker } from "./SyncWorker";

runWorker(new SyncWorker());
