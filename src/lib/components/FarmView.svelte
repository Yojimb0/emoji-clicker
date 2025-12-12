<script>
	import { gameState, FARM_MARKET } from '../stores/gameStore.js';
	import { plant, harvest, buyMarketItem } from '../helpers/farming.js';
	
	export let floaterContainer;
</script>

<div class="farm-view">
	<div class="bio-vibes-display">
		<span class="bio-label">Bio-Vibes:</span>
		<span class="bio-amount">🥕 {$gameState.farming.bioVibes}</span>
	</div>

	<div class="farm-grid">
		{#each $gameState.farming.plots as plot (plot.id)}
			{#if plot.stage === 0}
				<div class="farm-plot" on:click={() => plant(plot.id, floaterContainer)}>
					<span class="plot-empty">Plant<br>100⚡</span>
				</div>
			{:else if plot.stage === 1}
				{@const progress = ((plot.maxTime - plot.timer) / plot.maxTime) * 100}
				<div class="farm-plot">
					🌱<div class="crop-growth" style="height: {progress}%"></div>
				</div>
			{:else if plot.stage === 2}
				<div class="farm-plot ripe" on:click={(e) => harvest(plot.id, e, floaterContainer)}>
					🥕
				</div>
			{/if}
		{/each}
	</div>

	<div class="farm-market">
		<h3 class="market-title">Farmers Market</h3>
		<div class="market-items">
			{#each FARM_MARKET as item}
				<div class="market-item">
					<div class="market-item-content">
						<span class="market-icon">{item.icon}</span>
						<div>
							<div class="market-name">{item.name}</div>
							<div class="market-desc">{item.desc}</div>
						</div>
					</div>
					<button 
						on:click={() => buyMarketItem(item.id)}
						class="market-buy {$gameState.farming.bioVibes >= item.cost ? '' : 'disabled'}"
					>
						{item.cost}🥕
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.farm-view {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px;
		overflow-y: auto;
	}
	
	.bio-vibes-display {
		width: 100%;
		max-width: 320px;
		margin-bottom: 24px;
		background-color: rgba(31, 41, 55, 0.5);
		padding: 12px;
		border-radius: 8px;
		border: 1px solid #374151;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.bio-label {
		color: #9ca3af;
		font-size: 14px;
	}
	
	.bio-amount {
		font-size: 24px;
		font-weight: bold;
		color: #fb923c;
	}
	
	.farm-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		width: 100%;
		max-width: 300px;
		margin-bottom: 32px;
	}
	
	.farm-plot {
		aspect-ratio: 1;
		background-color: #1f2937;
		border-radius: 8px;
		border: 2px solid #374151;
		position: relative;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32px;
		user-select: none;
	}
	
	.farm-plot:hover {
		border-color: #6b7280;
	}
	
	.farm-plot:active {
		transform: scale(0.95);
	}
	
	.farm-plot.ripe {
		border-color: #4ade80;
		box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
	}
	
	.plot-empty {
		color: #6b7280;
		font-size: 14px;
		text-align: center;
	}
	
	.crop-growth {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: #10b981;
		opacity: 0.2;
		transition: height 0.5s linear;
		pointer-events: none;
	}
	
	.farm-market {
		width: 100%;
		max-width: 320px;
	}
	
	.market-title {
		font-size: 12px;
		font-weight: bold;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 8px;
	}
	
	.market-items {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.market-item {
		background-color: #374151;
		padding: 8px;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
	}
	
	.market-item-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.market-icon {
		font-size: 20px;
	}
	
	.market-name {
		font-weight: bold;
		color: white;
	}
	
	.market-desc {
		color: #9ca3af;
	}
	
	.market-buy {
		background-color: #ea580c;
		color: white;
		font-weight: bold;
		padding: 4px 8px;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.market-buy:hover:not(.disabled) {
		background-color: #f97316;
	}
	
	.market-buy.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

