// ==========================================
// HEADER AUTH - Cập nhật header + mobile menu
// ==========================================

async function updateHeaderAuth() {
  const user = await getCurrentUser();
  
  const authText = document.getElementById('authText');
  const authLink = document.getElementById('authLink');
  const authTextMobile = document.getElementById('authTextMobile');
  const authLinkMobile = document.getElementById('authLinkMobile');

  if (user) {
    const profile = await getCurrentProfile();
    const name = profile?.nickname || user.email.split('@')[0];
    
    // Desktop
    if (authText && authLink) {
      authText.textContent = name;
      authLink.href = '#';
      authLink.onclick = (e) => handleLogoutClick(e, name);
    }
    
    // Mobile
    if (authTextMobile && authLinkMobile) {
      authTextMobile.textContent = name;
      authLinkMobile.href = '#';
      authLinkMobile.onclick = (e) => handleLogoutClick(e, name);
    }
    
    // Nút Admin
    if (profile?.is_admin) {
      showAdminLink();
      showAdminLinkMobile();
    }
    
    console.log('✅ User đã đăng nhập:', user.email);
  } else {
    // Desktop
    if (authText && authLink) {
      authText.textContent = 'Đăng nhập';
      authLink.href = 'login.html';
      authLink.onclick = null;
    }
    
    // Mobile
    if (authTextMobile && authLinkMobile) {
      authTextMobile.textContent = 'Đăng nhập';
      authLinkMobile.href = 'login.html';
      authLinkMobile.onclick = null;
    }
    
    console.log('👤 Chưa đăng nhập');
  }
  
  // Update dark mode buttons
  updateDarkModeButtons();
}

// Xử lý click đăng xuất
function handleLogoutClick(e, name) {
  e.preventDefault();
  if (confirm(`Đăng xuất khỏi "${name}"?`)) {
    sb.auth.signOut().then(() => location.reload());
  }
}

// Nút Admin desktop
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

// Nút Admin mobile
function showAdminLinkMobile() {
  if (document.getElementById('adminLinkMobile')) return;
  const authLinkMobile = document.getElementById('authLinkMobile');
  if (!authLinkMobile) return;
  
  const adminLinkMobile = document.createElement('a');
  adminLinkMobile.id = 'adminLinkMobile';
  adminLinkMobile.href = 'admin.html';
  adminLinkMobile.className = 'block py-1';
  adminLinkMobile.innerHTML = '<i class="fas fa-shield-alt mr-2"></i>Admin';
  authLinkMobile.parentNode.insertBefore(adminLinkMobile, authLinkMobile);
}

// Update nút dark mode cả 2 chỗ
function updateDarkModeButtons() {
  const isDark = DarkMode.isOn();
  
  // Desktop
  const btnDesktop = document.getElementById('darkModeBtn');
  if (btnDesktop) btnDesktop.innerHTML = isDark ? '☀️' : '🌙';
  
  // Mobile
  const btnMobile = document.getElementById('darkModeBtnMobile');
  const textMobile = document.getElementById('darkTextMobile');
  if (btnMobile && textMobile) {
    btnMobile.querySelector('i').className = isDark ? 'fas fa-sun mr-2' : 'fas fa-moon mr-2';
    textMobile.textContent = isDark ? 'Light mode' : 'Dark mode';
  }
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderAuth();
  
  // Nút dark mode mobile
  const btnMobile = document.getElementById('darkModeBtnMobile');
  if (btnMobile) {
    btnMobile.onclick = () => {
      DarkMode.toggle();
      updateDarkModeButtons();
    };
  }
});