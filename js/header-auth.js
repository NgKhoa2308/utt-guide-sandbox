// ==========================================
// HEADER AUTH - Cập nhật nút đăng nhập ở header
// ==========================================

async function updateHeaderAuth() {
  const user = await getCurrentUser();
  const authText = document.getElementById('authText');
  const authLink = document.getElementById('authLink');

  if (!authLink) return;

  if (user) {
    const profile = await getCurrentProfile();
    const name = profile?.nickname || user.email.split('@')[0];
    
    authText.textContent = name;
    authLink.href = '#';
    authLink.onclick = async (e) => {
      e.preventDefault();
      if (confirm(`Đăng xuất khỏi "${name}"?`)) {
        await sb.auth.signOut();
        location.reload();
      }
    };
    
    // Hiện nút Admin nếu là admin
    if (profile?.is_admin) {
      showAdminLink();
    }
    
    console.log('✅ User đã đăng nhập:', user.email);
  } else {
    authText.textContent = 'Đăng nhập';
    authLink.href = 'login.html';
    authLink.onclick = null;
    console.log('👤 Chưa đăng nhập');
  }
}

// Thêm nút Admin vào header nếu chưa có
function showAdminLink() {
  if (document.getElementById('adminLink')) return;
  
  const authLink = document.getElementById('authLink');
  if (!authLink) return;
  
  const adminLink = document.createElement('a');
  adminLink.id = 'adminLink';
  adminLink.href = 'admin.html';
  adminLink.className = 'hover:text-yellow-300 transition';
  adminLink.innerHTML = '<i class="fas fa-shield-alt mr-1"></i>Admin';
  
  authLink.parentNode.insertBefore(adminLink, authLink);
}

// Chạy khi trang load
document.addEventListener('DOMContentLoaded', updateHeaderAuth);