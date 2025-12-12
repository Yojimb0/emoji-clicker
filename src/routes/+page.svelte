<script>
	import { onMount, onDestroy } from 'svelte';
	import { gameState, currentRankIndex, currentNews, logMessages, latestLog, logExpanded, RANKS, BUILDINGS, NEWS, FARM_MARKET } from '$lib/stores/gameStore.js';
	import { getVibesPerSecond, getClickPower, getCost } from '$lib/utils/gameLogic.js';
	import { saveGame, loadGame, resetGame } from '$lib/utils/saveSystem.js';
	
	let vibes = 0;
	let vps = 0;
	let currentTab = 'home';
	let emojiRef;
	let rankNameRef;
	let progressBarRef;
	let leftBgRef;
	let floaterContainerRef;
	let farmUnlocked = false;
	
	const ANIM_TYPES = {
		'cursor': 'anim-wiggle',
		'grandma': 'anim-float',
		'groupchat': 'anim-pop',
		'influencer': 'anim-bounce',
		'clown': 'anim-bounce',
		'botfarm': 'anim-pulse-glow',
		'rocket': 'anim-drift',
		'satellite': 'anim-drift',
		'portal': 'anim-pulse-glow',
		'garden_patch': 'anim-wiggle'
	};
	
	let unsubscribe;
	let rankUnsubscribe;
	let gameLoopId;
	let lastTime = Date.now();
	let autoSaveTimer = 0;
	let newsTimer = 0;
	
	onMount(() => {
		// Load game
		loadGame();
		
		// Subscribe to game state
		unsubscribe = gameState.subscribe(state => {
			vibes = state.vibes;
			vps = getVibesPerSecond(state);
			farmUnlocked = (state.inventory['garden_patch'] || 0) > 0;
		});
		
		// Subscribe to rank changes
		const rankUnsubscribe = currentRankIndex.subscribe(rankIndex => {
			if (rankNameRef) {
				const rank = RANKS[rankIndex];
				if (rank) {
					rankNameRef.textContent = rank.name;
					rankNameRef.style.color = rank.color;
				}
			}
		});
		
		// Start game loop
		gameLoop();
		
		// Rotate news
		setInterval(() => {
			const text = NEWS[Math.floor(Math.random() * NEWS.length)];
			currentNews.set(text);
		}, 10000);
	});
	
	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		if (rankUnsubscribe) rankUnsubscribe();
		if (gameLoopId) cancelAnimationFrame(gameLoopId);
	});
	
	function gameLoop() {
		const now = Date.now();
		const dt = (now - lastTime) / 1000;
		lastTime = now;
		
		gameState.update(state => {
			const vpsValue = getVibesPerSecond(state);
			if (vpsValue > 0) {
				const produced = vpsValue * dt;
				state.vibes += produced;
				state.totalVibes += produced;
			}
			
			// Farming logic
			if (state.farming) {
				state.farming.plots.forEach(plot => {
					if (plot.stage === 1) {
						plot.timer -= dt;
						if (plot.timer <= 0) {
							plot.stage = 2;
							createLog("A crop is ripe!", "text-green-400");
						}
					}
				});
			}
			
			// Check for rank evolution
			const rankIndex = $currentRankIndex;
			const nextRank = RANKS[rankIndex + 1];
			if (nextRank && state.totalVibes >= nextRank.threshold) {
				evolve(rankIndex + 1);
			}
			
			return state;
		});
		
		// Auto save
		autoSaveTimer += dt;
		if (autoSaveTimer > 30) {
			gameState.update(state => {
				saveGame(state);
				createLog("Game Saved", "text-blue-400");
				return state;
			});
			autoSaveTimer = 0;
		}
		
		gameLoopId = requestAnimationFrame(gameLoop);
	}
	
	function handleEmojiClick(e) {
		gameState.update(state => {
			const power = getClickPower(state);
			state.vibes += power;
			state.totalVibes += power;
			
			const rect = emojiRef.getBoundingClientRect();
			const x = e.clientX || (rect.left + rect.width/2);
			const y = e.clientY || (rect.top + rect.height/2);
			
			spawnFloatingText(x, y, `+${Math.floor(power)}`, true);
			spawnParticle(x, y);
			
			emojiRef.style.animation = 'none';
			emojiRef.offsetHeight;
			emojiRef.style.animation = 'wobble 0.2s ease';
			
			return state;
		});
	}
	
	function buyBuilding(id) {
		gameState.update(state => {
			const cost = getCost(id, state.inventory);
			if (state.vibes >= cost) {
				state.vibes -= cost;
				state.inventory[id] = (state.inventory[id] || 0) + 1;
				
				const building = BUILDINGS.find(b => b.id === id);
				createLog(`Bought ${building.name}`, "text-green-400");
				
				spawnBuildingVisual(id);
				saveGame(state);
			}
			return state;
		});
	}
	
	function spawnFloatingText(x, y, text, isClick = false) {
		if (!floaterContainerRef) return;
		const el = document.createElement('div');
		el.className = 'floating-text pointer-events-none fixed z-50 font-bold';
		el.style.left = `${x}px`;
		el.style.top = `${y}px`;
		el.textContent = text;
		el.style.color = isClick ? '#fff' : '#818cf8';
		el.style.fontSize = isClick ? '24px' : '16px';
		floaterContainerRef.appendChild(el);
		setTimeout(() => el.remove(), 1000);
	}
	
	function spawnParticle(x, y) {
		if (!floaterContainerRef) return;
		const emojis = ['✨', '💫', '⭐', '🌟', '+1'];
		const el = document.createElement('div');
		el.className = 'particle fixed';
		el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
		el.style.left = `${x + (Math.random() * 40 - 20)}px`;
		el.style.top = `${y + (Math.random() * 40 - 20)}px`;
		floaterContainerRef.appendChild(el);
		setTimeout(() => el.remove(), 1500);
	}
	
	function spawnBuildingVisual(id) {
		if (!leftBgRef) return;
		const b = BUILDINGS.find(x => x.id === id);
		if (!b) return;
		
		if (leftBgRef.children.length > 50) return;
		
		const el = document.createElement('div');
		el.className = `bg-visual-item ${ANIM_TYPES[id] || 'anim-float'}`;
		el.textContent = b.icon;
		el.style.left = `${Math.random() * 90}%`;
		el.style.top = `${Math.random() * 90}%`;
		el.style.animationDelay = `-${Math.random() * 5}s`;
		el.style.animationDuration = `${2 + Math.random() * 3}s`;
		leftBgRef.appendChild(el);
	}
	
	function initBackgroundVisuals() {
		if (!leftBgRef) return;
		leftBgRef.innerHTML = '';
		
		gameState.subscribe(state => {
			let allItems = [];
			BUILDINGS.forEach(b => {
				const count = state.inventory[b.id] || 0;
				for(let i=0; i<count; i++) {
					allItems.push(b.id);
				}
			});
			
			allItems.sort(() => Math.random() - 0.5);
			
			for(let i=0; i<Math.min(allItems.length, 50); i++) {
				spawnBuildingVisual(allItems[i]);
			}
		})();
	}
	
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
	
	function createLog(msg, classes = "") {
		latestLog.set(msg);
		logMessages.update(logs => {
			return [{ msg, classes, time: Date.now() }, ...logs.slice(0, 49)];
		});
	}
	
	function toggleLog() {
		logExpanded.update(v => !v);
	}
	
	function switchTab(tab) {
		currentTab = tab;
	}
	
	function plant(id) {
		gameState.update(state => {
			const cost = 100;
			if (state.vibes >= cost) {
				state.vibes -= cost;
				const plot = state.farming.plots.find(p => p.id === id);
				plot.stage = 1;
				
				let time = 10;
				if (state.farming.upgrades['gmo_seeds']) time /= 2;
				
				plot.maxTime = time;
				plot.timer = time;
				
				createLog("Planted a seed.", "text-green-300");
				saveGame(state);
			} else {
				createLog("Not enough vibes to plant!", "text-red-400");
			}
			return state;
		});
	}
	
	function harvest(id, event) {
		gameState.update(state => {
			const plot = state.farming.plots.find(p => p.id === id);
			if (plot.stage === 2) {
				plot.stage = 0;
				const yieldAmount = 1;
				state.farming.bioVibes += yieldAmount;
				
				const x = event.clientX || 0;
				const y = event.clientY || 0;
				spawnFloatingText(x, y, `+${yieldAmount}🥕`, true);
				createLog("Harvested a Bio-Vibe!", "text-orange-400");
				saveGame(state);
			}
			return state;
		});
	}
	
	function buyMarketItem(id) {
		gameState.update(state => {
			const item = FARM_MARKET.find(i => i.id === id);
			if (state.farming.bioVibes >= item.cost) {
				state.farming.bioVibes -= item.cost;
				state.farming.upgrades[id] = (state.farming.upgrades[id] || 0) + 1;
				createLog(`Bought ${item.name}!`, "text-orange-400");
				saveGame(state);
			}
			return state;
		});
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
	
	// Initialize on mount
	onMount(() => {
		setTimeout(() => {
			initBackgroundVisuals();
		}, 100);
	});
</script>

<svelte:window title="Emoji Clicker: The Vibe Check" />

<div class="bg-pattern text-white h-screen flex flex-col overflow-hidden">
	<!-- Top Bar -->
	<header class="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 z-20 shadow-lg">
		<div class="flex items-center gap-2">
			<span class="text-2xl">✨</span>
			<h1 class="text-xl font-bold hidden md:block">Emoji Clicker</h1>
		</div>
		
		<div class="flex-1 mx-4 overflow-hidden relative h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
			<p class="text-sm text-yellow-400 font-mono whitespace-nowrap animate-pulse">
				{$currentNews}
			</p>
		</div>

		<div class="flex items-center gap-4">
			<button on:click={handleSave} class="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded transition">
				<i class="fas fa-save mr-1"></i> Save
			</button>
			<button on:click={handleReset} class="text-xs bg-red-600 hover:bg-red-500 px-3 py-1 rounded transition">
				<i class="fas fa-trash mr-1"></i> Wipe
			</button>
		</div>
	</header>

	<!-- Main Game Area -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left Column -->
		<div class="w-full md:w-1/3 flex flex-col items-center justify-center relative p-6 border-r border-gray-700 bg-gray-900/90 backdrop-blur-sm overflow-hidden">
			<div bind:this={leftBgRef} class="absolute inset-0 overflow-hidden pointer-events-none z-0"></div>
			
			<div class="text-center mb-8 z-10">
				<h2 class="text-gray-400 text-sm uppercase tracking-widest mb-1">Current Vibes</h2>
				<div class="text-5xl font-bold text-yellow-400 drop-shadow-lg">{Math.floor(vibes).toLocaleString()}</div>
				<div class="text-gray-500 text-sm mt-2">per second: <span class="text-white">{vps.toFixed(1)}</span></div>
			</div>

			<div class="relative group z-10">
				<div 
					bind:this={emojiRef}
					class="emoji-main text-[150px] leading-none transition-transform active:scale-95 select-none"
					on:mousedown={handleEmojiClick}
					on:touchstart|preventDefault={(e) => handleEmojiClick(e.touches[0])}
				>
					{#key $currentRankIndex}
						{RANKS[$currentRankIndex].emoji}
					{/key}
				</div>
				<div class="absolute inset-0 border-2 border-dashed border-white/10 rounded-full w-[200px] h-[200px] -left-[25px] -top-[10px] animate-[spin_10s_linear_infinite] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
			</div>

			<div bind:this={rankNameRef} class="mt-8 text-xl font-bold shiny-text z-10">{RANKS[$currentRankIndex].name}</div>
			<div class="w-64 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden z-10">
				{#if RANKS[$currentRankIndex + 1]}
					{@const state = $gameState}
					{@const prevThreshold = RANKS[$currentRankIndex].threshold}
					{@const nextThreshold = RANKS[$currentRankIndex + 1].threshold}
					{@const progress = Math.min(100, ((state.totalVibes - prevThreshold) / (nextThreshold - prevThreshold)) * 100)}
					<div bind:this={progressBarRef} class="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300" style="width: {progress}%"></div>
				{:else}
					<div class="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300" style="width: 100%"></div>
				{/if}
			</div>
			<p class="text-xs text-gray-500 mt-1 z-10">
				{#if RANKS[$currentRankIndex + 1]}
					Next Evolution: {RANKS[$currentRankIndex + 1].threshold.toLocaleString()} Vibes
				{:else}
					Next Evolution: MAX
				{/if}
			</p>
		</div>

		<!-- Middle Column -->
		<div class="hidden lg:flex lg:w-1/3 flex-col bg-gray-900/80 border-r border-gray-700 relative overflow-hidden">
			<div class="flex items-center justify-center border-b border-gray-700 bg-gray-900/50 backdrop-blur z-10">
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

			<div class="flex-1 relative overflow-hidden">
				{#if currentTab === 'home'}
					<div class="absolute inset-0 flex flex-col items-center justify-center p-4">
						<div class="text-gray-600 italic text-center">
							<i class="fas fa-hammer text-4xl mb-2 opacity-50"></i><br>
							Themed activities coming soon...
						</div>
					</div>
				{:else if currentTab === 'farm'}
					{@const state = $gameState}
					<div class="absolute inset-0 flex flex-col items-center p-4 overflow-y-auto">
						<div class="w-full max-w-xs mb-6 bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
							<span class="text-gray-400 text-sm">Bio-Vibes:</span>
							<span class="text-2xl font-bold text-orange-400">🥕 {state.farming.bioVibes}</span>
						</div>

						<div class="farm-grid mb-8">
							{#each state.farming.plots as plot (plot.id)}
								{#if plot.stage === 0}
									<div class="farm-plot" on:click={() => plant(plot.id)}>
										<span class="text-gray-600 text-sm">Plant<br>100⚡</span>
									</div>
								{:else if plot.stage === 1}
									{@const progress = ((plot.maxTime - plot.timer) / plot.maxTime) * 100}
									<div class="farm-plot">
										🌱<div class="crop-growth" style="height: {progress}%"></div>
									</div>
								{:else if plot.stage === 2}
									<div class="farm-plot border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" on:click={(e) => harvest(plot.id, e)}>
										🥕
									</div>
								{/if}
							{/each}
						</div>

						<div class="w-full max-w-xs">
							<h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Farmers Market</h3>
							<div class="space-y-2">
								{#each FARM_MARKET as item}
									{@const state = $gameState}
									<div class="bg-gray-700 p-2 rounded flex justify-between items-center text-xs">
										<div class="flex items-center gap-2">
											<span class="text-xl">{item.icon}</span>
											<div>
												<div class="font-bold text-white">{item.name}</div>
												<div class="text-gray-400">{item.desc}</div>
											</div>
										</div>
										<button 
											on:click={() => buyMarketItem(item.id)}
											class="bg-orange-600 hover:bg-orange-500 px-2 py-1 rounded text-white font-bold {state.farming.bioVibes >= item.cost ? '' : 'opacity-50 cursor-not-allowed'}"
										>
											{item.cost}🥕
										</button>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Column: Store -->
		<div class="w-full md:w-2/3 lg:w-1/3 bg-gray-800 flex flex-col border-l border-gray-700 z-10">
			<div class="p-4 bg-gray-900 border-b border-gray-700 shadow-md">
				<h2 class="font-bold text-lg text-white"><i class="fas fa-shopping-cart mr-2 text-green-400"></i>Vibe Store</h2>
			</div>
			
			<div class="flex-1 overflow-y-auto p-2 space-y-2 pb-20">
				{@const state = $gameState}
				{#each BUILDINGS as building}
					{@const cost = getCost(building.id, state.inventory)}
					{@const count = state.inventory[building.id] || 0}
					{@const canAfford = state.vibes >= cost}
					<div 
						on:click={() => buyBuilding(building.id)}
						class="bg-gray-700 rounded-lg p-2 flex items-center justify-between cursor-pointer transition select-none border border-gray-600 mb-2 {canAfford ? 'hover:bg-gray-600' : 'opacity-50 cursor-not-allowed grayscale'}"
					>
						<div class="flex items-center gap-3">
							<div class="text-3xl bg-gray-800 w-12 h-12 flex items-center justify-center rounded-md shadow-inner">{building.icon}</div>
							<div>
								<div class="font-bold text-white">{building.name}</div>
								<div class="text-xs text-gray-400">{building.desc}</div>
								<div class="text-yellow-400 font-mono text-sm mt-1">⚡ {cost.toLocaleString()} Vibes</div>
							</div>
						</div>
						<div class="text-2xl font-bold text-gray-500 font-mono pr-2">{count}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Floating Container -->
	<div bind:this={floaterContainerRef} class="absolute inset-0 pointer-events-none overflow-hidden z-50"></div>

	<!-- Log Popover -->
	<div class="fixed bottom-4 left-4 z-50 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col justify-end log-popover {$logExpanded ? 'expanded' : ''}">
		{#if $logExpanded}
			<div class="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs text-gray-400 bg-gray-900/95 border-b border-gray-800">
				{#each $logMessages as log}
					<div class="border-b border-gray-800 pb-1 {log.classes}">> {log.msg}</div>
				{/each}
			</div>
		{/if}
		
		<div 
			on:click={toggleLog}
			class="h-12 bg-gray-800 hover:bg-gray-750 cursor-pointer flex items-center justify-between px-3 transition select-none"
		>
			<div class="flex items-center gap-2 overflow-hidden">
				<span class="text-green-400 text-xs">●</span>
				<span class="text-sm font-mono text-gray-300 truncate">{$latestLog}</span>
			</div>
			<i class="fas fa-chevron-up text-gray-500 text-xs transition-transform duration-300" style="transform: rotate({$logExpanded ? '180deg' : '0deg'})"></i>
		</div>
	</div>
</div>

