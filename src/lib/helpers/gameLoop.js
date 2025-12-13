import { gameState, currentRankIndex, RANKS, VEGGIE_TYPES } from '../stores/gameStore.js';
import { getVibesPerSecond } from '../utils/gameLogic.js';
import { saveGame } from '../utils/saveSystem.js';
import { createLog } from './logging.js';
import { get } from 'svelte/store';

let lastTime = Date.now();
let autoSaveTimer = 0;
let factoryTimer = 0;
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
				// Fertilizer decay (1 per hour)
				if (state.farming.fertilizer && state.farming.fertilizer.active > 0) {
					const now = Date.now();
					const lastDecay = state.farming.fertilizer.lastDecayTime || now;
					const hoursSinceDecay = (now - lastDecay) / (1000 * 60 * 60);
					
					if (hoursSinceDecay >= 1) {
						const decayAmount = Math.floor(hoursSinceDecay);
						state.farming.fertilizer.active = Math.max(0, state.farming.fertilizer.active - decayAmount);
						state.farming.fertilizer.lastDecayTime = now - ((hoursSinceDecay - decayAmount) * 1000 * 60 * 60);
						
						if (decayAmount > 0) {
							createLog(`Fertilizer decayed: -${decayAmount} (${state.farming.fertilizer.active} remaining)`, "text-yellow-400");
							saveGame(state);
						}
					}
				}
				
				state.farming.plots.forEach(plot => {
					if (plot.stage === 1) {
						plot.timer -= dt;
						if (plot.timer <= 0) {
							plot.stage = 2;
							const veggie = VEGGIE_TYPES.find(v => v.id === plot.veggieType);
							createLog(`A ${veggie?.name || 'crop'} is ripe!`, "text-green-400");
						}
					}
				});
				
				// Factory automatic conversion (every 5 seconds)
				if (state.farming.factory && state.farming.factory.enabled) {
					factoryTimer += dt;
					if (factoryTimer >= 5) {
						factoryTimer = 0;
						const stocks = state.farming.stocks || { carrot: 0, tomato: 0, corn: 0 };
						let totalConverted = 0;
						
						VEGGIE_TYPES.forEach(veggie => {
							const stock = stocks[veggie.id] || 0;
							if (stock > 0) {
								const converted = Math.floor(stock * veggie.factoryRate * state.farming.factory.conversionRate);
								totalConverted += converted;
								stocks[veggie.id] = 0;
							}
						});
						
						if (totalConverted > 0) {
							state.farming.bioVibes += totalConverted;
							state.farming.stocks = stocks;
							createLog(`Factory auto-converted ${totalConverted}⚡`, "text-blue-400");
							saveGame(state);
						}
					}
				}
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

