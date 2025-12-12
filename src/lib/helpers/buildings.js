import { gameState, BUILDINGS } from '../stores/gameStore.js';
import { getCost } from '../utils/gameLogic.js';
import { saveGame } from '../utils/saveSystem.js';
import { createLog } from './logging.js';
import { spawnBuildingVisual } from './visuals.js';

export function buyBuilding(id, visualContainer) {
	gameState.update(state => {
		const cost = getCost(id, state.inventory);
		if (state.vibes >= cost) {
			state.vibes -= cost;
			state.inventory[id] = (state.inventory[id] || 0) + 1;
			
			const building = BUILDINGS.find(b => b.id === id);
			createLog(`Bought ${building.name}`, "text-green-400");
			
			if (visualContainer) {
				spawnBuildingVisual(visualContainer, id);
			}
			
			saveGame(state);
		}
		return state;
	});
}

