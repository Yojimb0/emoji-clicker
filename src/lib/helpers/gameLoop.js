import { gameState, currentRankIndex, RANKS } from '../stores/gameStore.js';
import { getVibesPerSecond } from '../utils/gameLogic.js';
import { saveGame } from '../utils/saveSystem.js';
import { createLog } from './logging.js';
import { get } from 'svelte/store';

let lastTime = Date.now();
let autoSaveTimer = 0;
let gameLoopId = null;

export function startGameLoop(onTick, onEvolve) {
	function gameLoop() {
		const now = Date.now();
		const dt = (now - lastTime) / 1000;
		lastTime = now;
		
		gameState.update(state => {
			const vpsValue = getVibesPerSecond(state);
			if (vpsValue > 0) {
				const produced = vpsValue * dt;
				state.vibes += produced;
				state.totalVibes += produced;
			}
			
			// Farming logic
			if (state.farming) {
				state.farming.plots.forEach(plot => {
					if (plot.stage === 1) {
						plot.timer -= dt;
						if (plot.timer <= 0) {
							plot.stage = 2;
							createLog("A crop is ripe!", "text-green-400");
						}
					}
				});
			}
			
			// Check for rank evolution
			const rankIndex = get(currentRankIndex);
			const nextRank = RANKS[rankIndex + 1];
			if (nextRank && state.totalVibes >= nextRank.threshold) {
				if (onEvolve) onEvolve(rankIndex + 1);
			}
			
			return state;
		});
		
		// Auto save
		autoSaveTimer += dt;
		if (autoSaveTimer > 30) {
			gameState.update(state => {
				saveGame(state);
				createLog("Game Saved", "text-blue-400");
				return state;
			});
			autoSaveTimer = 0;
		}
		
		if (onTick) onTick();
		
		gameLoopId = requestAnimationFrame(gameLoop);
	}
	
	gameLoop();
	return () => {
		if (gameLoopId) cancelAnimationFrame(gameLoopId);
	};
}

