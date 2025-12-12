import { BUILDINGS } from '../stores/gameStore.js';

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

export function spawnFloatingText(container, x, y, text, isClick = false) {
	if (!container) return;
	const el = document.createElement('div');
	el.className = 'floating-text';
	el.style.left = `${x}px`;
	el.style.top = `${y}px`;
	el.textContent = text;
	el.style.color = isClick ? '#fff' : '#818cf8';
	el.style.fontSize = isClick ? '24px' : '16px';
	container.appendChild(el);
	setTimeout(() => el.remove(), 1000);
}

export function spawnParticle(container, x, y) {
	if (!container) return;
	const emojis = ['✨', '💫', '⭐', '🌟', '+1'];
	const el = document.createElement('div');
	el.className = 'particle';
	el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
	el.style.left = `${x + (Math.random() * 40 - 20)}px`;
	el.style.top = `${y + (Math.random() * 40 - 20)}px`;
	container.appendChild(el);
	setTimeout(() => el.remove(), 1500);
}

export function spawnBuildingVisual(container, id) {
	if (!container) return;
	const b = BUILDINGS.find(x => x.id === id);
	if (!b) return;
	
	if (container.children.length > 50) return;
	
	const el = document.createElement('div');
	el.className = `bg-visual-item ${ANIM_TYPES[id] || 'anim-float'}`;
	el.textContent = b.icon;
	el.style.left = `${Math.random() * 90}%`;
	el.style.top = `${Math.random() * 90}%`;
	el.style.animationDelay = `-${Math.random() * 5}s`;
	el.style.animationDuration = `${2 + Math.random() * 3}s`;
	container.appendChild(el);
}

export function initBackgroundVisuals(container, inventory) {
	if (!container) return;
	container.innerHTML = '';
	
	let allItems = [];
	BUILDINGS.forEach(b => {
		const count = inventory[b.id] || 0;
		for(let i=0; i<count; i++) {
			allItems.push(b.id);
		}
	});
	
	allItems.sort(() => Math.random() - 0.5);
	
	for(let i=0; i<Math.min(allItems.length, 50); i++) {
		spawnBuildingVisual(container, allItems[i]);
	}
}

