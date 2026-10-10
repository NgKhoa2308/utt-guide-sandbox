function getPlaceId() {
  const p = new URLSearchParams(location.search);
  return parseInt(p.get('id')) || 1;
}

function renderDetail() {
  const container = document.getElementById('detailContent');
  if (!container) return;

  const id = getPlaceId();
  const place = PLACES.find(p => p.id === id);

  if (!place) {
    container.innerHTML = `
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700 dark:text-red-200 font-semibold">Không tìm thấy địa điểm</p>
        <a href="index.html" class="text-blue-600 hover:underline text-sm mt-2 inline-block">← Về trang chủ</a>
      </div>`;
    return;
  }

  History.add(id);
  Views.inc(id);

  const cat = CATEGORIES.find(c => c.id === place.category);
  const gmap = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const isFav = Favorites.has(id);
  const r = Ratings.get(id);
  const v = Views.get(id);
  const d = getDistance(UTT_LOCATION[0], UTT_LOCATION[1], place.lat, place.lng);
  const dText = d < 1000 ? `${d}m` : `${(d/1000).toFixed(1)}km`;

  container.innerHTML = `
    <nav class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      <a href="index.html" class="hover:text-blue-600">Trang chủ</a>
      <span class="mx-2">›</span>
      <a href="category.html?cat=${place.category}" class="hover:text-blue-600">${cat ? cat.name : 'Địa điểm'}</a>
      <span class="mx-2">›</span>
      <span class="font-semibold">${place.name}</span>
    </nav>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">${cat ? cat.icon + ' ' + cat.name : ''}</span>
            ${place.featured ? '<span class="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">⭐ Nổi bật</span>' : ''}
          </div>
          <div class="flex gap-2">
            <button data-fav-id="${id}" onclick="toggleFavorite(${id}, event)" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center text-xl transition">${isFav ? '❤️' : '🤍'}</button>
            <button onclick="sharePlaceById(${id})" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center transition"><i class="fas fa-share-alt"></i></button>
            <button onclick="toggleCompare(${id}, event)" data-compare-id="${id}" class="bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 w-10 h-10 rounded-full flex items-center justify-center transition"><i class="fas fa-balance-scale text-purple-700 dark:text-purple-200"></i></button>
          </div>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold mb-2">${place.name}</h1>
        <p class="text-gray-500 dark:text-gray-400">📍 ${place.address}</p>

        <div class="mt-4 flex items-center gap-4 flex-wrap text-sm">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-600 dark:text-gray-300">Đánh giá:</span>
            <div id="ratingStars">${renderStars(r, true, id)}</div>
          </div>
          <div class="text-gray-500 dark:text-gray-400">👁 ${v} lượt xem</div>
          <div class="text-gray-500 dark:text-gray-400">📏 Cách UTT ${dText}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Giá tham khảo</p>
          <p class="text-green-600 font-bold">${place.price}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Giờ mở cửa</p>
          <p class="font-semibold">${place.hours}</p>
        </div>
        <div class="col-span-2 md:col-span-1">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Tọa độ</p>
          <p class="text-sm text-gray-600 dark:text-gray-300">${place.lat}, ${place.lng}</p>
        </div>
      </div>

      <div class="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-lg font-bold mb-2">Mô tả</h2>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">${place.description}</p>
      </div>

      <div class="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-lg font-bold mb-3">Vị trí trên bản đồ</h2>
        <div id="miniMap" style="height: 300px; border-radius: 8px;"></div>
      </div>

      <div class="p-6 flex flex-col md:flex-row gap-3">
        <a href="${gmap}" target="_blank" class="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition">🧭 Chỉ đường đến đây</a>
        <a href="category.html?cat=${place.category}" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-center py-3 rounded-lg font-semibold hover:bg-gray-300 transition">Xem địa điểm khác cùng loại</a>
      </div>
    </div>

    <div id="relatedSection" class="mt-8"></div>
  `;

  renderRelated(place);
  initMiniMap(place);
}

function renderRelated(place) {
  const sec = document.getElementById('relatedSection');
  if (!sec) return;
  const rel = PLACES.filter(p => p.category === place.category && p.id !== place.id).slice(0, 3);
  if (rel.length === 0) return;
  sec.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Địa điểm tương tự</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${rel.map(p => `
        <a href="detail.html?id=${p.id}" class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 hover:shadow-lg transition card-hover">
          <h3 class="font-bold mb-2 line-clamp-1">${p.name}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">${p.description}</p>
          <div class="flex justify-between text-sm">
            <span class="text-green-600 font-semibold">${p.price}</span>
            <span class="text-gray-400">${p.hours}</span>
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

function initMiniMap(place) {
  const el = document.getElementById('miniMap');
  if (!el) return;
  const map = L.map('miniMap').setView([place.lat, place.lng], 17);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri', maxZoom: 19
  }).addTo(map);
  L.marker([place.lat, place.lng]).addTo(map).bindPopup(`<strong>${place.name}</strong>`).openPopup();
}

document.addEventListener('DOMContentLoaded', () => {
  DarkMode.init();
  Favorites.updateBadge();

  const b = document.getElementById('darkModeBtn');
  if (b) {
    const u = () => b.innerHTML = DarkMode.isOn() ? '☀️' : '🌙';
    u();
    b.onclick = () => { DarkMode.toggle(); u(); };
  }

  renderDetail();
});