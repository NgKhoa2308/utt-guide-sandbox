const Favorites = {
  KEY: 'utt_fav',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  has(id) { return this.getAll().includes(id); },
  toggle(id) {
    const f = this.getAll(); const i = f.indexOf(id);
    if (i > -1) f.splice(i, 1); else f.push(id);
    localStorage.setItem(this.KEY, JSON.stringify(f));
    this.updateBadge();
    return i === -1;
  },
  updateBadge() {
    const n = this.getAll().length;
    document.querySelectorAll('.fav-badge').forEach(b => {
      b.textContent = n; b.style.display = n > 0 ? 'flex' : 'none';
    });
  }
};

const Ratings = {
  KEY: 'utt_ratings',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; } },
  get(id) { return this.getAll()[id] || 0; },
  set(id, s) { const a = this.getAll(); a[id] = s; localStorage.setItem(this.KEY, JSON.stringify(a)); }
};

const History = {
  KEY: 'utt_history', MAX: 10,
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  add(id) {
    let h = this.getAll().filter(x => x !== id);
    h.unshift(id); if (h.length > this.MAX) h = h.slice(0, this.MAX);
    localStorage.setItem(this.KEY, JSON.stringify(h));
  },
  clear() { localStorage.removeItem(this.KEY); }
};

const Views = {
  KEY: 'utt_views',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; } },
  get(id) { return this.getAll()[id] || 0; },
  inc(id) { const a = this.getAll(); a[id] = (a[id] || 0) + 1; localStorage.setItem(this.KEY, JSON.stringify(a)); }
};

const Compare = {
  KEY: 'utt_compare', MAX: 3,
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  toggle(id) {
    let l = this.getAll(); const i = l.indexOf(id);
    if (i > -1) l.splice(i, 1);
    else { if (l.length >= this.MAX) { alert('Tối đa 3 địa điểm'); return null; } l.push(id); }
    localStorage.setItem(this.KEY, JSON.stringify(l));
    return l.includes(id);
  },
  clear() { localStorage.removeItem(this.KEY); }
};

const DarkMode = {
  KEY: 'utt_dark',
  isOn() { return localStorage.getItem(this.KEY) === '1'; },
  toggle() { const n = !this.isOn(); localStorage.setItem(this.KEY, n ? '1' : '0'); this.apply(); return n; },
  apply() { document.documentElement.classList.toggle('dark', this.isOn()); },
  init() { this.apply(); }
};

function showToast(msg, type = 'success') {
  const c = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
  const t = document.createElement('div');
  t.className = `fixed bottom-6 right-6 ${c[type]} text-white px-6 py-3 rounded-lg shadow-2xl z-[9999] transition-all duration-300 transform translate-y-4 opacity-0`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.remove('translate-y-4', 'opacity-0'));
  setTimeout(() => { t.classList.add('translate-y-4', 'opacity-0'); setTimeout(() => t.remove(), 300); }, 2200);
}

function extractPriceNumber(s) { const m = s.replace(/\./g, '').match(/\d+/); return m ? parseInt(m[0]) : 0; }

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function renderStars(rating, interactive = false, placeId = null) {
  let h = '<div class="flex gap-0.5">';
  for (let i = 1; i <= 5; i++) {
    const f = i <= rating;
    const c = f ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600';
    const cu = interactive ? 'cursor-pointer hover:scale-125 transition' : '';
    const oc = interactive && placeId ? `onclick="setRating(${placeId}, ${i})"` : '';
    h += `<span class="text-2xl ${c} ${cu}" ${oc}>★</span>`;
  }
  return h + '</div>';
}

function setRating(id, s) {
  Ratings.set(id, s);
  showToast(`Đã đánh giá ${s} sao`);
  if (typeof renderDetail === 'function') renderDetail();
}

function toggleFavorite(id, e) {
  if (e) e.stopPropagation();
  const isFav = Favorites.toggle(id);
  showToast(isFav ? '❤️ Đã thêm yêu thích' : 'Đã xóa yêu thích');
  document.querySelectorAll(`[data-fav-id="${id}"]`).forEach(el => {
    el.innerHTML = isFav ? '❤️' : '🤍';
    el.classList.add('scale-125');
    setTimeout(() => el.classList.remove('scale-125'), 300);
  });
}

function toggleCompare(id, e) {
  if (e) e.stopPropagation();
  const added = Compare.toggle(id);
  if (added !== null && added !== undefined) {
    showToast(added ? '⚖️ Đã thêm vào so sánh' : 'Đã xóa khỏi so sánh');
    document.querySelectorAll(`[data-compare-id="${id}"]`).forEach(el => {
      el.classList.toggle('bg-purple-600', added);
      el.classList.toggle('text-white', added);
    });
  }
}

async function sharePlace(place) {
  const url = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}detail.html?id=${place.id}`;
  if (navigator.share) {
    try { await navigator.share({ title: place.name, text: `Xem ${place.name}`, url }); } catch {}
  } else {
    try { await navigator.clipboard.writeText(url); showToast('📋 Đã copy link'); } catch { prompt('Copy link:', url); }
  }
}

function sharePlaceById(id) {
  const p = PLACES.find(x => x.id === id);
  if (p) sharePlace(p);
}

function clearHistory() {
  History.clear();
  showToast('Đã xóa lịch sử');
  document.getElementById('historySection')?.classList.add('hidden');
}

function createPlaceCard(place) {
  const cat = CATEGORIES.find(c => c.id === place.category);
  const catColor = {
    'an-uong': 'bg-orange-100 text-orange-700', 'in-an': 'bg-blue-100 text-blue-700',
    'sua-chua': 'bg-gray-100 text-gray-700', 'nha-thuoc': 'bg-red-100 text-red-700',
    'cua-hang': 'bg-green-100 text-green-700', 'hoc-tap': 'bg-purple-100 text-purple-700',
    'khac': 'bg-yellow-100 text-yellow-700'
  }[place.category] || 'bg-gray-100 text-gray-700';
  const isFav = Favorites.has(place.id);
  const r = Ratings.get(place.id);
  const v = Views.get(place.id);
  return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden card-hover relative">
      <div class="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative flex items-center justify-center">
        <i class="fas fa-store text-4xl text-white/30"></i>
        ${place.featured ? '<div class="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full">⭐ Nổi bật</div>' : ''}
        <button data-fav-id="${place.id}" onclick="toggleFavorite(${place.id}, event)" class="absolute top-2 right-2 bg-white/90 w-8 h-8 rounded-full flex items-center justify-center shadow hover:scale-110 transition text-lg">${isFav ? '❤️' : '🤍'}</button>
      </div>
      <a href="detail.html?id=${place.id}" class="block p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold px-2 py-1 rounded-full ${catColor}">${cat ? cat.icon + ' ' + cat.name : ''}</span>
          ${r > 0 ? `<span class="text-xs text-yellow-500 font-bold">★ ${r}</span>` : ''}
        </div>
        <h3 class="font-bold mb-1 line-clamp-1">${place.name}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">${place.description}</p>
        <div class="flex items-center text-xs text-gray-400 mb-2">
          <i class="fas fa-map-marker-alt mr-1 text-red-400"></i>
          <span class="line-clamp-1">${place.address}</span>
        </div>
        <div class="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
          <span class="text-green-600 font-bold">${place.price}</span>
          <span class="text-gray-400 text-xs">👁 ${v}</span>
        </div>
      </a>
    </div>
  `;
}