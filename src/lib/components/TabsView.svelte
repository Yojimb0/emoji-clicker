<script>
	import FarmView from './FarmView.svelte';
	
	export let currentTab;
	export let farmUnlocked;
	export let floaterContainer;
	
	function switchTab(tab) {
		currentTab = tab;
	}
</script>

<div class="tabs-view">
	<div class="tabs-bar">
		<button 
			on:click={() => switchTab('home')} 
			class="tab-btn {currentTab === 'home' ? 'active' : ''}"
		>
			Home
		</button>
		{#if farmUnlocked}
			<button 
				on:click={() => switchTab('farm')} 
				class="tab-btn {currentTab === 'farm' ? 'active' : ''}"
			>
				Farm 🥕
			</button>
		{/if}
	</div>

	<div class="tabs-content">
		{#if currentTab === 'home'}
			<div class="home-view">
				<div class="home-placeholder">
					<i class="fas fa-hammer"></i><br>
					Themed activities coming soon...
				</div>
			</div>
		{:else if currentTab === 'farm'}
			<FarmView {floaterContainer} />
		{/if}
	</div>
</div>

<style>
	.tabs-view {
		display: flex;
		width: 100%;
		height: 100%;
		flex-direction: column;
		background-color: rgba(17, 24, 39, 0.8);
		position: relative;
		overflow: hidden;
	}
	
	.tabs-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		border-bottom: 1px solid #374151;
		background-color: rgba(17, 24, 39, 0.5);
		backdrop-filter: blur(4px);
		z-index: 10;
	}
	
	.tab-btn {
		padding: 8px 16px;
		font-size: 14px;
		font-weight: bold;
		color: #9ca3af;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
		background: none;
		border-top: none;
		border-left: none;
		border-right: none;
		cursor: pointer;
	}
	
	.tab-btn:hover {
		color: white;
	}
	
	.tab-btn.active {
		color: #fbbf24;
		border-bottom-color: #fbbf24;
	}
	
	.tabs-content {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
	
	.home-view {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}
	
	.home-placeholder {
		color: #6b7280;
		font-style: italic;
		text-align: center;
	}
	
	.home-placeholder i {
		font-size: 48px;
		margin-bottom: 8px;
		opacity: 0.5;
	}
</style>

