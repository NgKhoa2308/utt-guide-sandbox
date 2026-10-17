let state = {
  category: null,
  priceFilter: null,
  distanceFilter: null,
  sortBy: 'default',
  keyword: ''
};

function readParams() {
  const p = new URLSearchParams(location.search);
  state.category = p.get('cat');
  state.keyword = p.get('q') || '';
  const si = document.getElementById('searchInput');
  if (si) si.value = state.keyword;
}

function updateTitle() {
  const t = document.getElementById('pageTitle');
  const b = document.getElementById('breadcrumb');
  if (!t) return;
  if (state.category) {
    const c = CATEGORIES.find(x => x.id === state.category);
    if (c) { t.textContent = `${c.icon} ${c.name}`; b.textContent = c.name; }
  } else if (state.keyword) {
    t.textContent = `Kết quả: "${state.keyword}"`;
    b.textContent = 'Tìm kiếm';
  } else {
    t.textContent = 'Tất cả địa điểm';
    b.textContent = 'Tất cả địa điểm';
  }
}

function getFiltered() {
  let places = PLACES.filter(p => {
    if (state.category && p.category !== state.category) return false;
    // Lọc theo giá
    if (state.priceFilter) {
      const n = extractPriceNumber(place.price);
      
      if (state.category === 'nha-tro') {
        // Lọc nhà trọ (tính bằng VNĐ)
        if (state.priceFilter === 'duoi-2-trieu' && n > 2000000) return false;
        if (state.priceFilter === '2-3-trieu' && (n < 2000000 || n > 3000000)) return false;
        if (state.priceFilter === 'tren-3-trieu' && n < 3000000) return false;
      } else {
        // Lọc quán ăn/dịch vụ (tính bằng nghìn)
        if (state.priceFilter === 'duoi-30' && n > 30000) return false;
        if (state.priceFilter === '30-50' && (n < 30000 || n > 50000)) return false;
        if (state.priceFilter === 'tren-50' && n < 50000) return false;
      }
    }
    if (state.distanceFilter) {
      const d = getDistance(UTT_LOCATION[0], UTT_LOCATION[1], p.lat, p.lng);
      if (state.distanceFilter === 'duoi-500' && d > 500) return false;
      if (state.distanceFilter === '500-1000' && (d < 500 || d > 1000)) return false;
      if (state.distanceFilter === 'tren-1000' && d < 1000) return false;
    }
    if (state.keyword) {
      const k = state.keyword.toLowerCase();
      const txt = `${p.name} ${p.description} ${p.address}`.toLowerCase();
      if (!txt.includes(k)) return false;
    }
    return true;
  });

  if (state.sortBy === 'price-asc') places.sort((a, b) => extractPriceNumber(a.price) - extractPriceNumber(b.price));
  else if (state.sortBy === 'price-desc') places.sort((a, b) => extractPriceNumber(b.price) - extractPriceNumber(a.price));
  else if (state.sortBy === 'name') places.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  else if (state.sortBy === 'rating') places.sort((a, b) => (Ratings.get(b.id) || 0) - (Ratings.get(a.id) || 0));
  else if (state.sortBy === 'popular') places.sort((a, b) => Views.get(b.id) - Views.get(a.id));
  else if (state.sortBy === 'distance') places.sort((a, b) => {
    const da = getDistance(UTT_LOCATION[0], UTT_LOCATION[1], a.lat, a.lng);
    const db = getDistance(UTT_LOCATION[0], UTT_LOCATION[1], b.lat, b.lng);
    return da - db;
  });

  return places;
}

function renderCategoryFilter() {
  const el = document.getElementById('categoryFilter');
  if (!el) return;
  const btn = (id, label, active) => `<button class="filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-blue-100 transition ${active ? 'active-filter' : ''}" data-cat="${id}">${label}</button>`;
  el.innerHTML = btn('', 'Tất cả', !state.category) +
    CATEGORIES.map(c => btn(c.id, `${c.icon} ${c.name}`, state.category === c.id)).join('');
  el.querySelectorAll('.filter-btn').forEach(b => {
    b.onclick = () => {
      state.category = b.dataset.cat || null;
      state.priceFilter = null;
      updateTitle();
      renderCategoryFilter();
      renderPriceFilter();
      renderPlaces();
    };
  });
}

function renderPriceFilter() {
  const el = document.getElementById('priceFilter');
  if (!el) return;

  // Nếu là nhà trọ thì hiện mức giá theo TRIỆU, ngược lại hiện theo NGHÌN
  const options = state.category === 'nha-tro'
    ? [
        { id: null, label: 'Tất cả mức thuê', icon: '💰' },
        { id: 'duoi-2-trieu', label: 'Dưới 2 triệu/tháng', icon: '💵' },
        { id: '2-3-trieu', label: '2 - 3 triệu/tháng', icon: '💴' },
        { id: 'tren-3-trieu', label: 'Trên 3 triệu/tháng', icon: '💸' }
      ]
    : [
        { id: null, label: 'Tất cả mức giá', icon: '💰' },
        { id: 'duoi-30', label: 'Dưới 30.000đ', icon: '💵' },
        { id: '30-50', label: '30.000 - 50.000đ', icon: '💴' },
        { id: 'tren-50', label: 'Trên 50.000đ', icon: '💸' }
      ];

  el.innerHTML = options.map(opt => `
    <label class="flex items-center gap-2 cursor-pointer text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
      <input type="radio" name="price" value="${opt.id || ''}" ${state.priceFilter === opt.id ? 'checked' : ''} class="accent-blue-600">
      <span>${opt.icon} ${opt.label}</span>
    </label>
  `).join('');

  el.querySelectorAll('input[name="price"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.priceFilter = radio.value || null;
      renderPlaces();
    });
  });
}

function renderDistanceFilter() {
  const el = document.getElementById('distanceFilter');
  if (!el) return;
  const opts = [
    { id: null, l: 'Tất cả' },
    { id: 'duoi-500', l: 'Dưới 500m' },
    { id: '500-1000', l: '500m - 1km' },
    { id: 'tren-1000', l: 'Trên 1km' }
  ];
  el.innerHTML = opts.map(o => `
    <label class="flex items-center gap-2 cursor-pointer text-sm p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
      <input type="radio" name="distance" value="${o.id || ''}" ${state.distanceFilter === o.id ? 'checked' : ''} class="accent-blue-600">
      <span>${o.l}</span>
    </label>`).join('');
  el.querySelectorAll('input[name="distance"]').forEach(r => {
    r.onchange = () => { state.distanceFilter = r.value || null; renderPlaces(); };
  });
}

function renderSortOptions() {
  const el = document.getElementById('sortSelect');
  if (!el) return;
  const opts = [
    { id: 'default', l: 'Mặc định' },
    { id: 'price-asc', l: 'Giá thấp → cao' },
    { id: 'price-desc', l: 'Giá cao → thấp' },
    { id: 'name', l: 'Tên A → Z' },
    { id: 'rating', l: 'Đánh giá cao' },
    { id: 'popular', l: 'Xem nhiều' },
    { id: 'distance', l: 'Gần nhất' }
  ];
  el.innerHTML = opts.map(o => `<option value="${o.id}" ${state.sortBy === o.id ? 'selected' : ''}>${o.l}</option>`).join('');
  el.onchange = e => { state.sortBy = e.target.value; renderPlaces(); };
}

function renderPlaces() {
  const grid = document.getElementById('placesGrid');
  const empty = document.getElementById('emptyState');
  const cnt = document.getElementById('resultCount');
  if (!grid) return;

  const places = getFiltered();
  if (cnt) cnt.textContent = `Tìm thấy ${places.length} địa điểm`;

  if (places.length === 0) {
    grid.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }
  empty?.classList.add('hidden');

  grid.innerHTML = places.map(p => {
    const cat = CATEGORIES.find(c => c.id === p.category);
    const catColor = {
      'an-uong': 'bg-orange-100 text-orange-700', 'in-an': 'bg-blue-100 text-blue-700',
      'sua-chua': 'bg-gray-100 text-gray-700', 'nha-thuoc': 'bg-red-100 text-red-700',
      'cua-hang': 'bg-green-100 text-green-700', 'hoc-tap': 'bg-purple-100 text-purple-700',
      'nha-tro': 'bg-rose-100 text-rose-700','khac': 'bg-yellow-100 text-yellow-700'
    }[p.category] || 'bg-gray-100 text-gray-700';
    const isFav = Favorites.has(p.id);
    const isVisited = Visited.has(p.id);
    const r = Ratings.get(p.id);
    const v = Views.get(p.id);
    const d = getDistance(UTT_LOCATION[0], UTT_LOCATION[1], p.lat, p.lng);
    const dText = d < 1000 ? `${d}m` : `${(d/1000).toFixed(1)}km`;
    const img = getPlaceImage(p);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden card-hover relative">
        <div class="h-36 relative overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img src="${img}" alt="${p.name}" loading="lazy"
               class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div style="display:none;background:linear-gradient(135deg,#3b82f6,#8b5cf6);" class="w-full h-full items-center justify-center">
            <i class="fas fa-store text-5xl text-white/40"></i>
          </div>
          ${p.featured ? '<div class="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full shadow">⭐ Nổi bật</div>' : ''}
          ${isVisited ? '<div class="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">✅ Đã đến</div>' : ''}
          <button data-fav-id="${p.id}" onclick="toggleFavorite(${p.id}, event)" 
                  class="absolute top-2 right-2 bg-white/90 backdrop-blur w-9 h-9 rounded-full flex items-center justify-center shadow hover:scale-110 transition text-lg">
            ${isFav ? '❤️' : '🤍'}
          </button>
          <div class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            <i class="fas fa-route mr-1"></i>${dText}
          </div>
        </div>
        <a href="detail.html?id=${p.id}" class="block p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold px-2 py-1 rounded-full ${catColor}">${cat ? cat.icon + ' ' + cat.name : ''}</span>
            ${r > 0 ? `<span class="text-xs text-yellow-500 font-bold">★ ${r}</span>` : ''}
          </div>
          <h3 class="font-bold mb-1 line-clamp-1">${p.name}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">${p.description}</p>
          <div class="flex items-center text-xs text-gray-400 mb-2">
            <i class="fas fa-map-marker-alt mr-1 text-red-400"></i>
            <span class="line-clamp-1">${p.address}</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-sm">
            <span class="text-green-600 font-bold">${p.price}</span>
            <span class="text-gray-400 text-xs">👁 ${v}</span>
          </div>
        </a>
      </div>
    `;
  }).join('');
}

function handleSearch() {
  const v = document.getElementById('searchInput').value.trim();
  state.keyword = v;
  updateTitle();
  renderPlaces();
}

document.addEventListener('DOMContentLoaded',async  () => {
  await initPlacesFromAPI();
  await syncFavoritesFromSupabase();

  DarkMode.init();
  Favorites.updateBadge();

  const b = document.getElementById('darkModeBtn');
  if (b) {
    const u = () => b.innerHTML = DarkMode.isOn() ? '☀️' : '🌙';
    u();
    b.onclick = () => { DarkMode.toggle(); u(); };
  }

  readParams();
  updateTitle();
  renderCategoryFilter();
  renderPriceFilter();
  renderDistanceFilter();
  renderSortOptions();
  renderPlaces();

  const sb = document.getElementById('searchBtn');
  const si = document.getElementById('searchInput');
  if (sb) sb.onclick = handleSearch;
  if (si) si.onkeypress = e => { if (e.key === 'Enter') handleSearch(); };

  document.getElementById('resetFilter')?.addEventListener('click', () => {
    state = { category: null, priceFilter: null, distanceFilter: null, sortBy: 'default', keyword: '' };
    if (si) si.value = '';
    updateTitle();
    renderCategoryFilter();
    renderPriceFilter();
    renderDistanceFilter();
    renderSortOptions();
    renderPlaces();
  });

  document.getElementById('clearSearch')?.addEventListener('click', () => {
    document.getElementById('resetFilter').click();
  });
    document.getElementById('randomBtn')?.addEventListener('click', () => {
    randomPlace(state.category);
  });
  document.getElementById('nearMeBtn')?.addEventListener('click', findNearMe);
});