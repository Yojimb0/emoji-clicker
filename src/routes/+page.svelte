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
	
	let currentTab = 'home';
	let activePanel = 'main'; // 'main', 'activities', 'shop'
	let farmUnlocked = false;
	let floaterContainerRef;
	let stopGameLoop;
	let rankNameRef;
	let emojiRef;
	
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
	
	function switchPanel(panel) {
		activePanel = panel;
	}
	
	onMount(() => {
		loadGame();
		
		const unsubscribe = gameState.subscribe(state => {
			farmUnlocked = (state.inventory['garden_patch'] || 0) > 0;
		});
		
		const cleanup = startGameLoop(null, evolve);
		stopGameLoop = cleanup;
		
		const newsInterval = setInterval(() => {
			const text = NEWS[Math.floor(Math.random() * NEWS.length)];
			currentNews.set(text);
		}, 10000);
		
		return () => {
			unsubscribe();
			if (cleanup) cleanup();
			clearInterval(newsInterval);
		};
	});
</script>

<svelte:window title="Emoji Clicker: The Vibe Check" />

<div class="game-container">
	<Header on:save={handleSave} on:reset={handleReset} />
	
	<div class="panels-container">
		<!-- Main Panel (Clicker) -->
		<div class="panel panel-main" class:active={activePanel === 'main'}>
			<Clicker bind:floaterContainer={floaterContainerRef} bind:emojiRef bind:rankNameRef />
		</div>
		
		<!-- Activities Panel (TabsView) -->
		<div class="panel panel-activities" class:active={activePanel === 'activities'}>
			<TabsView bind:currentTab {farmUnlocked} floaterContainer={floaterContainerRef} />
		</div>
		
		<!-- Shop Panel (Store) -->
		<div class="panel panel-shop" class:active={activePanel === 'shop'}>
			<Store />
		</div>
	</div>
	
	<!-- Tab Bar for Navigation -->
	<div class="tab-bar">
		<button 
			class="tab-bar-btn tab-main" 
			class:active={activePanel === 'main'}
			on:click={() => switchPanel('main')}
		>
			<span class="tab-icon">🎯</span>
			<span class="tab-label">Main</span>
		</button>
		<button 
			class="tab-bar-btn" 
			class:active={activePanel === 'activities'}
			on:click={() => switchPanel('activities')}
		>
			<span class="tab-icon">🎮</span>
			<span class="tab-label">Activities</span>
		</button>
		<button 
			class="tab-bar-btn" 
			class:active={activePanel === 'shop'}
			on:click={() => switchPanel('shop')}
		>
			<span class="tab-icon">🛒</span>
			<span class="tab-label">Shop</span>
		</button>
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
		transition: transform 0.3s ease, opacity 0.3s ease;
		border-right: 1px solid #374151;
		min-height: 0;
		background-color: rgba(17, 24, 39, 0.9);
	}
	
	.panel:last-child {
		border-right: none;
	}
	
	/* Narrow viewport (< 768px): Only one panel visible at a time */
	@media (max-width: 767px) {
		.panel {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: 100%;
			opacity: 0;
			pointer-events: none;
			transform: translateX(100%);
		}
		
		.panel.active {
			opacity: 1;
			pointer-events: auto;
			transform: translateX(0);
			position: relative;
			z-index: 1;
			width: 100%;
			height: 100%;
		}
	}
	
	/* Medium viewport (768px - 1023px): Main always visible on left, others toggle on right */
	@media (min-width: 768px) {
		.panel-main {
			position: relative !important;
			opacity: 1 !important;
			pointer-events: auto !important;
			transform: translateX(0) !important;
			flex: 0 0 50%;
			width: 50% !important;
			height: 100% !important;
			z-index: 1;
		}
		
		.panel-activities,
		.panel-shop {
			position: absolute !important;
			top: 0 !important;
			right: 0 !important;
			bottom: 0 !important;
			left: 50% !important;
			width: 50% !important;
			height: 100% !important;
			opacity: 0;
			pointer-events: none;
			transform: translateX(100%);
			z-index: 2;
		}
		
		.panel-activities.active,
		.panel-shop.active {
			opacity: 1 !important;
			pointer-events: auto !important;
			transform: translateX(0) !important;
		}
	}
	
	/* Wide viewport (≥ 1024px): All three panels visible side by side */
	@media (min-width: 1024px) {
		.panels-container {
			display: flex !important;
		}
		
		.panel {
			position: relative !important;
			opacity: 1 !important;
			pointer-events: auto !important;
			transform: translateX(0) !important;
			left: auto !important;
			right: auto !important;
			top: auto !important;
			bottom: auto !important;
			width: auto !important;
			height: 100% !important;
			flex: 0 0 33.333% !important;
		}
		
		.panel-main {
			flex: 0 0 33.333% !important;
		}
		
		.panel-activities {
			flex: 0 0 33.333% !important;
		}
		
		.panel-shop {
			flex: 0 0 33.333% !important;
		}
		
		.tab-bar {
			display: none !important;
		}
	}
	
	.tab-bar {
		display: flex;
		background-color: #111827;
		border-top: 1px solid #374151;
		padding: 8px;
		gap: 8px;
		z-index: 30;
		box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	/* Hide Main tab on medium viewport since main panel is always visible */
	@media (min-width: 768px) and (max-width: 1023px) {
		.tab-main {
			display: none;
		}
	}
	
	.tab-bar-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px;
		background-color: #1f2937;
		border: 1px solid #374151;
		border-radius: 8px;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.tab-bar-btn:hover {
		background-color: #374151;
		color: white;
	}
	
	.tab-bar-btn.active {
		background-color: #fbbf24;
		color: #111827;
		border-color: #fbbf24;
	}
	
	.tab-icon {
		font-size: 20px;
	}
	
	.tab-label {
		font-size: 12px;
		font-weight: bold;
	}
	
	.floating-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 50;
	}
</style>
