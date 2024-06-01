import { debug as parentDebug } from 'engine/debug';

export const debug = parentDebug.extend('workers');
