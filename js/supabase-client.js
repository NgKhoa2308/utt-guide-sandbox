// ==========================================
// SUPABASE CLIENT - UTT STUDENT GUIDE
// ==========================================
const SUPABASE_URL = 'https://bqpfyrxcxxihxficvotj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGZ5cnhjeHhpaHhmaWN2b3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDMzMzAsImV4cCI6MjEwNzYxOTMzMH0.lB3H7z5WlHgeQD3EOWaPn63r-hcJRUzZZ57cytBQJJg';
// ⚠️ Đổi tên thành sb để không xung đột với window.supabase
let sb = null;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase đã kết nối:', SUPABASE_URL);
} else {
  console.error('❌ Chưa load thư viện Supabase. Kiểm tra lại index.html');
}

// ==========================================
// HÀM TIỆN ÍCH
// ==========================================

async function getCurrentUser() {
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  
  if (error) {
    console.error('Lỗi lấy profile:', error);
    return null;
  }
  return data;
}