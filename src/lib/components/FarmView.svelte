<script>
	import { onMount, onDestroy } from 'svelte';
	import { gameState, FARM_MARKET, VEGGIE_TYPES } from '../stores/gameStore.js';
	import { plant, harvest, buyMarketItem, getYieldAmount, getGMORate, getExtraPlotCost, unlockVeggie, convertStocksToBioVibes, convertVeggieStocks, getFertilizerNextThreshold } from '../helpers/farming.js';
	
	export let floaterContainer;
	
	let timerInterval = null;
	let timerTick = 0; // Force reactivity
	
	let selectedVeggieType = 'carrot';
	
	$: selectedVeggieType = $gameState.farming.selectedVeggieType || 'carrot';
	
	function setSelectedVeggieType(veggieId) {
		gameState.update(state => {
			if (!state.farming.selectedVeggieType) state.farming.selectedVeggieType = 'carrot';
			state.farming.selectedVeggieType = veggieId;
			return state;
		});
		selectedVeggieType = veggieId;
	}
	
	function isVeggieUnlocked(veggieId) {
		return ($gameState.farming.unlockedVeggies || ['carrot']).includes(veggieId);
	}
	
	function getFertilizerCount() {
		return $gameState.farming.fertilizer?.active || 0;
	}
	
	function getFertilizerDecayProgress() {
		if (!$gameState.farming.fertilizer || $gameState.farming.fertilizer.active === 0) return 0;
		const now = Date.now();
		const lastDecay = $gameState.farming.fertilizer.lastDecayTime || now;
		const msSinceDecay = now - lastDecay;
		const hourInMs = 1000 * 60 * 60;
		return Math.min(1, msSinceDecay / hourInMs);
	}
	
	function getFertilizerTimeUntilDecay() {
		if (!$gameState.farming.fertilizer || $gameState.farming.fertilizer.active === 0) return null;
		const now = Date.now();
		const lastDecay = $gameState.farming.fertilizer.lastDecayTime || now;
		const msSinceDecay = now - lastDecay;
		const hourInMs = 1000 * 60 * 60;
		const msUntilNextDecay = hourInMs - msSinceDecay;
		return Math.max(0, msUntilNextDecay);
	}
	
	// Reactive values for timer display
	$: fertilizerProgress = getFertilizerDecayProgress();
	$: fertilizerTimeLeft = getFertilizerTimeUntilDecay();
	$: timerTick; // Force reactivity when timerTick changes
	
	function formatTime(ms) {
		const minutes = Math.floor(ms / (1000 * 60));
		const seconds = Math.floor((ms % (1000 * 60)) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
	
	// Timer for fertilizer decay display
	onMount(() => {
		const unsubscribe = gameState.subscribe(() => {
			const active = $gameState.farming.fertilizer?.active || 0;
			if (active > 0 && !timerInterval) {
				timerInterval = setInterval(() => {
					timerTick = Date.now(); // Force reactivity
				}, 1000);
			} else if (active === 0 && timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		});
		
		return () => {
			unsubscribe();
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	});
	
	function getCurrentYield(veggieType = selectedVeggieType) {
		return getYieldAmount($gameState, veggieType);
	}
	
	function getCurrentGMORate(veggieType = selectedVeggieType) {
		return getGMORate($gameState, veggieType);
	}
	
	function getExtraPlotCostDisplay() {
		const currentPlots = 9 + ($gameState.farming.extraPlots || 0);
		if (currentPlots >= 15) return 'MAX';
		return getExtraPlotCost($gameState.farming.extraPlots || 0);
	}
	
	function getTotalStocks() {
		const stocks = $gameState.farming.stocks || { carrot: 0, tomato: 0, corn: 0 };
		return Object.values(stocks).reduce((a, b) => a + b, 0);
	}
	
	function hasHoverHarvest() {
		return ($gameState.farming.upgrades['hover_harvest'] || 0) > 0;
	}
	
	function handlePlantHover(plotId, event) {
		if (hasHoverHarvest()) {
			const plot = $gameState.farming.plots.find(p => p.id === plotId);
			if (plot && plot.stage === 0) {
				plant(plotId, floaterContainer, selectedVeggieType);
			}
		}
	}
	
	function handleHarvestHover(plotId, event) {
		if (hasHoverHarvest()) {
			const plot = $gameState.farming.plots.find(p => p.id === plotId);
			if (plot && plot.stage === 2) {
				// Create event-like object with target for positioning
				const syntheticEvent = {
					target: event.currentTarget || event.target,
					clientX: event.clientX,
					clientY: event.clientY
				};
				harvest(plotId, syntheticEvent, floaterContainer);
			}
		}
	}
	
	function handlePlantFocus(plotId, event) {
		if (hasHoverHarvest()) {
			const plot = $gameState.farming.plots.find(p => p.id === plotId);
			if (plot && plot.stage === 0) {
				plant(plotId, floaterContainer, selectedVeggieType);
			}
		}
	}
	
	function handleHarvestFocus(plotId, event) {
		if (hasHoverHarvest()) {
			const plot = $gameState.farming.plots.find(p => p.id === plotId);
			if (plot && plot.stage === 2) {
				// Create event-like object with target for positioning
				const syntheticEvent = {
					target: event.currentTarget || event.target,
					clientX: event.clientX,
					clientY: event.clientY
				};
				harvest(plotId, syntheticEvent, floaterContainer);
			}
		}
	}
</script>

<div class="farm-view">
	<!-- Unified Data Display - Currencies Only -->
	<div class="unified-data-display">
		<!-- Bio-Vibes -->
		<div class="data-item currency-item">
			<span class="data-label">Bio-Vibes:</span>
			<span class="data-icon">⚡</span>
			<span class="data-value">{$gameState.farming.bioVibes}</span>
		</div>
		
		<!-- Veggie Stocks -->
		{#each VEGGIE_TYPES as veggieType}
			{@const stock = ($gameState.farming.stocks || {})[veggieType.id] || 0}
			{#if isVeggieUnlocked(veggieType.id) || stock > 0}
				<div class="data-item currency-item">
					<span class="data-icon">{veggieType.emoji}</span>
					<span class="data-value">{stock}</span>
					{#if stock > 0}
						<button
							class="convert-btn"
							on:click={() => convertVeggieStocks(veggieType.id)}
							title="Convert to Bio-Vibes"
						>
							⚡
						</button>
					{/if}
				</div>
			{/if}
		{/each}
	</div>

	<!-- Factory Button -->
	{#if $gameState.farming.factory && $gameState.farming.factory.enabled}
		<div class="factory-section">
			<button 
				class="factory-btn"
				on:click={convertStocksToBioVibes}
				disabled={getTotalStocks() === 0}
			>
				<span class="factory-icon">🏭</span>
				<span class="factory-label">Convert Stocks</span>
			</button>
		</div>
	{/if}

	<div class="farm-grid">
		{#each $gameState.farming.plots as plot (plot.id)}
			{#if plot.stage === 0}
				<div 
					class="farm-plot" 
					role="button"
					tabindex="0"
					on:click={() => plant(plot.id, floaterContainer, selectedVeggieType)}
					on:mouseenter={(e) => handlePlantHover(plot.id, e)}
					on:focus={(e) => handlePlantFocus(plot.id, e)}
				>
					<span class="plot-empty">Plant<br>100⚡</span>
				</div>
			{:else if plot.stage === 1}
				{@const progress = ((plot.maxTime - plot.timer) / plot.maxTime) * 100}
				{@const plotVeggie = VEGGIE_TYPES.find(v => v.id === plot.veggieType) || VEGGIE_TYPES[0]}
				<div class="farm-plot" tabindex="0">
					<span class="crop-emoji growing" class:carrot={plot.veggieType === 'carrot'} class:tomato={plot.veggieType === 'tomato'} class:corn={plot.veggieType === 'corn'}>
						🌱
					</span>
					<div class="crop-growth" style="height: {progress}%"></div>
				</div>
			{:else if plot.stage === 2}
				{@const plotVeggie = VEGGIE_TYPES.find(v => v.id === plot.veggieType) || VEGGIE_TYPES[0]}
				<div 
					class="farm-plot ripe" 
					role="button"
					tabindex="0"
					on:click={(e) => harvest(plot.id, e, floaterContainer)}
					on:mouseenter={(e) => handleHarvestHover(plot.id, e)}
					on:focus={(e) => handleHarvestFocus(plot.id, e)}
				>
					<span class="crop-emoji" class:carrot={plot.veggieType === 'carrot'} class:tomato={plot.veggieType === 'tomato'} class:corn={plot.veggieType === 'corn'}>
						{plotVeggie.emoji}
					</span>
				</div>
			{/if}
		{/each}
	</div>

	<div class="farm-market">
		<h3 class="market-title">Farmers Market</h3>
		<!-- Veggie Unlocks -->
		<div class="veggie-unlocks">
			{#each VEGGIE_TYPES as veggieType}
				{@const isUnlocked = isVeggieUnlocked(veggieType.id)}
				{@const isSelected = selectedVeggieType === veggieType.id}
				{@const canUnlock = !isUnlocked && $gameState.farming.bioVibes >= veggieType.unlockCost}
				<div class="veggie-unlock-item" class:unlocked={isUnlocked} class:selected={isSelected}>
					<div class="veggie-unlock-content">
						<span class="veggie-unlock-emoji">{veggieType.emoji}</span>
						<div class="veggie-unlock-info">
							<div class="veggie-unlock-name">{veggieType.name}</div>
							<div class="veggie-unlock-stats">
								Yield: {veggieType.yield}{veggieType.emoji} | Factory: {veggieType.factoryRate}x
							</div>
						</div>
					</div>
					<div class="veggie-unlock-actions">
						{#if isUnlocked}
							<button
								class="veggie-select-btn"
								class:active={isSelected}
								on:click={() => setSelectedVeggieType(veggieType.id)}
							>
								{isSelected ? 'Selected' : 'Select'}
							</button>
						{:else}
							<button
								class="veggie-unlock-btn"
								class:disabled={!canUnlock}
								on:click={() => unlockVeggie(veggieType.id)}
								disabled={!canUnlock}
							>
								Unlock {veggieType.unlockCost}⚡
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="market-items">
			{#each FARM_MARKET as item}
				{@const isExtraPlot = item.id === 'extra_plot'}
				{@const isFertilizer = item.id === 'fertilizer'}
				{@const isGMO = item.id.startsWith('gmo_')}
				{@const veggieTypeId = isGMO ? item.id.replace('gmo_', '') : null}
				{@const currentPlots = 9 + ($gameState.farming.extraPlots || 0)}
				{@const plotCost = isExtraPlot ? getExtraPlotCost($gameState.farming.extraPlots || 0) : item.cost}
				{@const cost = isExtraPlot ? (currentPlots >= 15 ? 'MAX' : plotCost) : item.cost}
				{@const canAfford = isExtraPlot ? 
					($gameState.farming.bioVibes >= plotCost && currentPlots < 15) :
					($gameState.farming.bioVibes >= item.cost && (item.stackable || !$gameState.farming.upgrades[item.id]))
				}
				{@const isOwned = !item.stackable && $gameState.farming.upgrades[item.id] > 0}
				{@const isMaxPlots = isExtraPlot && currentPlots >= 15}
				{@const fertilizerActive = isFertilizer ? getFertilizerCount() : 0}
				{@const fertilizerProgressValue = isFertilizer ? fertilizerProgress : 0}
				{@const fertilizerTimeLeftValue = isFertilizer ? fertilizerTimeLeft : null}
				{@const nextThreshold = isFertilizer ? getFertilizerNextThreshold('carrot') : null}
				{@const gmoRate = isGMO && veggieTypeId ? getCurrentGMORate(veggieTypeId) : 0}
				{@const currentYield = isGMO && veggieTypeId ? getCurrentYield(veggieTypeId) : 0}
				{@const veggieEmoji = isGMO && veggieTypeId ? VEGGIE_TYPES.find(v => v.id === veggieTypeId)?.emoji : ''}
				<div class="market-item" class:owned={isOwned}>
					<div class="market-item-content">
						<span class="market-icon">{item.icon}</span>
						<div class="market-info">
							<div class="market-name">{item.name}</div>
							<div class="market-desc">{item.desc}</div>
							{#if isFertilizer}
								<div class="fertilizer-info">
									<div class="fertilizer-stats">
										<span>Active: {fertilizerActive}</span>
									</div>
									{#if fertilizerActive > 0}
										{@const circumference = 2 * Math.PI * 16}
										{@const progressDash = circumference * fertilizerProgressValue}
										{@const timeLeft = fertilizerTimeLeftValue !== null ? formatTime(fertilizerTimeLeftValue) : '0:00'}
										<div class="fertilizer-decay">
											<div class="decay-timer-container" title="Fertilizer decays 1 unit every hour. Time until next decay: {timeLeft}">
												<svg class="decay-timer" viewBox="0 0 36 36">
													<circle class="decay-timer-bg" cx="18" cy="18" r="16"></circle>
													<circle 
														class="decay-timer-progress" 
														cx="18" 
														cy="18" 
														r="16"
														stroke-dasharray="{progressDash} {circumference}"
													></circle>
												</svg>
											</div>
											<span class="decay-label">Decay timer</span>
										</div>
									{/if}
									{#if nextThreshold && fertilizerActive < nextThreshold}
										<div class="fertilizer-threshold">
											Next impact at {nextThreshold} fertilizer (Carrot yield: {Math.floor(VEGGIE_TYPES.find(v => v.id === 'carrot').yield * (1 + (nextThreshold * 0.1)))}{VEGGIE_TYPES.find(v => v.id === 'carrot').emoji})
										</div>
									{:else if fertilizerActive > 0}
										<div class="fertilizer-yields">
											{#each VEGGIE_TYPES as veggie}
												{#if isVeggieUnlocked(veggie.id)}
													<span>{veggie.name}: {getCurrentYield(veggie.id)}{veggie.emoji}</span>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							{:else if isGMO && veggieTypeId && isVeggieUnlocked(veggieTypeId)}
								<div class="market-rate">
									Yield: {currentYield}{veggieEmoji} | GMO: {gmoRate}x
								</div>
							{/if}
							{#if isOwned}
								<div class="market-owned">Owned</div>
							{:else if isMaxPlots}
								<div class="market-owned">Max Reached</div>
							{/if}
						</div>
					</div>
					<button 
						on:click={() => buyMarketItem(item.id)}
						class="market-buy {canAfford && !isOwned && !isMaxPlots ? '' : 'disabled'}"
						disabled={!canAfford || isOwned || isMaxPlots}
					>
						{cost}{typeof cost === 'number' ? '⚡' : ''}
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
	
	.unified-data-display {
		width: 100%;
		max-width: 600px;
		margin-bottom: 24px;
		background-color: rgba(31, 41, 55, 0.5);
		padding: 12px 16px;
		border-radius: 8px;
		border: 1px solid #374151;
		display: flex;
		gap: 16px;
		align-items: center;
		flex-wrap: wrap;
	}
	
	.data-item {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 0;
		white-space: nowrap;
	}
	
	.currency-item {
		justify-content: flex-start;
	}
	
	.data-label {
		color: #9ca3af;
		font-size: 12px;
		margin-right: 4px;
		white-space: nowrap;
	}
	
	.data-icon {
		font-size: 18px;
		line-height: 1;
	}
	
	.data-value {
		font-size: 14px;
		font-weight: bold;
		color: #fbbf24;
		min-width: 24px;
		text-align: right;
	}
	
	.convert-btn {
		background-color: #1e40af;
		color: white;
		border: none;
		border-radius: 4px;
		width: 24px;
		height: 24px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		flex-shrink: 0;
		margin-left: 4px;
	}
	
	.convert-btn:hover {
		background-color: #2563eb;
		transform: scale(1.1);
	}
	
	.convert-btn:active {
		transform: scale(0.95);
	}
	
	.factory-section {
		width: 100%;
		max-width: 320px;
		margin-bottom: 16px;
	}
	
	.factory-btn {
		width: 100%;
		padding: 12px;
		background-color: #1e40af;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	
	.factory-btn:hover:not(:disabled) {
		background-color: #2563eb;
	}
	
	.factory-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.factory-icon {
		font-size: 20px;
	}
	
	.factory-label {
		font-size: 14px;
	}
	
	.veggie-unlocks {
		width: 100%;
		max-width: 320px;
		margin-bottom: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.veggie-unlock-item {
		background-color: #374151;
		padding: 8px;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 2px solid #374151;
		transition: all 0.2s;
	}
	
	.veggie-unlock-item.unlocked {
		border-color: #4ade80;
	}
	
	.veggie-unlock-item.selected {
		border-color: #fbbf24;
		background-color: rgba(251, 191, 36, 0.1);
	}
	
	.veggie-unlock-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.veggie-unlock-emoji {
		font-size: 24px;
	}
	
	.veggie-unlock-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.veggie-unlock-name {
		font-weight: bold;
		color: white;
		font-size: 12px;
	}
	
	.veggie-unlock-stats {
		font-size: 10px;
		color: #9ca3af;
	}
	
	.veggie-unlock-actions {
		display: flex;
		gap: 4px;
	}
	
	.veggie-select-btn,
	.veggie-unlock-btn {
		padding: 4px 8px;
		border-radius: 4px;
		border: none;
		font-size: 10px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.veggie-select-btn {
		background-color: #1f2937;
		color: #9ca3af;
		border: 1px solid #374151;
	}
	
	.veggie-select-btn:hover {
		background-color: #374151;
		color: white;
	}
	
	.veggie-select-btn.active {
		background-color: #fbbf24;
		color: #111827;
		border-color: #fbbf24;
	}
	
	.veggie-unlock-btn {
		background-color: #ea580c;
		color: white;
	}
	
	.veggie-unlock-btn:hover:not(.disabled) {
		background-color: #f97316;
	}
	
	.veggie-unlock-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.veggie-selector {
		width: 100%;
		max-width: 320px;
		margin-bottom: 16px;
		background-color: rgba(31, 41, 55, 0.5);
		padding: 12px;
		border-radius: 8px;
		border: 1px solid #374151;
	}
	
	.selector-label {
		color: #9ca3af;
		font-size: 12px;
		display: block;
		margin-bottom: 8px;
	}
	
	.veggie-buttons {
		display: flex;
		gap: 8px;
	}
	
	.veggie-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px;
		background-color: #374151;
		border: 2px solid #374151;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.veggie-btn:hover {
		border-color: #6b7280;
		background-color: #4b5563;
	}
	
	.veggie-btn.active {
		border-color: var(--veggie-color, #fbbf24);
		background-color: rgba(251, 191, 36, 0.1);
	}
	
	.veggie-emoji {
		font-size: 24px;
		line-height: 1;
		transition: filter 0.2s;
	}
	
	.veggie-emoji.tomato {
		filter: hue-rotate(0deg) saturate(1.2);
	}
	
	.veggie-emoji.corn {
		filter: hue-rotate(30deg) saturate(1.1) brightness(1.1);
	}
	
	.veggie-name {
		font-size: 10px;
		color: #9ca3af;
		font-weight: bold;
	}
	
	.veggie-btn.active .veggie-name {
		color: var(--veggie-color, #fbbf24);
	}
	
	
	.farm-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		width: 100%;
		max-width: 300px;
		margin-bottom: 32px;
	}
	
	@media (min-width: 640px) {
		.farm-grid {
			max-width: 400px;
		}
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
		outline: none;
	}
	
	.farm-plot:hover {
		border-color: #6b7280;
	}
	
	.farm-plot:focus {
		border-color: #fbbf24;
		box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3);
	}
	
	.farm-plot:active {
		transform: scale(0.95);
	}
	
	.farm-plot.ripe {
		border-color: #4ade80;
		box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
	}
	
	.farm-plot.ripe:focus {
		border-color: #4ade80;
		box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.5), 0 0 10px rgba(74, 222, 128, 0.5);
	}
	
	.plot-empty {
		color: #6b7280;
		font-size: 14px;
		text-align: center;
	}
	
	.crop-emoji {
		position: relative;
		z-index: 2;
		transition: filter 0.2s;
	}
	
	.crop-emoji.tomato {
		filter: hue-rotate(0deg) saturate(1.2);
	}
	
	.crop-emoji.corn {
		filter: hue-rotate(30deg) saturate(1.1) brightness(1.1);
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
		z-index: 1;
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
	
	.market-item.owned {
		opacity: 0.6;
	}
	
	.market-owned {
		font-size: 10px;
		color: #4ade80;
		font-weight: bold;
		margin-top: 2px;
	}
	
	.market-item-content {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		flex: 1;
	}
	
	.market-info {
		flex: 1;
		min-width: 0;
	}
	
	.market-icon {
		font-size: 20px;
		flex-shrink: 0;
	}
	
	.market-name {
		font-weight: bold;
		color: white;
	}
	
	.market-desc {
		color: #9ca3af;
		font-size: 11px;
	}
	
	.market-rate {
		font-size: 10px;
		color: #fbbf24;
		margin-top: 2px;
		font-weight: 500;
	}
	
	.fertilizer-info {
		margin-top: 6px;
		font-size: 10px;
	}
	
	.fertilizer-stats {
		display: flex;
		gap: 12px;
		color: #9ca3af;
		margin-bottom: 4px;
	}
	
	.fertilizer-decay {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 6px 0;
	}
	
	.decay-timer-container {
		position: relative;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		cursor: help;
	}
	
	.decay-timer {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	
	.decay-timer-bg {
		fill: none;
		stroke: #374151;
		stroke-width: 3;
	}
	
	.decay-timer-progress {
		fill: none;
		stroke: #fbbf24;
		stroke-width: 3;
		stroke-linecap: round;
		transition: stroke-dasharray 0.3s linear;
	}
	
	.decay-label {
		font-size: 9px;
		color: #9ca3af;
	}
	
	.fertilizer-threshold {
		color: #60a5fa;
		font-size: 9px;
		margin-top: 4px;
		line-height: 1.3;
	}
	
	.fertilizer-yields {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 4px;
		color: #fbbf24;
		font-size: 9px;
	}
	
	.fertilizer-yields span {
		white-space: nowrap;
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
	
	.market-buy:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

