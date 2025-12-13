<script>
	import { onMount } from 'svelte';
	import { gameState, currentRankIndex, RANKS } from '../stores/gameStore.js';
	import { getVibesPerSecond, getClickPower } from '../utils/gameLogic.js';
	import { spawnFloatingText, spawnParticle, initBackgroundVisuals } from '../helpers/visuals.js';
	
	export let floaterContainer;
	export let emojiRef;
	export let rankNameRef;
	
	let vibes = 0;
	let vps = 0;
	let progressBarRef;
	let leftBgRef;
	
	let unsubscribe;
	
	onMount(() => {
		unsubscribe = gameState.subscribe(state => {
			vibes = state.vibes;
			vps = getVibesPerSecond(state);
		});
		
		setTimeout(() => {
			gameState.subscribe(state => {
				initBackgroundVisuals(leftBgRef, state.inventory);
			})();
		}, 100);
		
		return () => {
			if (unsubscribe) unsubscribe();
		};
	});
	
	function handleEmojiClick(e) {
		gameState.update(state => {
			const power = getClickPower(state);
			state.vibes += power;
			state.totalVibes += power;
			
			const rect = emojiRef.getBoundingClientRect();
			const x = e.clientX || (rect.left + rect.width/2);
			const y = e.clientY || (rect.top + rect.height/2);
			
			spawnFloatingText(floaterContainer, x, y, `+${Math.floor(power)}`, true);
			spawnParticle(floaterContainer, x, y);
			
			emojiRef.style.animation = 'none';
			emojiRef.offsetHeight;
			emojiRef.style.animation = 'wobble 0.2s ease';
			
			return state;
		});
	}
</script>

<div class="clicker-column">
	<div bind:this={leftBgRef} class="bg-visuals"></div>
	
	<div class="stats">
		<h2 class="stats-label">Current Vibes</h2>
		<div class="vibes-display">{Math.floor(vibes).toLocaleString()}</div>
		<div class="vps-display">per second: <span>{vps.toFixed(1)}</span></div>
	</div>

	<div class="emoji-container">
		<div 
			bind:this={emojiRef}
			class="emoji-main"
			on:mousedown={handleEmojiClick}
			on:touchstart|preventDefault={(e) => handleEmojiClick(e.touches[0])}
		>
			{#key $currentRankIndex}
				{RANKS[$currentRankIndex].emoji}
			{/key}
		</div>
		<div class="emoji-orbit"></div>
	</div>

	<div bind:this={rankNameRef} class="rank-name">{RANKS[$currentRankIndex].name}</div>
	<div class="progress-container">
		{#if RANKS[$currentRankIndex + 1]}
			{@const prevThreshold = RANKS[$currentRankIndex].threshold}
			{@const nextThreshold = RANKS[$currentRankIndex + 1].threshold}
			{@const progress = Math.min(100, (($gameState.totalVibes - prevThreshold) / (nextThreshold - prevThreshold)) * 100)}
			<div bind:this={progressBarRef} class="progress-bar" style="width: {progress}%"></div>
		{:else}
			<div class="progress-bar" style="width: 100%"></div>
		{/if}
	</div>
	<p class="next-evo">
		{#if RANKS[$currentRankIndex + 1]}
			Next Evolution: {RANKS[$currentRankIndex + 1].threshold.toLocaleString()} Vibes
		{:else}
			Next Evolution: MAX
		{/if}
	</p>
</div>

<style>
	.clicker-column {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 24px;
		background-color: rgba(17, 24, 39, 0.9);
		backdrop-filter: blur(4px);
		overflow: hidden;
	}
	
	.bg-visuals {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}
	
	.stats {
		text-align: center;
		margin-bottom: 32px;
		z-index: 10;
	}
	
	.stats-label {
		color: #9ca3af;
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 4px;
	}
	
	.vibes-display {
		font-size: 48px;
		font-weight: bold;
		color: #fbbf24;
		text-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
	}
	
	.vps-display {
		color: #6b7280;
		font-size: 14px;
		margin-top: 8px;
	}
	
	.vps-display span {
		color: white;
	}
	
	.emoji-container {
		position: relative;
		z-index: 10;
	}
	
	.emoji-main {
		font-size: 150px;
		line-height: 1;
		transition: all 0.2s ease;
		user-select: none;
		cursor: pointer;
	}
	
	.emoji-main:hover {
		filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.6));
		transform: scale(1.05);
	}
	
	.emoji-main:active {
		transform: scale(0.95);
	}
	
	.emoji-orbit {
		position: absolute;
		inset: 0;
		border: 2px dashed rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		width: 200px;
		height: 200px;
		left: -25px;
		top: -10px;
		animation: spin 10s linear infinite;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.2s;
	}
	
	.emoji-container:hover .emoji-orbit {
		opacity: 1;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	.rank-name {
		margin-top: 32px;
		font-size: 20px;
		font-weight: bold;
		z-index: 10;
		background: linear-gradient(to right, #fbbf24, #fff, #fbbf24);
		background-size: 200% auto;
		color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
		animation: shine 3s linear infinite;
	}
	
	.progress-container {
		width: 256px;
		height: 8px;
		background-color: #374151;
		border-radius: 9999px;
		margin-top: 8px;
		overflow: hidden;
		z-index: 10;
	}
	
	.progress-bar {
		height: 100%;
		background: linear-gradient(to right, #fbbf24, #f97316);
		transition: width 0.3s;
	}
	
	.next-evo {
		font-size: 12px;
		color: #6b7280;
		margin-top: 4px;
		z-index: 10;
	}
</style>

