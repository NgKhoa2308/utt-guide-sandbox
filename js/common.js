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

async function toggleFavorite(id, e) {
  if (e) e.stopPropagation();
  
  // Bước 1: Cập nhật localStorage ngay (UI phản hồi tức thì)
  const isFav = Favorites.toggle(id);
  
  // Bước 2: Cập nhật icon
  document.querySelectorAll(`[data-fav-id="${id}"]`).forEach(el => {
    el.innerHTML = isFav ? '❤️' : '🤍';
    el.classList.add('scale-125');
    setTimeout(() => el.classList.remove('scale-125'), 300);
  });
  
  // Bước 3: Nếu đã đăng nhập → sync lên Supabase
  const user = await getCurrentUser();
  if (user) {
    try {
      if (isFav) {
        await addFavoriteToSupabase(id);
        showToast('❤️ Đã thêm yêu thích (đã sync)');
      } else {
        await removeFavoriteFromSupabase(id);
        showToast('Đã xóa yêu thích');
      }
    } catch (error) {
      console.error('Lỗi sync favorite:', error);
      showToast('⚠️ Không sync được, nhưng đã lưu máy', 'error');
    }
  } else {
    // Chưa login → chỉ dùng localStorage
    showToast(isFav ? '❤️ Đã thêm yêu thích (chưa đăng nhập)' : 'Đã xóa yêu thích');
  }
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

// ===== LẤY ẢNH ĐỊA ĐIỂM =====
function getPlaceImage(place) {
  // Hỗ trợ cả id và object
  if (typeof place === 'number') {
    place = PLACES.find(p => p.id === place);
    if (!place) return getFallbackImage('khac');
  }

  // Nếu địa điểm có ảnh riêng → dùng
  if (place.image && place.image.trim()) return place.image;

  // Fallback theo danh mục
  return getFallbackImage(place.category);
}

function getFallbackImage(category) {
  const fallbacks = {
    'an-uong':  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop',
    'in-an':    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&h=400&fit=crop',
    'sua-chua': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    'nha-thuoc':'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=400&fit=crop',
    'cua-hang': 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop',
    'hoc-tap':  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop',
    'khac':     'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop'
  };
  return fallbacks[category] || fallbacks['khac'];
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
  const isVisited = Visited.has(place.id);
  const r = Ratings.get(place.id);
  const v = Views.get(place.id);
  const img = getPlaceImage(place);

  return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden card-hover relative">
      <div class="h-40 relative overflow-hidden bg-gray-200 dark:bg-gray-700">
        <img src="${img}" alt="${place.name}" loading="lazy"
             class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div style="display:none;background:linear-gradient(135deg,#3b82f6,#8b5cf6);" class="w-full h-full items-center justify-center">
          <i class="fas fa-store text-5xl text-white/40"></i>
        </div>
        ${place.featured ? '<div class="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full shadow">⭐ Nổi bật</div>' : ''}
        ${isVisited ? '<div class="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">✅ Đã đến</div>' : ''}
        <button data-fav-id="${place.id}" onclick="toggleFavorite(${place.id}, event)" 
                class="absolute top-2 right-2 bg-white/90 backdrop-blur w-9 h-9 rounded-full flex items-center justify-center shadow hover:scale-110 transition text-lg">
          ${isFav ? '❤️' : '🤍'}
        </button>
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

// ===== MODULE MỚI: GHI CHÚ =====
const Notes = {
  KEY: 'utt_notes',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch { return {}; } },
  get(id) { return this.getAll()[id] || ''; },
  set(id, text) {
    const a = this.getAll();
    if (text.trim()) a[id] = text.trim();
    else delete a[id];
    localStorage.setItem(this.KEY, JSON.stringify(a));
  }
};

// ===== MODULE MỚI: ĐÃ ĐẾN =====
const Visited = {
  KEY: 'utt_visited',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  has(id) { return this.getAll().includes(id); },
  toggle(id) {
    const a = this.getAll(); const i = a.indexOf(id);
    if (i > -1) a.splice(i, 1); else a.push(id);
    localStorage.setItem(this.KEY, JSON.stringify(a));
    return i === -1;
  }
};

// ===== MODULE MỚI: MUỐN ĐẾN =====
const Wishlist = {
  KEY: 'utt_wishlist',
  getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  has(id) { return this.getAll().includes(id); },
  toggle(id) {
    const a = this.getAll(); const i = a.indexOf(id);
    if (i > -1) a.splice(i, 1); else a.push(id);
    localStorage.setItem(this.KEY, JSON.stringify(a));
    return i === -1;
  }
};

// ===== MODULE MỚI: THỐNG KÊ CÁ NHÂN =====
const UserStats = {
  get() {
    return {
      viewed: Object.keys(Views.getAll()).length,
      favorites: Favorites.getAll().length,
      visited: Visited.getAll().length,
      wishlist: Wishlist.getAll().length,
      notes: Object.keys(Notes.getAll()).length,
      ratings: Object.keys(Ratings.getAll()).length
    };
  }
};

// ===== CHỨC NĂNG 4: ĐỊNH VỊ =====
function findNearMe() {
  if (!navigator.geolocation) {
    showToast('Trình duyệt không hỗ trợ định vị', 'error');
    return;
  }
  showToast('Đang lấy vị trí...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      // Tính khoảng cách đến từng địa điểm
      const sorted = PLACES.map(p => ({
        ...p,
        dist: getDistance(lat, lng, p.lat, p.lng)
      })).sort((a, b) => a.dist - b.dist);

      const nearest = sorted[0];
      const distText = nearest.dist < 1000 ? `${nearest.dist}m` : `${(nearest.dist/1000).toFixed(1)}km`;

      // Lưu vào sessionStorage để hiển thị tạm
      sessionStorage.setItem('nearMeId', nearest.id);
      sessionStorage.setItem('nearMeDist', distText);

      showToast(`Gần bạn nhất: ${nearest.name} (${distText})`, 'success');
      setTimeout(() => { location.href = `detail.html?id=${nearest.id}`; }, 1200);
    },
    (err) => {
      let msg = 'Không lấy được vị trí';
      if (err.code === 1) msg = 'Bạn cần cho phép truy cập vị trí';
      else if (err.code === 2) msg = 'Không xác định được vị trí';
      else if (err.code === 3) msg = 'Quá thời gian lấy vị trí';
      showToast(msg, 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ===== CHỨC NĂNG 5: RANDOM ĐỊA ĐIỂM =====
function randomPlace(categoryFilter = null) {
  let pool = PLACES;
  if (categoryFilter) pool = PLACES.filter(p => p.category === categoryFilter);
  if (pool.length === 0) { showToast('Không có địa điểm nào', 'error'); return; }

  const picked = pool[Math.floor(Math.random() * pool.length)];
  showToast(`🎲 Hôm nay ăn gì? → ${picked.name}`, 'success');
  setTimeout(() => { location.href = `detail.html?id=${picked.id}`; }, 1200);
}

// ===== COPY ĐỊA CHỈ =====
async function copyAddress(addr, e) {
  if (e) e.stopPropagation();
  try {
    await navigator.clipboard.writeText(addr);
    showToast('📋 Đã copy địa chỉ');
  } catch {
    prompt('Copy địa chỉ:', addr);
  }
}

// ===== GHI CHÚ =====
function saveNote(id, text) {
  Notes.set(id, text);
  showToast('💾 Đã lưu ghi chú');
}

function deleteNote(id, e) {
  if (e) e.stopPropagation();
  if (!confirm('Xóa ghi chú này?')) return;
  Notes.set(id, '');
  showToast('Đã xóa ghi chú');
  if (typeof renderDetail === 'function') renderDetail();
}

// ===== ĐÃ ĐẾN =====
function toggleVisited(id, e) {
  if (e) e.stopPropagation();
  const isV = Visited.toggle(id);
  showToast(isV ? '✅ Đã đánh dấu đã đến' : 'Đã bỏ đánh dấu');
  document.querySelectorAll(`[data-visited-id="${id}"]`).forEach(el => {
    el.innerHTML = isV ? '✅ Đã đến' : '📍 Đánh dấu đã đến';
    el.classList.toggle('bg-green-600', isV);
    el.classList.toggle('text-white', isV);
  });
}

// ===== MUỐN ĐẾN =====
function toggleWishlist(id, e) {
  if (e) e.stopPropagation();
  const isW = Wishlist.toggle(id);
  showToast(isW ? '⭐ Đã thêm vào muốn đến' : 'Đã xóa khỏi muốn đến');
  document.querySelectorAll(`[data-wishlist-id="${id}"]`).forEach(el => {
    el.innerHTML = isW ? '⭐ Muốn đến' : '☆ Muốn đến';
    el.classList.toggle('bg-yellow-500', isW);
    el.classList.toggle('text-white', isW);
  });
}

// Random theo danh mục cụ thể
function randomByCategory(catId) {
  const pool = PLACES.filter(p => p.category === catId);
  if (pool.length === 0) {
    showToast('Danh mục này chưa có địa điểm nào', 'error');
    return;
  }
  const picked = pool[Math.floor(Math.random() * pool.length)];
  showToast(`🎲 ${picked.name}`, 'success');
  setTimeout(() => { location.href = `detail.html?id=${picked.id}`; }, 1000);
}

// Random tất cả (nếu cần dùng riêng)
function randomAnyPlace() {
  const picked = PLACES[Math.floor(Math.random() * PLACES.length)];
  showToast(`🎲 ${picked.name}`, 'success');
  setTimeout(() => { location.href = `detail.html?id=${picked.id}`; }, 1000);
}