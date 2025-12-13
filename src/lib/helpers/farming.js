import { gameState, FARM_MARKET, VEGGIE_TYPES } from '../stores/gameStore.js';
import { saveGame } from '../utils/saveSystem.js';
import { createLog } from './logging.js';
import { spawnFloatingText } from './visuals.js';

export function plant(id, floaterContainer, veggieType = null) {
	gameState.update(state => {
		const cost = 100;
		if (state.farming.bioVibes >= cost) {
			state.farming.bioVibes -= cost;
			const plot = state.farming.plots.find(p => p.id === id);
			plot.stage = 1;
			
			// Set veggie type (default to carrot if not specified)
			if (veggieType && VEGGIE_TYPES.find(v => v.id === veggieType)) {
				plot.veggieType = veggieType;
			} else if (!plot.veggieType) {
				plot.veggieType = 'carrot';
			}
			
			let time = 10;
			// Check for GMO upgrade for this specific veggie type
			const gmoKey = `gmo_${plot.veggieType}`;
			if (state.farming.upgrades[gmoKey]) {
				time /= 2;
			}
			
			plot.maxTime = time;
			plot.timer = time;
			
			const veggie = VEGGIE_TYPES.find(v => v.id === plot.veggieType);
			createLog(`Planted ${veggie.name}!`, "text-green-300");
			saveGame(state);
		} else {
			createLog("Not enough Bio-Vibes to plant! Need 100⚡", "text-red-400");
		}
		return state;
	});
}

export function harvest(id, event, floaterContainer) {
	gameState.update(state => {
		const plot = state.farming.plots.find(p => p.id === id);
		if (plot.stage === 2) {
			plot.stage = 0;
			const plotVeggie = VEGGIE_TYPES.find(v => v.id === plot.veggieType) || VEGGIE_TYPES[0];
			
			// Base yield from veggie type, fertilizer increases it by 10% per active fertilizer
			let yieldAmount = plotVeggie.yield;
			const activeFertilizer = state.farming.fertilizer?.active || 0;
			if (activeFertilizer > 0) {
				yieldAmount *= (1 + (activeFertilizer * 0.1));
			}
			yieldAmount = Math.floor(yieldAmount);
			
			// Add to stocks instead of directly to bioVibes
			if (!state.farming.stocks) state.farming.stocks = { carrot: 0, tomato: 0, corn: 0 };
			state.farming.stocks[plot.veggieType] = (state.farming.stocks[plot.veggieType] || 0) + yieldAmount;
			
			// Get coordinates from event, or use plot center if not available
			let x, y;
			if (event && (event.clientX !== undefined || event.touches)) {
				x = event.clientX || (event.touches && event.touches[0]?.clientX) || 0;
				y = event.clientY || (event.touches && event.touches[0]?.clientY) || 0;
			} else {
				// For hover/focus events, try to get element position
				const target = event?.target || event?.currentTarget;
				if (target) {
					const rect = target.getBoundingClientRect();
					x = rect.left + rect.width / 2;
					y = rect.top + rect.height / 2;
				} else {
					x = window.innerWidth / 2;
					y = window.innerHeight / 2;
				}
			}
			
			if (floaterContainer) {
				spawnFloatingText(floaterContainer, x, y, `+${yieldAmount}${plotVeggie.emoji}`, true);
			}
			createLog(`Harvested ${yieldAmount} ${plotVeggie.name}${yieldAmount > 1 ? 's' : ''}!`, "text-orange-400");
			saveGame(state);
		}
		return state;
	});
}

export function unlockVeggie(veggieId) {
	gameState.update(state => {
		const veggie = VEGGIE_TYPES.find(v => v.id === veggieId);
		if (!veggie) return state;
		
		if (state.farming.unlockedVeggies.includes(veggieId)) {
			createLog(`${veggie.name} already unlocked!`, "text-yellow-400");
			return state;
		}
		
		if (state.farming.bioVibes >= veggie.unlockCost) {
			state.farming.bioVibes -= veggie.unlockCost;
			state.farming.unlockedVeggies.push(veggieId);
			createLog(`Unlocked ${veggie.name}!`, "text-green-400");
			saveGame(state);
		} else {
			createLog(`Not enough Bio-Vibes! Need ${veggie.unlockCost}⚡`, "text-red-400");
		}
		return state;
	});
}

export function convertVeggieStocks(veggieId) {
	gameState.update(state => {
		if (!state.farming.stocks) state.farming.stocks = { carrot: 0, tomato: 0, corn: 0 };
		
		const veggie = VEGGIE_TYPES.find(v => v.id === veggieId);
		if (!veggie) return state;
		
		const stock = state.farming.stocks[veggieId] || 0;
		if (stock === 0) {
			createLog(`No ${veggie.name} stocks to convert!`, "text-yellow-400");
			return state;
		}
		
		// Manual conversion uses base factory rate (1x), factory upgrade gives bonus
		const conversionRate = (state.farming.factory && state.farming.factory.enabled) 
			? state.farming.factory.conversionRate 
			: 1;
		const converted = Math.floor(stock * veggie.factoryRate * conversionRate);
		
		state.farming.stocks[veggieId] = 0;
		state.farming.bioVibes += converted;
		
		createLog(`Converted ${stock}${veggie.emoji} → ${converted}⚡`, "text-blue-400");
		saveGame(state);
		
		return state;
	});
}

export function convertStocksToBioVibes() {
	gameState.update(state => {
		if (!state.farming.factory || !state.farming.factory.enabled) {
			createLog("Factory not enabled!", "text-red-400");
			return state;
		}
		
		if (!state.farming.stocks) state.farming.stocks = { carrot: 0, tomato: 0, corn: 0 };
		
		let totalConverted = 0;
		const conversions = [];
		
		VEGGIE_TYPES.forEach(veggie => {
			const stock = state.farming.stocks[veggie.id] || 0;
			if (stock > 0) {
				const converted = Math.floor(stock * veggie.factoryRate * state.farming.factory.conversionRate);
				totalConverted += converted;
				state.farming.stocks[veggie.id] = 0;
				conversions.push(`${stock}${veggie.emoji} → ${converted}⚡`);
			}
		});
		
		if (totalConverted > 0) {
			state.farming.bioVibes += totalConverted;
			createLog(`Factory converted: ${conversions.join(', ')}`, "text-blue-400");
			saveGame(state);
		} else {
			createLog("No stocks to convert!", "text-yellow-400");
		}
		
		return state;
	});
}

export function buyMarketItem(id) {
	gameState.update(state => {
		const item = FARM_MARKET.find(i => i.id === id);
		if (!item) return state;
		
		// Check if item is already purchased and not stackable
		if (!item.stackable && state.farming.upgrades[id] > 0) {
			createLog(`${item.name} already purchased!`, "text-yellow-400");
			return state;
		}
		
		// Handle factory unlock
		if (id === 'factory') {
			if (state.farming.factory && state.farming.factory.enabled) {
				createLog("Factory already enabled!", "text-yellow-400");
				return state;
			}
			if (state.farming.bioVibes >= item.cost) {
				state.farming.bioVibes -= item.cost;
				if (!state.farming.factory) state.farming.factory = { enabled: false, conversionRate: 1 };
				state.farming.factory.enabled = true;
				state.farming.upgrades[id] = 1;
				createLog(`Bought ${item.name}!`, "text-orange-400");
				saveGame(state);
			} else {
				createLog(`Not enough Bio-Vibes! Need ${item.cost}⚡`, "text-red-400");
			}
			return state;
		}
		
		// Handle extra plots
		if (id === 'extra_plot') {
			const currentPlots = 9 + (state.farming.extraPlots || 0);
			if (currentPlots >= 15) {
				createLog("Maximum plots reached (15)!", "text-yellow-400");
				return state;
			}
			const plotCost = 500 * Math.pow(2, state.farming.extraPlots || 0);
			if (state.farming.bioVibes >= plotCost) {
				state.farming.bioVibes -= plotCost;
				state.farming.extraPlots = (state.farming.extraPlots || 0) + 1;
				const newPlotId = 9 + state.farming.extraPlots - 1;
				state.farming.plots.push({ id: newPlotId, stage: 0, timer: 0, maxTime: 0, veggieType: 'carrot' });
				createLog(`Bought ${item.name}! Total plots: ${9 + state.farming.extraPlots}`, "text-orange-400");
				saveGame(state);
			} else {
				createLog(`Not enough Bio-Vibes! Need ${plotCost}⚡`, "text-red-400");
			}
			return state;
		}
		
		// Regular market items
		if (state.farming.bioVibes >= item.cost) {
			state.farming.bioVibes -= item.cost;
			if (item.stackable) {
				state.farming.upgrades[id] = (state.farming.upgrades[id] || 0) + 1;
				
				// Handle fertilizer separately
				if (id === 'fertilizer') {
					if (!state.farming.fertilizer) {
						state.farming.fertilizer = { purchased: 0, active: 0, lastDecayTime: Date.now() };
					}
					state.farming.fertilizer.purchased += 1;
					state.farming.fertilizer.active += 1;
				}
			} else {
				state.farming.upgrades[id] = 1;
			}
			createLog(`Bought ${item.name}!`, "text-orange-400");
			saveGame(state);
		} else {
			createLog(`Not enough Bio-Vibes! Need ${item.cost}⚡`, "text-red-400");
		}
		return state;
	});
}

export function getExtraPlotCost(extraPlots) {
	return 500 * Math.pow(2, extraPlots || 0);
}

export function getYieldAmount(state, veggieType = 'carrot') {
	const veggie = VEGGIE_TYPES.find(v => v.id === veggieType) || VEGGIE_TYPES[0];
	let yieldAmount = veggie.yield;
	const activeFertilizer = state.farming.fertilizer?.active || 0;
	if (activeFertilizer > 0) {
		yieldAmount *= (1 + (activeFertilizer * 0.1));
	}
	return Math.floor(yieldAmount);
}

export function getFertilizerNextThreshold(veggieType = 'carrot') {
	const veggie = VEGGIE_TYPES.find(v => v.id === veggieType) || VEGGIE_TYPES[0];
	const baseYield = veggie.yield;
	// Find next fertilizer count that increases yield
	for (let i = 1; i <= 100; i++) {
		const yieldAtI = Math.floor(baseYield * (1 + (i * 0.1)));
		const yieldAtPrev = Math.floor(baseYield * (1 + ((i - 1) * 0.1)));
		if (yieldAtI > yieldAtPrev) {
			return i;
		}
	}
	return null;
}

export function getGMORate(state, veggieType) {
	const gmoKey = `gmo_${veggieType}`;
	return state.farming.upgrades[gmoKey] > 0 ? 2 : 1;
}

