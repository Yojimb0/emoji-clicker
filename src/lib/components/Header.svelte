<script>
	import { createEventDispatcher } from 'svelte';
	import { currentNews } from '../stores/gameStore.js';
	
	const dispatch = createEventDispatcher();
	
	function handleSave() {
		dispatch('save');
	}
	
	function handleReset() {
		dispatch('reset');
	}
</script>

<header class="header">
	<div class="header-left">
		<span class="header-icon">✨</span>
		<h1 class="header-title">Emoji Clicker</h1>
	</div>
	
	<div class="news-ticker">
		<p class="news-text">{$currentNews}</p>
	</div>

	<div class="header-actions">
		<button on:click={handleSave} class="btn btn-save">
			<i class="fas fa-save"></i> Save
		</button>
		<button on:click={handleReset} class="btn btn-reset">
			<i class="fas fa-trash"></i> Wipe
		</button>
	</div>
</header>

<style>
	.header {
		height: 64px;
		background-color: #111827;
		border-bottom: 1px solid #374151;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16px;
		z-index: 20;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	.header-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.header-icon {
		font-size: 24px;
	}
	
	.header-title {
		font-size: 20px;
		font-weight: bold;
		display: none;
	}
	
	@media (min-width: 768px) {
		.header-title {
			display: block;
		}
	}
	
	.news-ticker {
		flex: 1;
		margin: 0 16px;
		overflow: hidden;
		position: relative;
		height: 40px;
		background-color: #1f2937;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #374151;
	}
	
	.news-text {
		font-size: 14px;
		color: #fbbf24;
		font-family: monospace;
		white-space: nowrap;
		animation: pulse 2s ease-in-out infinite;
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	
	.btn {
		font-size: 12px;
		padding: 4px 12px;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	
	.btn-save {
		background-color: #2563eb;
		color: white;
	}
	
	.btn-save:hover {
		background-color: #3b82f6;
	}
	
	.btn-reset {
		background-color: #dc2626;
		color: white;
	}
	
	.btn-reset:hover {
		background-color: #ef4444;
	}
</style>

