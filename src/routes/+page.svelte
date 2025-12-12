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
	
	<div class="game-area">
		<Clicker bind:floaterContainer={floaterContainerRef} bind:emojiRef bind:rankNameRef />
		<TabsView bind:currentTab {farmUnlocked} floaterContainer={floaterContainerRef} />
		<Store />
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
	
	.game-area {
		flex: 1;
		display: flex;
		overflow: hidden;
	}
	
	.floating-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 50;
	}
</style>
