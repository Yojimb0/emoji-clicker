import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGame, loadGame, resetGame } from './saveSystem.js';
import { gameState } from '../stores/gameStore.js';
import { get } from 'svelte/store';

describe('saveSystem', () => {
	beforeEach(() => {
		// Clear localStorage
		localStorage.clear();
		vi.clearAllMocks();
		
		// Reset game state
		gameState.set({
			vibes: 0,
			totalVibes: 0,
			startTime: Date.now(),
			inventory: {},
			farming: {
				unlocked: false,
				bioVibes: 0,
				plots: Array(9).fill().map((_, i) => ({ id: i, stage: 0, timer: 0, maxTime: 0 })),
				upgrades: {}
			}
		});
	});

	describe('saveGame', () => {
		it('should save game state to localStorage', () => {
			const testState = {
				vibes: 100,
				totalVibes: 500,
				startTime: Date.now(),
				inventory: { cursor: 5 },
				farming: {
					unlocked: true,
					bioVibes: 10,
					plots: [],
					upgrades: { fertilizer: 2 }
				}
			};
			
			saveGame(testState);
			
			expect(localStorage.setItem).toHaveBeenCalledWith(
				'emojiClickerSave',
				expect.stringContaining('"vibes":100')
			);
		});
	});

	describe('loadGame', () => {
		it('should return null when no save exists', () => {
			const result = loadGame();
			expect(result).toBeNull();
		});

		it('should load game state from localStorage', () => {
			const testState = {
				vibes: 100,
				totalVibes: 500,
				startTime: Date.now(),
				inventory: { cursor: 5 },
				farming: {
					unlocked: true,
					bioVibes: 10,
					plots: Array(9).fill().map((_, i) => ({ id: i, stage: 0, timer: 0, maxTime: 0 })),
					upgrades: { fertilizer: 2 }
				}
			};
			
			localStorage.setItem('emojiClickerSave', JSON.stringify(testState));
			localStorage.getItem = vi.fn(() => JSON.stringify(testState));
			
			const result = loadGame();
			expect(result).toBeTruthy();
			expect(result.vibes).toBe(100);
			expect(result.inventory.cursor).toBe(5);
		});

		it('should handle corrupted save data gracefully', () => {
			localStorage.getItem = vi.fn(() => 'invalid json');
			
			const result = loadGame();
			expect(result).toBeNull();
		});
	});

	describe('resetGame', () => {
		it('should clear localStorage', () => {
			resetGame();
			expect(localStorage.removeItem).toHaveBeenCalledWith('emojiClickerSave');
		});
	});
});

