// Chặn scroll lan ra ngoài dropdown
document.addEventListener('DOMContentLoaded', () => {
  const suggestions = document.getElementById('suggestions');
  if (suggestions) {
    suggestions.addEventListener('wheel', (e) => {
      const atTop = suggestions.scrollTop === 0;
      const atBottom = suggestions.scrollTop + suggestions.clientHeight >= suggestions.scrollHeight - 1;
      
      // Nếu đang ở đầu mà cuộn lên, hoặc ở cuối mà cuộn xuống → chặn
      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    }, { passive: false });
  }
});

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  const colors = {
    'an-uong': 'from-orange-400 to-red-400', 'in-an': 'from-blue-400 to-cyan-400',
    'sua-chua': 'from-gray-400 to-gray-600', 'nha-thuoc': 'from-red-400 to-pink-500',
    'cua-hang': 'from-green-400 to-emerald-500', 'hoc-tap': 'from-purple-400 to-indigo-500',
    'nha-tro': 'from-rose-400 to-orange-400','khac': 'from-yellow-400 to-amber-500'
  };
  grid.innerHTML = CATEGORIES.map(c => {
    const n = PLACES.filter(p => p.category === c.id).length;
    return `
      <a href="category.html?cat=${c.id}" class="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-md card-hover block">
        <div class="bg-gradient-to-br ${colors[c.id]} w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl shadow-lg">${c.icon}</div>
        <div class="font-bold mb-1 text-sm">${c.name}</div>
        <div class="text-xs text-gray-400">${n} địa điểm</div>
      </a>
    `;
  }).join('');
}

function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  grid.innerHTML = PLACES.filter(p => p.featured).map(p => createPlaceCard(p)).join('');
}

function renderHistory() {
  const sec = document.getElementById('historySection');
  const grid = document.getElementById('historyGrid');
  if (!sec || !grid) return;
  const ids = History.getAll();
  if (ids.length === 0) return sec.classList.add('hidden');
  const places = ids.map(id => PLACES.find(p => p.id === id)).filter(Boolean).slice(0, 4);
  if (places.length === 0) return sec.classList.add('hidden');
  sec.classList.remove('hidden');
  grid.innerHTML = places.map(p => createPlaceCard(p)).join('');
}

function initMap() {
  const el = document.getElementById('map');
  if (!el) return;
  const map = L.map('map').setView(UTT_LOCATION, 15);
  const street = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri', maxZoom: 19 });
  const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri', maxZoom: 19 });
  street.addTo(map);
  L.control.layers({ '🗺️ Đường phố': street, '🛰️ Vệ tinh': sat }, null, { position: 'topright' }).addTo(map);

  const markers = L.markerClusterGroup({
    showCoverageOnHover: false, maxClusterRadius: 50, spiderfyOnMaxZoom: true,
    iconCreateFunction: c => L.divIcon({
      html: `<div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:white;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;border:3px solid white;box-shadow:0 4px 12px rgba(220,38,38,.4);">${c.getChildCount()}</div>`,
      className: 'cluster', iconSize: [44, 44]
    })
  });

  PLACES.forEach(p => {
    const cat = CATEGORIES.find(c => c.id === p.category);
    const g = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
    const ico = L.divIcon({
      className: 'place-marker',
      html: `<div style="background:#ef4444;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,.3);border:2px solid white;display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:12px;color:white;">${cat ? cat.icon : '📍'}</span></div>`,
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
    });
    markers.addLayer(L.marker([p.lat, p.lng], { icon: ico }).bindPopup(`
      <div style="min-width:220px;">
        <div style="font-size:15px;font-weight:bold;color:#1e40af;margin-bottom:6px;">${p.name}</div>
        <div style="font-size:12px;color:#666;margin-bottom:4px;">📍 ${p.address}</div>
        <div style="font-size:13px;color:#16a34a;font-weight:bold;margin-bottom:4px;">💰 ${p.price}</div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <a href="detail.html?id=${p.id}" style="flex:1;text-align:center;background:#3b82f6;color:white;padding:6px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:bold;">Chi tiết</a>
          <a href="${g}" target="_blank" style="flex:1;text-align:center;background:#16a34a;color:white;padding:6px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:bold;">Chỉ đường</a>
        </div>
      </div>
    `));
  });
  map.addLayer(markers);
}

function handleSearch() {
  const v = document.getElementById('searchInput').value.trim();
  if (!v) return alert('Nhập từ khóa');
  location.href = `category.html?q=${encodeURIComponent(v)}`;
}

function showSuggestions(kw) {
  const box = document.getElementById('suggestions');
  if (!box) return;
  if (!kw || kw.length < 1) return box.classList.add('hidden');
  
  const k = kw.toLowerCase();
  const m = PLACES.filter(p => 
    p.name.toLowerCase().includes(k) || 
    p.description.toLowerCase().includes(k) || 
    p.address.toLowerCase().includes(k)
  ).slice(0, 5);

  if (!m.length) return box.classList.add('hidden');

  box.innerHTML = m.map(p => {
    const c = CATEGORIES.find(x => x.id === p.category);
    return `
      <a href="detail.html?id=${p.id}" 
         class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition">
        <span class="text-2xl">${c ? c.icon : '📍'}</span>
        <div class="flex-1 min-w-0">
          <div class="suggestion-name truncate">${p.name}</div>
          <div class="suggestion-address text-xs truncate">${p.address}</div>
        </div>
      </a>
    `;
  }).join('');
  box.classList.remove('hidden');
}

function initDarkBtn() {
  const b = document.getElementById('darkModeBtn');
  if (!b) return;
  const u = () => b.innerHTML = DarkMode.isOn() ? '☀️' : '🌙';
  u();
  b.onclick = () => { DarkMode.toggle(); u(); };
}

// ============ CẬP NHẬT SỐ LIỆU THỐNG KÊ ============
function updateStats() {
  const statPlaces = document.getElementById('statPlaces');
  const statCategories = document.getElementById('statCategories');
  
  if (statPlaces) statPlaces.textContent = PLACES.length;
  if (statCategories) statCategories.textContent = CATEGORIES.length;
  
  // Bonus: hiệu ứng đếm số từ 0 lên
  animateCount(statPlaces, PLACES.length);
  animateCount(statCategories, CATEGORIES.length);
}

// Hiệu ứng đếm số
function animateCount(el, target) {
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30)); // 30 bước
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current;
  }, 30); // 30ms/bước → ~1 giây
}

document.addEventListener('DOMContentLoaded', async () => {
  await initPlacesFromAPI();
  await syncFavoritesFromSupabase();

  DarkMode.init();
  Favorites.updateBadge();
  renderCategories();
  renderFeatured();
  renderHistory();
  initMap();
  updateStats();
  initDarkBtn();

  const si = document.getElementById('searchInput');
  const sb = document.getElementById('searchBtn');
  const sg = document.getElementById('suggestions');
  if (sb) sb.onclick = handleSearch;
  if (si) {
    si.onkeypress = e => { if (e.key === 'Enter') handleSearch(); };
    si.oninput = e => showSuggestions(e.target.value);
    si.onblur = () => setTimeout(() => sg?.classList.add('hidden'), 200);
  }
  document.querySelectorAll('.quick-search').forEach(b => {
    b.onclick = () => location.href = `category.html?q=${encodeURIComponent(b.dataset.keyword)}`;
  });
  const mb = document.getElementById('menuBtn');
  const mm = document.getElementById('mobileMenu');
  if (mb && mm) mb.onclick = () => mm.classList.toggle('hidden');
});