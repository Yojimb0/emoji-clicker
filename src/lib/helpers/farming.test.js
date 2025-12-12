import { describe, it, expect, beforeEach, vi } from 'vitest';
import { plant, harvest, buyMarketItem } from './farming.js';
import { gameState, FARM_MARKET } from '../stores/gameStore.js';
import { get } from 'svelte/store';

describe('farming helpers', () => {
	let mockState;

	beforeEach(() => {
		mockState = {
			vibes: 1000,
			totalVibes: 1000,
			inventory: {},
			farming: {
				unlocked: true,
				bioVibes: 0,
				plots: Array(9).fill().map((_, i) => ({ id: i, stage: 0, timer: 0, maxTime: 0 })),
				upgrades: {}
			}
		};
		
		gameState.set(mockState);
	});

	describe('plant', () => {
		it('should plant a seed when player has enough vibes', () => {
			const plotId = 0;
			plant(plotId, null);
			
			const state = get(gameState);
			const plot = state.farming.plots.find(p => p.id === plotId);
			
			expect(plot.stage).toBe(1);
			expect(plot.maxTime).toBe(10);
			expect(state.vibes).toBe(900);
		});

		it('should not plant when player lacks vibes', () => {
			gameState.update(s => ({ ...s, vibes: 50 }));
			
			const plotId = 0;
			plant(plotId, null);
			
			const state = get(gameState);
			const plot = state.farming.plots.find(p => p.id === plotId);
			
			expect(plot.stage).toBe(0);
		});

		it('should apply GMO seeds upgrade', () => {
			gameState.update(s => ({
				...s,
				farming: {
					...s.farming,
					upgrades: { gmo_seeds: 1 }
				}
			}));
			
			const plotId = 0;
			plant(plotId, null);
			
			const state = get(gameState);
			const plot = state.farming.plots.find(p => p.id === plotId);
			
			expect(plot.maxTime).toBe(5); // Half time
		});
	});

	describe('harvest', () => {
		it('should harvest a ripe crop', () => {
			gameState.update(s => {
				const plot = s.farming.plots[0];
				plot.stage = 2;
				return s;
			});
			
			const mockEvent = { clientX: 100, clientY: 100 };
			harvest(0, mockEvent, null);
			
			const state = get(gameState);
			const plot = state.farming.plots[0];
			
			expect(plot.stage).toBe(0);
			expect(state.farming.bioVibes).toBe(1);
		});

		it('should not harvest non-ripe crops', () => {
			gameState.update(s => {
				const plot = s.farming.plots[0];
				plot.stage = 1;
				return s;
			});
			
			const initialBioVibes = get(gameState).farming.bioVibes;
			const mockEvent = { clientX: 100, clientY: 100 };
			harvest(0, mockEvent, null);
			
			const state = get(gameState);
			expect(state.farming.bioVibes).toBe(initialBioVibes);
		});
	});

	describe('buyMarketItem', () => {
		it('should buy market item when player has enough bio-vibes', () => {
			gameState.update(s => ({
				...s,
				farming: {
					...s.farming,
					bioVibes: 20
				}
			}));
			
			const fertilizer = FARM_MARKET.find(i => i.id === 'fertilizer');
			buyMarketItem('fertilizer');
			
			const state = get(gameState);
			expect(state.farming.bioVibes).toBe(10); // 20 - 10
			expect(state.farming.upgrades.fertilizer).toBe(1);
		});

		it('should not buy when player lacks bio-vibes', () => {
			gameState.update(s => ({
				...s,
				farming: {
					...s.farming,
					bioVibes: 5
				}
			}));
			
			const initialUpgrades = { ...get(gameState).farming.upgrades };
			buyMarketItem('fertilizer');
			
			const state = get(gameState);
			expect(state.farming.bioVibes).toBe(5);
			expect(state.farming.upgrades).toEqual(initialUpgrades);
		});
	});
});

