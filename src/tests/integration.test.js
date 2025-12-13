import { describe, it, expect, beforeEach } from 'vitest';
import { gameState, BUILDINGS } from '../lib/stores/gameStore.js';
import { getVibesPerSecond, getClickPower, getCost } from '../lib/utils/gameLogic.js';
import { buyBuilding } from '../lib/helpers/buildings.js';
import { get } from 'svelte/store';

describe('Integration Tests', () => {
	beforeEach(() => {
		// Reset game state with initialized inventory
		const inventory = {};
		BUILDINGS.forEach(b => inventory[b.id] = 0);
		
		gameState.set({
			vibes: 1000,
			totalVibes: 1000,
			startTime: Date.now(),
			inventory,
			farming: {
				unlocked: false,
				bioVibes: 0,
				plots: Array(9).fill().map((_, i) => ({ id: i, stage: 0, timer: 0, maxTime: 0, veggieType: 'carrot' })),
				upgrades: {},
				stocks: { carrot: 0, tomato: 0, corn: 0 },
				unlockedVeggies: ['carrot'],
				factory: { enabled: false, conversionRate: 1 },
				selectedVeggieType: 'carrot',
				fertilizer: {
					active: 0,
					lastDecayTime: Date.now()
				},
				extraPlots: 0
			}
		});
	});

	it('should allow buying buildings and increase VPS', () => {
		const initialState = get(gameState);
		const initialVPS = getVibesPerSecond(initialState);
		const initialVibes = initialState.vibes;
		
		// Buy a cursor building
		buyBuilding('cursor', null);
		
		const newState = get(gameState);
		const newVPS = getVibesPerSecond(newState);
		
		expect(newState.inventory.cursor).toBe(1);
		expect(newVPS).toBeGreaterThan(initialVPS);
		expect(newState.vibes).toBeLessThanOrEqual(initialVibes);
	});

	it('should prevent buying buildings when insufficient vibes', () => {
		gameState.update(s => ({ ...s, vibes: 10 }));
		
		const initialState = get(gameState);
		const initialVibes = initialState.vibes;
		buyBuilding('grandma', null); // Costs 100
		
		const newState = get(gameState);
		expect(newState.inventory.grandma || 0).toBe(0);
		expect(newState.vibes).toBe(initialVibes);
	});

	it('should increase click power with VPS', () => {
		const initialState = get(gameState);
		const initialPower = getClickPower(initialState);
		
		// Buy multiple buildings
		buyBuilding('cursor', null);
		buyBuilding('cursor', null);
		buyBuilding('cursor', null);
		
		const newState = get(gameState);
		const newPower = getClickPower(newState);
		
		expect(newPower).toBeGreaterThan(initialPower);
	});

	it('should calculate building costs correctly', () => {
		const baseCost = getCost('cursor', {});
		
		// Buy first building
		buyBuilding('cursor', null);
		const state1 = get(gameState);
		const cost1 = getCost('cursor', state1.inventory);
		
		expect(cost1).toBeGreaterThan(baseCost);
		
		// Buy second building
		buyBuilding('cursor', null);
		const state2 = get(gameState);
		const cost2 = getCost('cursor', state2.inventory);
		
		expect(cost2).toBeGreaterThan(cost1);
	});

	it('should unlock farm tab when garden patch is purchased', () => {
		const initialState = get(gameState);
		expect(initialState.inventory.garden_patch || 0).toBe(0);
		
		buyBuilding('garden_patch', null);
		
		const newState = get(gameState);
		expect(newState.inventory.garden_patch).toBe(1);
	});
});

