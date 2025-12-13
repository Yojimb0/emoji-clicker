<script>
	import { onMount } from 'svelte';
	import { gameState, currentRankIndex, currentNews, NEWS, RANKS } from '$lib/stores/gameStore.js';
	import { loadGame, resetGame, saveGame } from '$lib/utils/saveSystem.js';
	import { startGameLoop } from '$lib/helpers/gameLoop.js';
	import { createLog } from '$lib/helpers/logging.js';
	import Header from '$lib/components/Header.svelte';
	import Clicker from '$lib/components/Clicker.svelte';
	import Store from '$lib/components/Store.svelte';
	import TabsView from '$lib/components/TabsView.svelte';
	import LogPopover from '$lib/components/LogPopover.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
	let openPanels = ['main']; // Track which panels are open (array for reactivity)
	let panelOrder = ['main']; // Track order panels were opened (oldest first)
	let floaterContainerRef;
	let stopGameLoop;
	let rankNameRef;
	let emojiRef;
	let panelsContainerRef;
	let maxPanels = 1; // Will be calculated based on viewport
	
	// Reactive farm unlock check
	$: farmUnlocked = ($gameState.inventory?.['garden_patch'] || 0) > 0;
	
	const PANEL_CONFIG = {
		main: { icon: '🎯', label: 'Main' },
		farm: { icon: '🌾', label: 'Farm' },
		shop: { icon: '🛒', label: 'Shop' }
	};
	
	function isPanelOpen(panelId) {
		return openPanels.includes(panelId);
	}
	
	// Reactive statement to ensure updates
	$: mainOpen = openPanels.includes('main');
	$: farmOpen = openPanels.includes('farm');
	$: shopOpen = openPanels.includes('shop');
	$: openPanelsCount = openPanels.length;
	$: panelWidthPercent = openPanelsCount > 0 ? (100 / openPanelsCount) : 0;
	
	function evolve(newIndex) {
		currentRankIndex.set(newIndex);
		const rank = RANKS[newIndex];
		
		if (emojiRef && rankNameRef) {
			emojiRef.style.transform = "scale(0) rotate(180deg)";
			setTimeout(() => {
				emojiRef.textContent = rank.emoji;
				rankNameRef.textContent = rank.name;
				rankNameRef.style.color = rank.color;
				emojiRef.style.transform = "scale(1.2) rotate(0deg)";
				createLog(`Evolution reached: ${rank.name}!`, "text-yellow-400 font-bold");
				setTimeout(() => emojiRef.style.transform = "scale(1)", 200);
			}, 200);
		}
	}
	
	function handleSave() {
		gameState.update(state => {
			saveGame(state);
			createLog("Game Saved", "text-blue-400");
			return state;
		});
	}
	
	function handleReset() {
		if(confirm("Are you sure you want to wipe your progress?")) {
			resetGame();
			location.reload();
		}
	}
	
	function calculateMaxPanels() {
		if (typeof window === 'undefined') return 1;
		const containerWidth = panelsContainerRef?.clientWidth || window.innerWidth;
		const minPanelWidth = 450;
		maxPanels = Math.floor(containerWidth / minPanelWidth);
		return Math.max(1, maxPanels);
	}
	
	function togglePanel(panelId) {
		if (openPanels.includes(panelId)) {
			// Close panel - create new arrays to trigger reactivity
			openPanels = openPanels.filter(p => p !== panelId);
			panelOrder = panelOrder.filter(p => p !== panelId);
		} else {
			// Open panel
			const currentOpenCount = openPanels.length;
			const maxPanelsCount = calculateMaxPanels();
			
			// Create new arrays to ensure reactivity
			let newOpenPanels = [...openPanels];
			let newPanelOrder = [...panelOrder];
			
			if (currentOpenCount >= maxPanelsCount && newPanelOrder.length > 0) {
				// No space, hide oldest panel
				const oldestPanel = newPanelOrder[0];
				newOpenPanels = newOpenPanels.filter(p => p !== oldestPanel);
				newPanelOrder = newPanelOrder.filter(p => p !== oldestPanel);
			}
			
			// Add new panel if not already in list
			if (!newOpenPanels.includes(panelId)) {
				newOpenPanels.push(panelId);
				newPanelOrder.push(panelId);
			}
			
			openPanels = newOpenPanels;
			panelOrder = newPanelOrder;
		}
	}
	
	onMount(() => {
		loadGame();
		
		const cleanup = startGameLoop(null, evolve);
		stopGameLoop = cleanup;
		
		const newsInterval = setInterval(() => {
			const text = NEWS[Math.floor(Math.random() * NEWS.length)];
			currentNews.set(text);
		}, 10000);
		
		// Calculate max panels on mount and resize
		calculateMaxPanels();
		const handleResize = () => {
			calculateMaxPanels();
			// If we have more panels open than can fit, close oldest ones
			const maxPanelsCount = calculateMaxPanels();
			while (openPanels.length > maxPanelsCount) {
				const oldestPanel = panelOrder[0];
				openPanels = openPanels.filter(p => p !== oldestPanel);
				panelOrder = panelOrder.filter(p => p !== oldestPanel);
			}
		};
		window.addEventListener('resize', handleResize);
		
		return () => {
			unsubscribe();
			if (cleanup) cleanup();
			clearInterval(newsInterval);
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<svelte:window title="Emoji Clicker: The Vibe Check" />

<div class="game-container">
	<Header on:save={handleSave} on:reset={handleReset} />
	
	<!-- Tab Bar for Navigation -->
	<div class="tab-bar">
		<Tooltip text="Main" position="top">
			<button 
				class="tab-bar-btn" 
				class:active={mainOpen}
				on:click={() => togglePanel('main')}
			>
				<span class="tab-icon">{PANEL_CONFIG.main.icon}</span>
			</button>
		</Tooltip>
		<Tooltip text={farmUnlocked ? "Farm" : `Farm locked. Purchase 🌻 Garden Patch from the Shop to unlock farming.`} position="top">
			<button 
				class="tab-bar-btn" 
				class:active={farmOpen}
				class:locked={!farmUnlocked}
				on:click={() => togglePanel('farm')}
				disabled={!farmUnlocked}
			>
				<span class="tab-icon">{PANEL_CONFIG.farm.icon}</span>
			</button>
		</Tooltip>
		<Tooltip text="Shop" position="top">
			<button 
				class="tab-bar-btn" 
				class:active={shopOpen}
				on:click={() => togglePanel('shop')}
			>
				<span class="tab-icon">{PANEL_CONFIG.shop.icon}</span>
			</button>
		</Tooltip>
	</div>
	
	<div bind:this={panelsContainerRef} class="panels-container">
		<!-- Main Panel (Clicker) -->
		<div 
			class="panel panel-main" 
			class:open={mainOpen}
			style={mainOpen ? `width: ${panelWidthPercent}%` : 'width: 0'}
		>
			<Clicker bind:floaterContainer={floaterContainerRef} bind:emojiRef bind:rankNameRef />
		</div>
		
		<!-- Farm Panel (TabsView) -->
		<div 
			class="panel panel-farm" 
			class:open={farmOpen}
			style={farmOpen ? `width: ${panelWidthPercent}%` : 'width: 0'}
		>
			<TabsView floaterContainer={floaterContainerRef} />
		</div>
		
		<!-- Shop Panel (Store) -->
		<div 
			class="panel panel-shop" 
			class:open={shopOpen}
			style={shopOpen ? `width: ${panelWidthPercent}%` : 'width: 0'}
		>
			<Store />
		</div>
	</div>
	
	<div bind:this={floaterContainerRef} class="floating-container"></div>
	<LogPopover />
</div>

<style>
	.game-container {
		background-color: #111827;
		background-image: radial-gradient(#374151 1px, transparent 1px);
		background-size: 20px 20px;
		color: white;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	.panels-container {
		flex: 1;
		display: flex;
		overflow: hidden;
		position: relative;
		min-height: 0;
	}
	
	.panel {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;
		background-color: rgba(17, 24, 39, 0.9);
		border-right: 1px solid #374151;
		opacity: 0;
		width: 0;
		transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
		flex-shrink: 0;
		flex-grow: 0;
		pointer-events: none;
	}
	
	.panel.open {
		opacity: 1;
		pointer-events: auto;
		flex-grow: 0;
		flex-shrink: 0;
	}
	
	.panel:last-child {
		border-right: none;
	}
	
	.tab-bar {
		display: flex;
		background-color: #1f2937;
		border-bottom: 1px solid #374151;
		padding: 4px 8px;
		gap: 4px;
		z-index: 30;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}
	
	.tab-bar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background-color: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
		position: relative;
	}
	
	.tab-bar-btn:hover:not(:disabled) {
		background-color: rgba(255, 255, 255, 0.1);
	}
	
	.tab-bar-btn:disabled {
		opacity: 0.75;
		cursor: not-allowed;
		pointer-events: none;
	}
	
	.tab-bar-btn:disabled .tab-icon {
		filter: grayscale(50%) brightness(0.8);
	}
	
	.tab-bar-btn.locked {
		border: 1.5px solid rgba(156, 163, 175, 0.5);
		background-color: rgba(75, 85, 99, 0.3);
		position: relative;
		box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
	}
	
	.tab-bar-btn.locked::after {
		content: '🔒';
		position: absolute;
		top: -4px;
		right: -4px;
		font-size: 12px;
		opacity: 0.9;
		pointer-events: none;
		background-color: rgba(17, 24, 39, 0.9);
		border-radius: 50%;
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
	
	.tab-bar-btn.active {
		background-color: rgba(59, 130, 246, 0.2);
	}
	
	.tab-bar-btn.active::after {
		content: '';
		position: absolute;
		bottom: 2px;
		left: 50%;
		transform: translateX(-50%);
		width: 4px;
		height: 4px;
		background-color: #3b82f6;
		border-radius: 50%;
	}
	
	.tab-icon {
		font-size: 18px;
		line-height: 1;
	}
	
	.floating-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 50;
	}
</style>
