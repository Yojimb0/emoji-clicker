import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock createLog and spawnFloatingText
vi.mock('../lib/helpers/logging.js', () => ({
	createLog: vi.fn()
}));

vi.mock('../lib/helpers/visuals.js', () => ({
	spawnFloatingText: vi.fn()
}));

