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

  const cat = CATEGORIES.find(c => c.id === place.category);
  const gmap = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const isFav = Favorites.has(id);
  const isVisited = Visited.has(id);
  const isWish = Wishlist.has(id);
  const r = Ratings.get(id);
  const v = Views.get(id);
  const d = getDistance(UTT_LOCATION[0], UTT_LOCATION[1], place.lat, place.lng);
  const dText = d < 1000 ? `${d}m` : `${(d/1000).toFixed(1)}km`;
  const img = getPlaceImage(place);
  const note = Notes.get(id);

  container.innerHTML = `
    <nav class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      <a href="index.html" class="hover:text-blue-600">Trang chủ</a>
      <span class="mx-2">›</span>
      <a href="category.html?cat=${place.category}" class="hover:text-blue-600">${cat ? cat.name : 'Địa điểm'}</a>
      <span class="mx-2">›</span>
      <span class="font-semibold">${place.name}</span>
    </nav>

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div class="relative h-64 md:h-80 bg-gray-200 dark:bg-gray-700">
        <img src="${img}" alt="${place.name}"
             class="w-full h-full object-cover"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div style="display:none;background:linear-gradient(135deg,#3b82f6,#8b5cf6);" class="w-full h-full items-center justify-center">
          <i class="fas fa-store text-8xl text-white/30"></i>
        </div>
        ${place.featured ? '<div class="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">⭐ Nổi bật</div>' : ''}
        ${isVisited ? '<div class="absolute bottom-4 left-4 bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">✅ Đã đến</div>' : ''}
      </div>

      <div class="p-6 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-start justify-between flex-wrap gap-3 mb-3">
          <span class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">${cat ? cat.icon + ' ' + cat.name : ''}</span>
          <div class="flex gap-2">
            <button data-fav-id="${id}" onclick="toggleFavorite(${id}, event)" 
                    class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center text-xl transition"
                    title="Yêu thích">
              ${isFav ? '❤️' : '🤍'}
            </button>
            <button onclick="sharePlaceById(${id})" 
                    class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center transition"
                    title="Chia sẻ">
              <i class="fas fa-share-alt"></i>
            </button>
            <button onclick="toggleCompare(${id}, event)" data-compare-id="${id}"
                    class="bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 w-10 h-10 rounded-full flex items-center justify-center transition"
                    title="So sánh">
              <i class="fas fa-balance-scale text-purple-700 dark:text-purple-200"></i>
            </button>
          </div>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold mb-2">${place.name}</h1>
        <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
          <i class="fas fa-map-marker-alt text-red-400"></i>
          <span>${place.address}</span>
          <button onclick="copyAddress('${place.address.replace(/'/g, "\\'")}', event)" 
                  class="text-blue-600 hover:text-blue-800 text-xs ml-2"
                  title="Copy địa chỉ">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>

        <div class="flex items-center gap-4 flex-wrap text-sm">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-600 dark:text-gray-300">Đánh giá:</span>
            <div id="ratingStars">${renderStars(r, true, id)}</div>
          </div>
          <div class="text-gray-500 dark:text-gray-400">👁 ${v} lượt xem</div>
          <div class="text-gray-500 dark:text-gray-400">📏 Cách UTT ${dText}</div>
        </div>
      </div>

      <!-- NÚT HÀNH ĐỘNG CÁ NHÂN -->
      <div class="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
        <div class="flex flex-wrap gap-2">
          <button data-visited-id="${id}" onclick="toggleVisited(${id}, event)" 
                  class="px-4 py-2 rounded-lg font-semibold text-sm transition ${isVisited ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100'}">
            ${isVisited ? '✅ Đã đến' : '📍 Đánh dấu đã đến'}
          </button>
          <button data-wishlist-id="${id}" onclick="toggleWishlist(${id}, event)" 
                  class="px-4 py-2 rounded-lg font-semibold text-sm transition ${isWish ? 'bg-yellow-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100'}">
            ${isWish ? '⭐ Muốn đến' : '☆ Muốn đến'}
          </button>
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

      <!-- GHI CHÚ CÁ NHÂN -->
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
        <h2 class="text-lg font-bold mb-3 flex items-center gap-2">
          <i class="fas fa-sticky-note text-yellow-500"></i>Ghi chú của bạn
        </h2>
        <textarea id="noteInput" rows="3" placeholder="VD: Quán này ngon, đi 2 lần rồi. Nhớ gọi cơm tấm..."
                  class="w-full px-4 py-3 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-yellow-400 text-sm resize-none">${note}</textarea>
        <div class="flex gap-2 mt-2">
          <button onclick="saveNote(${id}, document.getElementById('noteInput').value)" 
                  class="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition">
            <i class="fas fa-save mr-1"></i>Lưu ghi chú
          </button>
          ${note ? `<button onclick="deleteNote(${id}, event)" class="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition"><i class="fas fa-trash mr-1"></i>Xóa</button>` : ''}
        </div>
      </div>

      <div class="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-lg font-bold mb-3">Vị trí trên bản đồ</h2>
        <div id="miniMap" style="height: 300px; border-radius: 8px;"></div>
      </div>

      <div class="p-6 flex flex-col md:flex-row gap-3">
        <a href="${gmap}" target="_blank" class="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
          🧭 Chỉ đường đến đây
        </a>
        <a href="category.html?cat=${place.category}" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-center py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
          Xem địa điểm khác cùng loại
        </a>
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
      ${rel.map(p => {
        const img = getPlaceImage(p);
        return `
          <a href="detail.html?id=${p.id}" class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden hover:shadow-lg transition card-hover block">
            <div class="h-32 relative overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img src="${img}" alt="${p.name}" loading="lazy" class="w-full h-full object-cover">
            </div>
            <div class="p-4">
              <h3 class="font-bold mb-2 line-clamp-1">${p.name}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">${p.description}</p>
              <div class="flex justify-between text-sm">
                <span class="text-green-600 font-semibold">${p.price}</span>
                <span class="text-gray-400">${p.hours}</span>
              </div>
            </div>
          </a>
        `;
      }).join('')}
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

  // Chỉ tăng view + lịch sử 1 lần khi vào trang
  const id = getPlaceId();
  const place = PLACES.find(p => p.id === id);
  if (place) {
    History.add(id);
    Views.inc(id);
  }

  renderDetail();
});