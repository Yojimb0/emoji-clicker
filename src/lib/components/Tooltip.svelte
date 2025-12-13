<script>
	import { onMount } from 'svelte';
	
	export let text = '';
	export let position = 'auto'; // 'auto', 'top', 'bottom', 'left', 'right'
	
	let showTooltip = false;
	let tooltipElement;
	let wrapperElement;
	let computedPosition = 'top';
	let tooltipStyle = '';
	
	function handleMouseEnter() {
		showTooltip = true;
		// Use requestAnimationFrame to ensure element is rendered
		requestAnimationFrame(() => {
			if (position === 'auto' && tooltipElement && wrapperElement) {
				calculatePosition();
			} else {
				computedPosition = position;
				updateTooltipStyle();
			}
		});
	}
	
	function handleMouseLeave() {
		showTooltip = false;
	}
	
	function calculatePosition() {
		if (!tooltipElement || !wrapperElement) return;
		
		const wrapperRect = wrapperElement.getBoundingClientRect();
		const tooltipRect = tooltipElement.getBoundingClientRect();
		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;
		
		// Check space above and below
		const spaceAbove = wrapperRect.top;
		const spaceBelow = viewportHeight - wrapperRect.bottom;
		const tooltipHeight = tooltipRect.height || 50;
		
		// Check space left and right
		const spaceLeft = wrapperRect.left;
		const spaceRight = viewportWidth - wrapperRect.right;
		const tooltipWidth = tooltipRect.width || 200;
		
		// Determine best position based on available space
		if (spaceBelow >= tooltipHeight + 8) {
			computedPosition = 'bottom';
		} else if (spaceAbove >= tooltipHeight + 8) {
			computedPosition = 'top';
		} else if (spaceRight >= tooltipWidth + 8) {
			computedPosition = 'right';
		} else if (spaceLeft >= tooltipWidth + 8) {
			computedPosition = 'left';
		} else {
			// Default to position with most space
			computedPosition = spaceBelow > spaceAbove ? 'bottom' : 'top';
		}
		
		updateTooltipStyle();
	}
	
	function updateTooltipStyle() {
		if (!tooltipElement || !wrapperElement) return;
		
		const wrapperRect = wrapperElement.getBoundingClientRect();
		const tooltipRect = tooltipElement.getBoundingClientRect();
		
		// Calculate anchor point (center of wrapper element)
		const anchorX = wrapperRect.left + (wrapperRect.width / 2);
		const anchorY = wrapperRect.top + (wrapperRect.height / 2);
		
		// Use modern CSS custom properties for anchor-based positioning
		// These values represent the anchor point in viewport coordinates
		tooltipStyle = `
			--anchor-x: ${anchorX}px;
			--anchor-y: ${anchorY}px;
			--anchor-top: ${wrapperRect.top}px;
			--anchor-bottom: ${wrapperRect.bottom}px;
			--anchor-left: ${wrapperRect.left}px;
			--anchor-right: ${wrapperRect.right}px;
		`;
	}
</script>

<div 
	bind:this={wrapperElement}
	class="tooltip-wrapper"
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	on:focus={handleMouseEnter}
	on:blur={handleMouseLeave}
>
	<slot />
	{#if showTooltip && text}
		<div 
			bind:this={tooltipElement}
			class="tooltip tooltip-{computedPosition}"
			style={tooltipStyle}
			role="tooltip"
		>
			{text}
		</div>
	{/if}
</div>

<style>
	.tooltip-wrapper {
		position: relative;
		display: inline-block;
	}
	
	.tooltip {
		position: fixed;
		z-index: 1000;
		padding: 6px 10px;
		background-color: #1f2937;
		color: #f3f4f6;
		font-size: 12px;
		border-radius: 6px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
		border: 1px solid #374151;
		pointer-events: none;
		max-width: 250px;
		white-space: normal;
		line-height: 1.4;
		word-wrap: break-word;
		/* Use CSS custom properties for anchor-based positioning */
		/* Modern CSS approach: calculate position relative to anchor point */
	}
	
	/* Modern CSS anchor positioning using custom properties */
	/* Position is calculated in JS and passed via CSS variables */
	/* Using `inset` properties for cleaner positioning */
	
	.tooltip-top {
		bottom: calc(100vh - var(--anchor-top) + 8px);
		left: var(--anchor-x);
		transform: translateX(-50%);
		animation: tooltipFadeInTop 0.15s ease-out;
	}
	
	.tooltip-top::before {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: #1f2937;
	}
	
	.tooltip-bottom {
		top: calc(var(--anchor-bottom) + 8px);
		left: var(--anchor-x);
		transform: translateX(-50%);
		animation: tooltipFadeInBottom 0.15s ease-out;
	}
	
	.tooltip-bottom::before {
		content: '';
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-bottom-color: #1f2937;
	}
	
	.tooltip-left {
		right: calc(100vw - var(--anchor-left) + 8px);
		top: var(--anchor-y);
		transform: translateY(-50%);
		animation: tooltipFadeInLeft 0.15s ease-out;
	}
	
	.tooltip-left::before {
		content: '';
		position: absolute;
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		border: 5px solid transparent;
		border-left-color: #1f2937;
	}
	
	.tooltip-right {
		left: calc(var(--anchor-right) + 8px);
		top: var(--anchor-y);
		transform: translateY(-50%);
		animation: tooltipFadeInRight 0.15s ease-out;
	}
	
	.tooltip-right::before {
		content: '';
		position: absolute;
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		border: 5px solid transparent;
		border-right-color: #1f2937;
	}
	
	@keyframes tooltipFadeInTop {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	
	@keyframes tooltipFadeInBottom {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	
	@keyframes tooltipFadeInLeft {
		from {
			opacity: 0;
			transform: translateY(-50%) translateX(4px);
		}
		to {
			opacity: 1;
			transform: translateY(-50%) translateX(0);
		}
	}
	
	@keyframes tooltipFadeInRight {
		from {
			opacity: 0;
			transform: translateY(-50%) translateX(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(-50%) translateX(0);
		}
	}
</style>

