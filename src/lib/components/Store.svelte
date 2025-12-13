<script>
	import { gameState, BUILDINGS } from '../stores/gameStore.js';
	import { getCost } from '../utils/gameLogic.js';
	import { buyBuilding } from '../helpers/buildings.js';
	import { createLog } from '../helpers/logging.js';
	import { saveGame } from '../utils/saveSystem.js';
	
	function handleBuy(id) {
		gameState.update(state => {
			const cost = getCost(id, state.inventory);
			if (state.vibes >= cost) {
				state.vibes -= cost;
				state.inventory[id] = (state.inventory[id] || 0) + 1;
				
				const building = BUILDINGS.find(b => b.id === id);
				createLog(`Bought ${building.name}`, "text-green-400");
				saveGame(state);
			}
			return state;
		});
	}
</script>

<div class="store-column">
	<div class="store-header">
		<h2 class="store-title">
			<i class="fas fa-shopping-cart"></i> Vibe Store
		</h2>
	</div>
	
	<div class="store-items">
		{#each BUILDINGS as building}
			{@const cost = getCost(building.id, $gameState.inventory)}
			{@const count = $gameState.inventory[building.id] || 0}
			{@const canAfford = $gameState.vibes >= cost}
			<div 
				on:click={() => handleBuy(building.id)}
				class="store-item {canAfford ? '' : 'disabled'}"
			>
				<div class="store-item-content">
					<div class="store-item-icon">{building.icon}</div>
					<div class="store-item-info">
						<div class="store-item-name">{building.name}</div>
						<div class="store-item-desc">{building.desc}</div>
						<div class="store-item-cost">⚡ {cost.toLocaleString()} Vibes</div>
					</div>
				</div>
				<div class="store-item-count">{count}</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.store-column {
		width: 100%;
		height: 100%;
		background-color: #1f2937;
		display: flex;
		flex-direction: column;
		z-index: 10;
	}
	
	.store-header {
		padding: 16px;
		background-color: #111827;
		border-bottom: 1px solid #374151;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.store-title {
		font-weight: bold;
		font-size: 18px;
		color: white;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.store-title i {
		color: #4ade80;
	}
	
	.store-items {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		padding-bottom: 80px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.store-item {
		background-color: #374151;
		border-radius: 8px;
		padding: 8px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid #4b5563;
		margin-bottom: 8px;
		user-select: none;
	}
	
	.store-item:hover:not(.disabled) {
		background-color: #4b5563;
	}
	
	.store-item.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		filter: grayscale(1);
	}
	
	.store-item-content {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.store-item-icon {
		font-size: 32px;
		background-color: #1f2937;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}
	
	.store-item-info {
		flex: 1;
	}
	
	.store-item-name {
		font-weight: bold;
		color: white;
	}
	
	.store-item-desc {
		font-size: 12px;
		color: #9ca3af;
	}
	
	.store-item-cost {
		color: #fbbf24;
		font-family: monospace;
		font-size: 14px;
		margin-top: 4px;
	}
	
	.store-item-count {
		font-size: 24px;
		font-weight: bold;
		color: #6b7280;
		font-family: monospace;
		padding-right: 8px;
	}
</style>

