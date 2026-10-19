// ==========================================
// AUTH LOGIC - UTT STUDENT GUIDE
// ==========================================

// Chuyển tab Đăng nhập / Đăng ký
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  if (tab === 'register') {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabRegister.classList.add('tab-active');
    tabRegister.classList.remove('tab-inactive');
    tabLogin.classList.remove('tab-active');
    tabLogin.classList.add('tab-inactive');
  } else {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('tab-active');
    tabLogin.classList.remove('tab-inactive');
    tabRegister.classList.remove('tab-active');
    tabRegister.classList.add('tab-inactive');
  }
}

// Hiện thông báo
function showMessage(message, type = 'error') {
  const colors = {
    error: 'bg-red-100 text-red-700 border-red-300',
    success: 'bg-green-100 text-green-700 border-green-300',
    info: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  const div = document.createElement('div');
  div.className = `fixed top-4 left-1/2 -translate-x-1/2 z-[9999] border px-6 py-3 rounded-lg shadow-lg font-semibold ${colors[type]}`;
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => div.remove(), 3000);
}

// Xử lý đăng nhập
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang đăng nhập...';

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) throw error;

    showMessage('✅ Đăng nhập thành công!', 'success');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);

  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    let msg = error.message;
    if (msg.includes('Invalid login')) msg = 'Email hoặc mật khẩu không đúng';
    if (msg.includes('Email not confirmed')) msg = 'Email chưa xác nhận';
    showMessage('❌ ' + msg, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Đăng nhập';
  }
}

// Xử lý đăng ký
async function handleRegister(e) {
  e.preventDefault();

  const nickname = document.getElementById('registerNickname').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const password2 = document.getElementById('registerPassword2').value;
  const btn = document.getElementById('registerBtn');

  // Kiểm tra mật khẩu khớp
  if (password !== password2) {
    showMessage('❌ Mật khẩu nhập lại không khớp', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('❌ Mật khẩu phải từ 6 ký tự', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tạo tài khoản...';

  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { nickname }
      }
    });

    if (error) throw error;

    showMessage('✅ Đăng ký thành công! Đang chuyển trang...', 'success');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);

  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    let msg = error.message;
    if (msg.includes('already registered')) msg = 'Email này đã được đăng ký';
    if (msg.includes('Password should be')) msg = 'Mật khẩu quá yếu';
    showMessage('❌ ' + msg, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Tạo tài khoản';
  }
}

// Xử lý quên mật khẩu
document.getElementById('forgotPasswordLink')?.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const email = prompt('Nhập email bạn đã đăng ký để nhận link khôi phục mật khẩu:');
  if (!email) return; // Nếu người dùng bấm Cancel

  try {
    // Gọi API của Supabase để gửi email khôi phục
    const { data, error } = await sb.auth.resetPasswordForEmail(email, {
      // Đường dẫn trang sẽ mở ra khi người dùng bấm vào link trong email
      redirectTo: window.location.origin + window.location.pathname.replace('login.html', '') + 'reset-password.html'
    });

    if (error) throw error;

    alert('✅ Đã gửi email khôi phục! Vui lòng kiểm tra hộp thư (cả mục Spam) của bạn.');
  } catch (error) {
    console.error('Lỗi khôi phục mật khẩu:', error);
    alert('❌ Lỗi: ' + error.message);
  }
});

// ==========================================
// KHỞI TẠO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);

  // Nếu đã đăng nhập rồi, hiện nút "Đăng xuất" thay vì ép redirect
  updateAuthUI();
});

// Cập nhật UI nếu đã đăng nhập
async function updateAuthUI() {
  const user = await getCurrentUser();
  if (user) {
    // Hiện thông báo nhỏ: đang đăng nhập với tài khoản X
    const box = document.createElement('div');
    box.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg text-sm';
    box.innerHTML = `
      Đang đăng nhập: <strong>${user.email}</strong>
      <button onclick="handleLogout()" class="ml-3 bg-white text-blue-600 px-3 py-1 rounded-full font-bold hover:bg-blue-50">
        Đăng xuất
      </button>
    `;
    document.body.appendChild(box);
  }
}

// Đăng xuất
async function handleLogout() {
  if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
  await sb.auth.signOut();
  showMessage('✅ Đã đăng xuất', 'success');
  setTimeout(() => window.location.href = 'index.html', 800);
}