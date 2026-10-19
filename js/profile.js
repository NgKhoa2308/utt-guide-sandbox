function renderStats() {
  const s = UserStats.get();
  const total = PLACES.length;
  const percent = Math.round((s.viewed / total) * 100);

  document.getElementById('statViewed').textContent = s.viewed;
  document.getElementById('statFav').textContent = s.favorites;
  document.getElementById('statVisited').textContent = s.visited;
  document.getElementById('statWish').textContent = s.wishlist;
  document.getElementById('statNotes').textContent = s.notes;
  document.getElementById('statRatings').textContent = s.ratings;

  document.getElementById('progressCount').textContent = s.viewed;
  document.getElementById('progressTotal').textContent = total;
  document.getElementById('progressPercent').textContent = percent + '%';
  document.getElementById('progressBar').style.width = percent + '%';

  const msg = document.getElementById('progressMsg');
  if (percent === 100) msg.textContent = '🎉 Chúc mừng! Bạn đã khám phá hết tất cả địa điểm!';
  else if (percent >= 50) msg.textContent = `Bạn đã khám phá hơn nửa rồi! Còn ${total - s.viewed} địa điểm nữa.`;
  else if (percent > 0) msg.textContent = `Bạn đã bắt đầu khám phá. Còn ${total - s.viewed} địa điểm đang chờ!`;
  else msg.textContent = 'Hãy bắt đầu khám phá các địa điểm quanh UTT nhé!';
}

function miniCard(place) {
  const cat = CATEGORIES.find(c => c.id === place.category);
  const img = getPlaceImage(place);
  return `
    <a href="detail.html?id=${place.id}" class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden hover:shadow-lg transition card-hover block">
      <div class="h-28 relative overflow-hidden bg-gray-200 dark:bg-gray-700">
        <img src="${img}" alt="${place.name}" loading="lazy" class="w-full h-full object-cover">
      </div>
      <div class="p-3">
        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${cat ? cat.icon + ' ' + cat.name : ''}</span>
        <h3 class="font-bold mt-1 line-clamp-1 text-sm">${place.name}</h3>
        <p class="text-xs text-gray-400 truncate">${place.address}</p>
      </div>
    </a>
  `;
}

function renderViewed() {
  const ids = History.getAll();
  if (ids.length === 0) return;
  const places = ids.map(id => PLACES.find(p => p.id === id)).filter(Boolean);
  document.getElementById('viewedSection').classList.remove('hidden');
  document.getElementById('viewedList').innerHTML = places.map(p => miniCard(p)).join('');
}

function renderVisited() {
  const ids = Visited.getAll();
  if (ids.length === 0) return;
  const places = ids.map(id => PLACES.find(p => p.id === id)).filter(Boolean);
  document.getElementById('visitedSection').classList.remove('hidden');
  document.getElementById('visitedList').innerHTML = places.map(p => miniCard(p)).join('');
}

function renderWishlist() {
  const ids = Wishlist.getAll();
  if (ids.length === 0) return;
  const places = ids.map(id => PLACES.find(p => p.id === id)).filter(Boolean);
  document.getElementById('wishlistSection').classList.remove('hidden');
  document.getElementById('wishlistList').innerHTML = places.map(p => miniCard(p)).join('');
}

function renderNotes() {
  const all = Notes.getAll();
  const entries = Object.entries(all).filter(([_, note]) => note);
  if (entries.length === 0) return;
  document.getElementById('notesSection').classList.remove('hidden');
  document.getElementById('notesList').innerHTML = entries.map(([id, note]) => {
    const p = PLACES.find(x => x.id === parseInt(id));
    if (!p) return '';
    return `
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-lg p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <a href="detail.html?id=${p.id}" class="font-bold text-blue-600 hover:underline">${p.name}</a>
            <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">${note}</p>
          </div>
          <button onclick="deleteNoteAndReload(${p.id})" class="text-red-500 hover:text-red-700 text-sm">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function deleteNoteAndReload(id) {
  if (!confirm('Xóa ghi chú này?')) return;
  Notes.set(id, '');
  showToast('Đã xóa ghi chú');
  setTimeout(() => location.reload(), 500);
}

function resetAll() {
  if (!confirm('Bạn chắc chắn muốn xóa TẤT CẢ dữ liệu cá nhân? Không thể khôi phục!')) return;
  if (!confirm('Xác nhận lần 2: Xóa toàn bộ yêu thích, ghi chú, lịch sử?')) return;
  ['utt_fav', 'utt_ratings', 'utt_history', 'utt_views', 'utt_compare', 'utt_notes', 'utt_visited', 'utt_wishlist'].forEach(k => localStorage.removeItem(k));
  showToast('Đã xóa tất cả dữ liệu');
  setTimeout(() => location.reload(), 800);
}

document.addEventListener('DOMContentLoaded',async  () => {
  if (typeof initPlacesFromAPI === 'function') {
    await initPlacesFromAPI();
  }
  if (typeof syncFavoritesFromSupabase === 'function') {
    await syncFavoritesFromSupabase();
  }
  DarkMode.init();
  Favorites.updateBadge();

  const b = document.getElementById('darkModeBtn');
  if (b) {
    const u = () => b.innerHTML = DarkMode.isOn() ? '☀️' : '🌙';
    u();
    b.onclick = () => { DarkMode.toggle(); u(); };
  }

  renderStats();
  renderViewed();
  renderVisited();
  renderWishlist();
  renderNotes();
});