import { gameState, FARM_MARKET } from '../stores/gameStore.js';
import { saveGame } from '../utils/saveSystem.js';
import { createLog } from './logging.js';
import { spawnFloatingText } from './visuals.js';

export function plant(id, floaterContainer) {
	gameState.update(state => {
		const cost = 100;
		if (state.vibes >= cost) {
			state.vibes -= cost;
			const plot = state.farming.plots.find(p => p.id === id);
			plot.stage = 1;
			
			let time = 10;
			if (state.farming.upgrades['gmo_seeds']) time /= 2;
			
			plot.maxTime = time;
			plot.timer = time;
			
			createLog("Planted a seed.", "text-green-300");
			saveGame(state);
		} else {
			createLog("Not enough vibes to plant!", "text-red-400");
		}
		return state;
	});
}

export function harvest(id, event, floaterContainer) {
	gameState.update(state => {
		const plot = state.farming.plots.find(p => p.id === id);
		if (plot.stage === 2) {
			plot.stage = 0;
			const yieldAmount = 1;
			state.farming.bioVibes += yieldAmount;
			
			const x = event.clientX || 0;
			const y = event.clientY || 0;
			if (floaterContainer) {
				spawnFloatingText(floaterContainer, x, y, `+${yieldAmount}🥕`, true);
			}
			createLog("Harvested a Bio-Vibe!", "text-orange-400");
			saveGame(state);
		}
		return state;
	});
}

export function buyMarketItem(id) {
	gameState.update(state => {
		const item = FARM_MARKET.find(i => i.id === id);
		if (state.farming.bioVibes >= item.cost) {
			state.farming.bioVibes -= item.cost;
			state.farming.upgrades[id] = (state.farming.upgrades[id] || 0) + 1;
			createLog(`Bought ${item.name}!`, "text-orange-400");
			saveGame(state);
		}
		return state;
	});
}

