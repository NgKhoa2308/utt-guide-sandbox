// ==========================================
// ADMIN PANEL - Quản trị địa điểm
// ==========================================

let allPlaces = [];
let currentTab = 'pending';

// Kiểm tra quyền admin
async function checkAdminAccess() {
  const user = await getCurrentUser();
  
  if (!user) {
    document.getElementById('notAdmin').classList.remove('hidden');
    return false;
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    document.getElementById('notAdmin').classList.remove('hidden');
    return false;
  }

  document.getElementById('adminContent').classList.remove('hidden');
  return true;
}

// Load tất cả địa điểm
async function loadAllPlaces() {
  allPlaces = await getAllPlacesAdmin();
  updateStats();
  renderList();
}

// Cập nhật số liệu
function updateStats() {
  document.getElementById('statTotal').textContent = allPlaces.length;
  document.getElementById('statPending').textContent = allPlaces.filter(p => p.status === 'pending').length;
  document.getElementById('statApproved').textContent = allPlaces.filter(p => p.status === 'approved').length;
  document.getElementById('statRejected').textContent = allPlaces.filter(p => p.status === 'rejected').length;
}

// Đổi tab
function switchAdminTab(tab) {
  currentTab = tab;
  
  document.querySelectorAll('.admin-tab').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('bg-blue-600', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('bg-gray-200', !isActive);
    btn.classList.toggle('text-gray-700', !isActive);
  });

  renderList();
}

// Render danh sách
function renderList() {
  const list = document.getElementById('adminList');
  const empty = document.getElementById('emptyState');
  if (!list) return;

  let filtered = allPlaces;
  if (currentTab !== 'all') {
    filtered = allPlaces.filter(p => p.status === currentTab);
  }

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = filtered.map(p => {
    const catInfo = getCategoryInfo(p.category);
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      approved: 'bg-green-100 text-green-700 border-green-300',
      rejected: 'bg-red-100 text-red-700 border-red-300'
    };
    const statusText = {
      pending: '⏳ Chờ duyệt',
      approved: '✅ Đã duyệt',
      rejected: '❌ Đã từ chối'
    };

    return `
      <div class="bg-white rounded-xl shadow-md p-4 border-l-4 ${statusColors[p.status].split(' ')[2] || 'border-gray-300'}">
        <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                ${catInfo.icon} ${catInfo.name}
              </span>
              <span class="text-xs font-semibold px-2 py-1 rounded-full border ${statusColors[p.status]}">
                ${statusText[p.status]}
              </span>
            </div>
            <h3 class="font-bold text-lg text-gray-800">${p.name}</h3>
            <p class="text-sm text-gray-500 mt-1">📍 ${p.address || 'Chưa có địa chỉ'}</p>
          </div>
          ${p.photo_url ? `
            <img src="${p.photo_url}" alt="${p.name}" 
                 class="w-24 h-24 object-cover rounded-lg"
                 onerror="this.style.display='none'">
          ` : ''}
        </div>

        ${p.description ? `
          <p class="text-sm text-gray-600 mb-3">${p.description}</p>
        ` : ''}

        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
          <div>
            <span class="text-xs text-gray-400">Giá:</span>
            <p class="font-semibold text-green-600">${p.price || 'Chưa rõ'}</p>
          </div>
          <div>
            <span class="text-xs text-gray-400">Giờ:</span>
            <p class="font-semibold">${p.hours || 'Chưa rõ'}</p>
          </div>
          <div>
            <span class="text-xs text-gray-400">Tọa độ:</span>
            <p class="text-xs">${p.lat}, ${p.lng}</p>
          </div>
          <div>
            <span class="text-xs text-gray-400">Gửi lúc:</span>
            <p class="text-xs">${new Date(p.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          ${p.status === 'pending' ? `
            <button onclick="handleApprove(${p.id})" 
                    class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
              <i class="fas fa-check mr-1"></i>Duyệt
            </button>
            <button onclick="handleReject(${p.id})" 
                    class="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600">
              <i class="fas fa-times mr-1"></i>Từ chối
            </button>
          ` : ''}
          ${p.status === 'rejected' ? `
            <button onclick="handleApprove(${p.id})" 
                    class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
              <i class="fas fa-redo mr-1"></i>Duyệt lại
            </button>
          ` : ''}
          <a href="detail.html?id=${p.id}" target="_blank"
             class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
            <i class="fas fa-eye mr-1"></i>Xem
          </a>
          <button onclick="handleDelete(${p.id}, '${p.name.replace(/'/g, "\\'")}')" 
                  class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 ml-auto">
            <i class="fas fa-trash mr-1"></i>Xóa
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Lấy thông tin danh mục
function getCategoryInfo(catId) {
  const map = {
    'an-uong': { name: 'Ăn uống', icon: '🍜' },
    'in-an': { name: 'In ấn', icon: '🖨️' },
    'sua-chua': { name: 'Sửa chữa', icon: '🔧' },
    'nha-thuoc': { name: 'Nhà thuốc', icon: '💊' },
    'cua-hang': { name: 'Cửa hàng', icon: '🛒' },
    'hoc-tap': { name: 'Học tập', icon: '📚' },
    'khac': { name: 'Khác', icon: '🏪' }
  };
  return map[catId] || { name: catId, icon: '📍' };
}

// Xử lý duyệt
async function handleApprove(placeId) {
  if (!confirm('Duyệt địa điểm này?')) return;
  showToast('Đang duyệt...', 'info');
  const ok = await approvePlace(placeId);
  if (ok) {
    showToast('✅ Đã duyệt');
    await loadAllPlaces();
  } else {
    showToast('❌ Không duyệt được', 'error');
  }
}

// Xử lý từ chối
async function handleReject(placeId) {
  if (!confirm('Từ chối địa điểm này?')) return;
  showToast('Đang từ chối...', 'info');
  const ok = await rejectPlace(placeId);
  if (ok) {
    showToast('Đã từ chối');
    await loadAllPlaces();
  } else {
    showToast('❌ Không từ chối được', 'error');
  }
}

// Xử lý xóa
async function handleDelete(placeId, placeName) {
  if (!confirm(`Xóa vĩnh viễn "${placeName}"?\nHành động này không thể hoàn tác!`)) return;
  showToast('Đang xóa...', 'info');
  const ok = await deletePlaceAdmin(placeId);
  if (ok) {
    showToast('🗑️ Đã xóa');
    await loadAllPlaces();
  } else {
    showToast('❌ Không xóa được', 'error');
  }
}

// ==========================================
// KHỞI TẠO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await checkAdminAccess();
  if (isAdmin) {
    await loadAllPlaces();
  }
});