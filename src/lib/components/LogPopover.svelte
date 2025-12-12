<script>
	import { logMessages, latestLog, logExpanded } from '../stores/gameStore.js';
	
	function toggleLog() {
		logExpanded.update(v => !v);
	}
</script>

<div class="log-popover {$logExpanded ? 'expanded' : ''}">
	{#if $logExpanded}
		<div class="log-history">
			{#each $logMessages as log}
				<div class="log-entry {log.classes}">> {log.msg}</div>
			{/each}
		</div>
	{/if}
	
	<div 
		on:click={toggleLog}
		class="log-header"
	>
		<div class="log-header-content">
			<span class="log-indicator">●</span>
			<span class="log-latest">{$latestLog}</span>
		</div>
		<i class="fas fa-chevron-up log-toggle" style="transform: rotate({$logExpanded ? '180deg' : '0deg'})"></i>
	</div>
</div>

<style>
	.log-popover {
		position: fixed;
		bottom: 16px;
		left: 16px;
		z-index: 50;
		width: 320px;
		background-color: #111827;
		border: 1px solid #374151;
		border-radius: 8px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		height: 48px;
	}
	
	.log-popover.expanded {
		height: 320px;
	}
	
	.log-history {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-family: monospace;
		font-size: 12px;
		color: #9ca3af;
		background-color: rgba(17, 24, 39, 0.95);
		border-bottom: 1px solid #1f2937;
	}
	
	.log-entry {
		border-bottom: 1px solid #1f2937;
		padding-bottom: 4px;
	}
	
	.log-header {
		height: 48px;
		background-color: #1f2937;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		transition: background-color 0.2s;
		user-select: none;
	}
	
	.log-header:hover {
		background-color: #374151;
	}
	
	.log-header-content {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow: hidden;
		flex: 1;
	}
	
	.log-indicator {
		color: #4ade80;
		font-size: 12px;
	}
	
	.log-latest {
		font-size: 14px;
		font-family: monospace;
		color: #d1d5db;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.log-toggle {
		color: #6b7280;
		font-size: 12px;
		transition: transform 0.3s;
	}
</style>

