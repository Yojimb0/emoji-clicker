import { describe, it, expect, beforeEach } from 'vitest';
import { getVibesPerSecond, getClickPower, getCost } from './gameLogic.js';
import { BUILDINGS } from '../stores/gameStore.js';

describe('gameLogic', () => {
	let mockState;

	beforeEach(() => {
		mockState = {
			vibes: 0,
			totalVibes: 0,
			inventory: {},
			farming: {
				unlocked: false,
				bioVibes: 0,
				plots: [],
				upgrades: {}
			}
		};
		
		// Initialize inventory
		BUILDINGS.forEach(b => {
			mockState.inventory[b.id] = 0;
		});
	});

	describe('getVibesPerSecond', () => {
		it('should return 0 when no buildings are owned', () => {
			expect(getVibesPerSecond(mockState)).toBe(0);
		});

		it('should calculate VPS correctly with buildings', () => {
			mockState.inventory.cursor = 2; // 2 * 0.5 = 1.0
			mockState.inventory.grandma = 1; // 1 * 3 = 3.0
			expect(getVibesPerSecond(mockState)).toBe(4.0);
		});

		it('should apply fertilizer bonus', () => {
			mockState.inventory.cursor = 10; // 10 * 0.5 = 5.0
			mockState.farming.upgrades.fertilizer = 1; // +10%
			expect(getVibesPerSecond(mockState)).toBe(5.5);
		});

		it('should stack multiple fertilizer upgrades', () => {
			mockState.inventory.cursor = 10; // 10 * 0.5 = 5.0
			mockState.farming.upgrades.fertilizer = 3; // +30%
			expect(getVibesPerSecond(mockState)).toBe(6.5);
		});
	});

	describe('getClickPower', () => {
		it('should return base power of 1', () => {
			expect(getClickPower(mockState)).toBe(1);
		});

		it('should increase with VPS', () => {
			mockState.inventory.cursor = 20; // 20 * 0.5 = 10 VPS
			// Power = 1 + (10 * 0.05) = 1.5
			expect(getClickPower(mockState)).toBeCloseTo(1.5);
		});

		it('should apply cursor feed bonus', () => {
			mockState.inventory.cursor = 20; // 10 VPS
			mockState.farming.upgrades.cursor_feed = 1; // +50%
			// Power = (1 + 0.5) * 1.5 = 2.25
			expect(getClickPower(mockState)).toBeCloseTo(2.25);
		});
	});

	describe('getCost', () => {
		it('should return base cost for first purchase', () => {
			const cursor = BUILDINGS.find(b => b.id === 'cursor');
			expect(getCost('cursor', mockState.inventory)).toBe(cursor.baseCost);
		});

		it('should increase cost exponentially', () => {
			mockState.inventory.cursor = 1;
			const baseCost = BUILDINGS.find(b => b.id === 'cursor').baseCost;
			const expectedCost = Math.floor(baseCost * Math.pow(1.15, 1));
			expect(getCost('cursor', mockState.inventory)).toBe(expectedCost);
		});

		it('should handle multiple purchases', () => {
			mockState.inventory.cursor = 5;
			const baseCost = BUILDINGS.find(b => b.id === 'cursor').baseCost;
			const expectedCost = Math.floor(baseCost * Math.pow(1.15, 5));
			expect(getCost('cursor', mockState.inventory)).toBe(expectedCost);
		});
	});
});

