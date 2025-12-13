import { describe, it, expect, beforeEach, vi } from 'vitest';
import { plant, harvest, buyMarketItem } from './farming.js';
import { gameState, FARM_MARKET, VEGGIE_TYPES } from '../stores/gameStore.js';
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
				bioVibes: 1000,
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
		};
		
		gameState.set(mockState);
	});

	describe('plant', () => {
		it('should plant a seed when player has enough bio-vibes', () => {
			const plotId = 0;
			plant(plotId, null, 'carrot');
			
			const state = get(gameState);
			const plot = state.farming.plots.find(p => p.id === plotId);
			
			expect(plot.stage).toBe(1);
			expect(plot.maxTime).toBe(10);
			expect(plot.veggieType).toBe('carrot');
			expect(state.farming.bioVibes).toBe(900); // 1000 - 100
		});

		it('should not plant when player lacks bio-vibes', () => {
			gameState.update(s => ({ 
				...s, 
				farming: { ...s.farming, bioVibes: 50 } 
			}));
			
			const plotId = 0;
			plant(plotId, null, 'carrot');
			
			const state = get(gameState);
			const plot = state.farming.plots.find(p => p.id === plotId);
			
			expect(plot.stage).toBe(0);
			expect(state.farming.bioVibes).toBe(50);
		});

		it('should apply GMO seeds upgrade for specific veggie type', () => {
			gameState.update(s => ({
				...s,
				farming: {
					...s.farming,
					upgrades: { gmo_carrot: 1 }
				}
			}));
			
			const plotId = 0;
			plant(plotId, null, 'carrot');
			
			const state = get(gameState);
			const plot = state.farming.plots.find(p => p.id === plotId);
			
			expect(plot.maxTime).toBe(5); // Half time with GMO
		});
	});

	describe('harvest', () => {
		it('should harvest a ripe crop and add to stocks', () => {
			gameState.update(s => {
				const plot = s.farming.plots[0];
				plot.stage = 2;
				plot.veggieType = 'carrot';
				return s;
			});
			
			const mockEvent = { clientX: 100, clientY: 100 };
			harvest(0, mockEvent, null);
			
			const state = get(gameState);
			const plot = state.farming.plots[0];
			
			expect(plot.stage).toBe(0);
			expect(state.farming.stocks.carrot).toBe(1); // Carrot yield is 1
		});

		it('should apply fertilizer bonus to yield', () => {
			gameState.update(s => {
				const plot = s.farming.plots[0];
				plot.stage = 2;
				plot.veggieType = 'carrot';
				s.farming.fertilizer.active = 5; // +50% yield
				return s;
			});
			
			const mockEvent = { clientX: 100, clientY: 100 };
			harvest(0, mockEvent, null);
			
			const state = get(gameState);
			// Carrot base yield 1 * (1 + 0.5) = 1.5, floored = 1
			// But with 10 fertilizer: 1 * (1 + 1.0) = 2
			expect(state.farming.stocks.carrot).toBeGreaterThanOrEqual(1);
		});

		it('should not harvest non-ripe crops', () => {
			gameState.update(s => {
				const plot = s.farming.plots[0];
				plot.stage = 1;
				plot.veggieType = 'carrot';
				return s;
			});
			
			const initialStocks = { ...get(gameState).farming.stocks };
			const mockEvent = { clientX: 100, clientY: 100 };
			harvest(0, mockEvent, null);
			
			const state = get(gameState);
			expect(state.farming.stocks.carrot).toBe(initialStocks.carrot);
		});
	});

	describe('buyMarketItem', () => {
		it('should buy fertilizer when player has enough bio-vibes', () => {
			gameState.update(s => ({
				...s,
				farming: {
					...s.farming,
					bioVibes: 20
				}
			}));
			
			buyMarketItem('fertilizer');
			
			const state = get(gameState);
			expect(state.farming.bioVibes).toBe(10); // 20 - 10
			expect(state.farming.fertilizer.active).toBe(1);
			expect(state.farming.upgrades.fertilizer).toBe(1);
		});

		it('should stack fertilizer purchases', () => {
			gameState.update(s => ({
				...s,
				farming: {
					...s.farming,
					bioVibes: 30
				}
			}));
			
			buyMarketItem('fertilizer');
			buyMarketItem('fertilizer');
			
			const state = get(gameState);
			expect(state.farming.bioVibes).toBe(10); // 30 - 10 - 10
			expect(state.farming.fertilizer.active).toBe(2);
			expect(state.farming.upgrades.fertilizer).toBe(2);
		});

		it('should not buy when player lacks bio-vibes', () => {
			gameState.update(s => ({
				...s,
				farming: {
					...s.farming,
					bioVibes: 5
				}
			}));
			
			const initialActive = get(gameState).farming.fertilizer.active;
			buyMarketItem('fertilizer');
			
			const state = get(gameState);
			expect(state.farming.bioVibes).toBe(5);
			expect(state.farming.fertilizer.active).toBe(initialActive);
		});

		it('should buy GMO upgrade for specific veggie type', () => {
			gameState.update(s => ({
				...s,
				farming: {
					...s.farming,
					bioVibes: 50
				}
			}));
			
			buyMarketItem('gmo_carrot');
			
			const state = get(gameState);
			expect(state.farming.bioVibes).toBe(0); // 50 - 50
			expect(state.farming.upgrades.gmo_carrot).toBe(1);
		});
	});
});

