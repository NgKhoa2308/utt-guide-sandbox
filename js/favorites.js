function renderFavorites() {
  const grid = document.getElementById('favoritesGrid');
  const empty = document.getElementById('emptyFavorites');
  const cnt = document.getElementById('favCount');
  if (!grid) return;

  const ids = Favorites.getAll();
  const places = ids.map(id => PLACES.find(p => p.id === id)).filter(Boolean);

  if (cnt) cnt.textContent = `${places.length} địa điểm yêu thích`;

  if (places.length === 0) {
    grid.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }
  empty?.classList.add('hidden');

  grid.innerHTML = places.map(p => {
    const cat = CATEGORIES.find(c => c.id === p.category);
    const r = Ratings.get(p.id);
    return `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden card-hover">
        <div class="h-28 bg-gradient-to-br from-pink-500 to-red-500 relative flex items-center justify-center">
          <i class="fas fa-heart text-4xl text-white/40"></i>
          <button data-fav-id="${p.id}" onclick="toggleFavoriteAndReload(${p.id}, event)" class="absolute top-2 right-2 bg-white/90 w-8 h-8 rounded-full flex items-center justify-center shadow hover:scale-110 transition text-lg">❤️</button>
        </div>
        <a href="detail.html?id=${p.id}" class="block p-4">
          <span class="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 mb-2">${cat ? cat.icon + ' ' + cat.name : ''}</span>
          <h3 class="font-bold mb-1 line-clamp-1">${p.name}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">${p.description}</p>
          <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
            <span class="text-green-600 font-bold text-sm">${p.price}</span>
            ${r > 0 ? `<span class="text-yellow-500 text-sm">★ ${r}</span>` : ''}
          </div>
        </a>
      </div>
    `;
  }).join('');
}

function toggleFavoriteAndReload(id, e) {
  if (e) e.stopPropagation();
  Favorites.toggle(id);
  showToast('Đã cập nhật yêu thích');
  setTimeout(() => { renderFavorites(); renderCompare(); }, 300);
}

function renderCompare() {
  const sec = document.getElementById('compareSection');
  const tbl = document.getElementById('compareTable');
  if (!sec || !tbl) return;

  const ids = Compare.getAll();
  if (ids.length < 2) { sec.classList.add('hidden'); return; }

  const places = ids.map(id => PLACES.find(p => p.id === id)).filter(Boolean);
  sec.classList.remove('hidden');

  tbl.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Tiêu chí</th>
            ${places.map(p => `<th class="text-left py-3 px-4 font-bold">${p.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <td class="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Danh mục</td>
            ${places.map(p => {
              const c = CATEGORIES.find(x => x.id === p.category);
              return `<td class="py-3 px-4">${c ? c.icon + ' ' + c.name : ''}</td>`;
            }).join('')}
          </tr>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <td class="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Giá</td>
            ${places.map(p => `<td class="py-3 px-4 text-green-600 font-semibold">${p.price}</td>`).join('')}
          </tr>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <td class="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Giờ mở cửa</td>
            ${places.map(p => `<td class="py-3 px-4">${p.hours}</td>`).join('')}
          </tr>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <td class="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Đánh giá</td>
            ${places.map(p => {
              const r = Ratings.get(p.id) || 0;
              return `<td class="py-3 px-4">${r > 0 ? '★'.repeat(r) + '☆'.repeat(5 - r) : 'Chưa có'}</td>`;
            }).join('')}
          </tr>
          <tr>
            <td class="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Địa chỉ</td>
            ${places.map(p => `<td class="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">${p.address}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
    <button onclick="clearCompare()" class="mt-4 text-sm text-red-600 hover:underline">
      <i class="fas fa-trash mr-1"></i>Xóa tất cả so sánh
    </button>
  `;
}

function clearCompare() {
  Compare.clear();
  renderCompare();
  showToast('Đã xóa danh sách so sánh');
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

  renderFavorites();
  renderCompare();
});