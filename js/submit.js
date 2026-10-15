// ==========================================
// SUBMIT PLACE - Đóng góp địa điểm
// ==========================================

let submitMap = null;
let submitMarker = null;

// Khởi tạo bản đồ chọn vị trí
function initSubmitMap() {
  const el = document.getElementById('miniMap');
  if (!el) return;

  submitMap = L.map('miniMap').setView(UTT_LOCATION, 16);

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri', maxZoom: 19
  }).addTo(submitMap);

  // Marker UTT để tham chiếu
  L.marker(UTT_LOCATION, {
    icon: L.divIcon({
      className: 'utt-ref',
      html: '<div style="background:#1e40af;color:white;padding:4px 8px;border-radius:6px;font-weight:bold;font-size:12px;white-space:nowrap;">🏫 UTT</div>',
      iconSize: [60, 24],
      iconAnchor: [30, 12]
    })
  }).addTo(submitMap);

  // Click vào bản đồ → đặt marker
  submitMap.on('click', (e) => {
    setMarker(e.latlng.lat, e.latlng.lng);
  });
}

// Đặt marker và cập nhật input
function setMarker(lat, lng) {
  if (submitMarker) {
    submitMarker.setLatLng([lat, lng]);
  } else {
    submitMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'place-pin',
        html: '<div style="background:#16a34a;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);"><span style="display:block;transform:rotate(45deg);text-align:center;line-height:28px;color:white;font-size:14px;">📍</span></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
    }).addTo(submitMap);
  }

  document.getElementById('fLat').value = lat.toFixed(7);
  document.getElementById('fLng').value = lng.toFixed(7);
}

// Lấy vị trí hiện tại
function getMyLocation() {
  if (!navigator.geolocation) {
    showToast('Trình duyệt không hỗ trợ định vị', 'error');
    return;
  }

  showToast('Đang lấy vị trí...', 'info');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      submitMap.setView([latitude, longitude], 17);
      setMarker(latitude, longitude);
      showToast('✅ Đã lấy vị trí của bạn');
    },
    (err) => {
      showToast('❌ Không lấy được vị trí', 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Kiểm tra đăng nhập và hiện form
async function checkAuthAndShowForm() {
  const user = await getCurrentUser();

  if (!user) {
    document.getElementById('authWarning').classList.remove('hidden');
    return;
  }

  document.getElementById('submitForm').classList.remove('hidden');
  initSubmitMap();
}

// Xử lý submit form
async function handleSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('submitBtn');
  const lat = document.getElementById('fLat').value;
  const lng = document.getElementById('fLng').value;

  if (!lat || !lng) {
    showToast('Vui lòng chọn vị trí trên bản đồ', 'error');
    return;
  }

  const data = {
    name: document.getElementById('fName').value.trim(),
    category: document.getElementById('fCategory').value,
    address: document.getElementById('fAddress').value.trim(),
    price: document.getElementById('fPrice').value.trim(),
    hours: document.getElementById('fHours').value.trim(),
    photo_url: document.getElementById('fPhoto').value.trim(),
    description: document.getElementById('fDescription').value.trim(),
    lat: lat,
    lng: lng
  };

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang gửi...';

  const result = await submitLocationToSupabase(data);

  if (result.error) {
    showToast('❌ ' + result.error, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Gửi địa điểm';
    return;
  }

  showToast('✅ Đã gửi! Đang chờ Admin duyệt.', 'success');
  
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
}

// Đếm ký tự mô tả
function initCharCounter() {
  const desc = document.getElementById('fDescription');
  const counter = document.getElementById('descCount');
  if (desc && counter) {
    desc.addEventListener('input', () => {
      counter.textContent = desc.value.length;
    });
  }
}

// ==========================================
// KHỞI TẠO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuthAndShowForm();
  initCharCounter();
  document.getElementById('submitForm').addEventListener('submit', handleSubmit);
});