import { gameState, currentRankIndex, RANKS } from '../stores/gameStore.js';

export function saveGame(state) {
	if (typeof window !== 'undefined') {
		localStorage.setItem('emojiClickerSave', JSON.stringify(state));
	}
}

export function loadGame() {
	if (typeof window === 'undefined') return null;
	
	const save = localStorage.getItem('emojiClickerSave');
	if (save) {
		try {
			const parsed = JSON.parse(save);
			gameState.load(parsed);
			
			// Recalculate rank
			let rIndex = 0;
			for(let i=0; i<RANKS.length; i++) {
				if(parsed.totalVibes >= RANKS[i].threshold) rIndex = i;
			}
			currentRankIndex.set(rIndex);
			
			return parsed;
		} catch (e) {
			console.error("Save file corrupted", e);
			return null;
		}
	}
	return null;
}

export function resetGame() {
	if (typeof window !== 'undefined') {
		localStorage.removeItem('emojiClickerSave');
		gameState.reset();
		currentRankIndex.set(0);
	}
}


