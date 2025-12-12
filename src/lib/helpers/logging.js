import { latestLog, logMessages } from '../stores/gameStore.js';

export function createLog(msg, classes = "") {
	latestLog.set(msg);
	logMessages.update(logs => {
		return [{ msg, classes, time: Date.now() }, ...logs.slice(0, 49)];
	});
}

