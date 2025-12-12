import { BUILDINGS, FARM_MARKET } from '../stores/gameStore.js';

export function getVibesPerSecond(state) {
	let vps = 0;
	BUILDINGS.forEach(b => {
		vps += (state.inventory[b.id] || 0) * b.baseProd;
	});
	
	if (state.farming && state.farming.upgrades['fertilizer']) {
		vps *= (1 + (state.farming.upgrades['fertilizer'] * 0.1));
	}

	return vps;
}

export function getClickPower(state) {
	const vps = getVibesPerSecond(state);
	let power = 1 + (vps * 0.05);
	
	if (state.farming && state.farming.upgrades['cursor_feed']) {
		power *= (1 + (state.farming.upgrades['cursor_feed'] * 0.5));
	}
	
	return power;
}

export function getCost(buildingId, inventory) {
	const b = BUILDINGS.find(x => x.id === buildingId);
	const count = inventory[buildingId] || 0;
	return Math.floor(b.baseCost * Math.pow(1.15, count));
}


