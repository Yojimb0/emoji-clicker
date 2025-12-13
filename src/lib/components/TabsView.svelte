<script>
	import FarmView from './FarmView.svelte';
	
	export let floaterContainer;
</script>

<div class="tabs-view">
	<FarmView {floaterContainer} />
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
</style>

