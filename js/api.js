// ==========================================
// API - Lấy dữ liệu từ Supabase
// ==========================================

// Lấy tất cả địa điểm đã duyệt (approved)
async function loadPlacesFromSupabase() {
  if (typeof sb === 'undefined' || !sb) {
    console.warn('⚠️ Supabase chưa kết nối, dùng data.js');
    return null;
  }

  try {
    const { data, error } = await sb
      .from('places')
      .select('*')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('view_count', { ascending: false });

    if (error) throw error;

    // Chuyển schema Supabase → schema frontend
    return data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      address: p.address || '',
      price: p.price || 'Liên hệ',
      hours: p.hours || 'Đang cập nhật',
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      description: p.description || '',
      image: p.photo_url || '',
      featured: p.featured || false,
      roomType: p.room_type || '',       
      area: p.area || '',                  
      amenities: p.amenities || '',       
      deposit: p.deposit || '',      
      contact: p.contact || ''
    }));

  } catch (error) {
    console.error('❌ Lỗi load places từ Supabase:', error);
    return null;
  }
}

// Gọi hàm này từ mỗi trang — tự động fallback nếu Supabase lỗi
async function initPlacesFromAPI() {
  const remote = await loadPlacesFromSupabase();
  
  if (remote && remote.length > 0) {
    PLACES = remote;
    console.log(`✅ Đã load ${remote.length} địa điểm từ Supabase`);
    return true;
  } else {
    console.log(`⚠️ Dùng ${PLACES.length} địa điểm từ data.js (fallback)`);
    return false;
  }
}
// ==========================================
// FAVORITES - YÊU THÍCH
// ==========================================

// Lấy danh sách ID địa điểm yêu thích của user
async function getFavoritesFromSupabase() {
  if (!sb) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data, error } = await sb
      .from('favorites')
      .select('location_id')
      .eq('user_id', user.id);

    if (error) throw error;
    return data.map(f => f.location_id);
  } catch (error) {
    console.error('Lỗi lấy favorites:', error);
    return null;
  }
}

// Thêm yêu thích
async function addFavoriteToSupabase(placeId) {
  if (!sb) return false;
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const { error } = await sb
      .from('favorites')
      .insert({ user_id: user.id, location_id: placeId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Lỗi thêm favorite:', error);
    return false;
  }
}

// Xóa yêu thích
async function removeFavoriteFromSupabase(placeId) {
  if (!sb) return false;
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const { error } = await sb
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('location_id', placeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Lỗi xóa favorite:', error);
    return false;
  }
}

// Đồng bộ favorites từ Supabase vào localStorage (để UI dùng)
async function syncFavoritesFromSupabase() {
  const remoteIds = await getFavoritesFromSupabase();
  if (remoteIds === null) return; // Chưa login hoặc lỗi → giữ localStorage
  
  localStorage.setItem('utt_fav', JSON.stringify(remoteIds));
  console.log(`✅ Đã sync ${remoteIds.length} favorites từ Supabase`);
}

// ==========================================
// REVIEWS - ĐÁNH GIÁ
// ==========================================

// Lấy tất cả reviews của 1 địa điểm
async function getReviewsFromSupabase(placeId) {
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('reviews')
      .select('*')
      .eq('location_id', placeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Lỗi lấy reviews:', error);
    return [];
  }
}

// Lấy rating trung bình
async function getAverageRating(placeId) {
  const reviews = await getReviewsFromSupabase(placeId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// Thêm review mới
async function addReviewToSupabase(placeId, rating, content) {
  if (!sb) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data, error } = await sb
      .from('reviews')
      .insert({
        location_id: placeId,
        user_id: user.id,
        rating: rating,
        content: content || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Lỗi thêm review:', error);
    return null;
  }
}

// Xóa review
async function deleteReviewFromSupabase(reviewId) {
  if (!sb) return false;
  try {
    const { error } = await sb
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Lỗi xóa review:', error);
    return false;
  }
}

// Lấy profile của user (để hiển thị tên trong review)
async function getProfileById(userId) {
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// ==========================================
// SUBMIT LOCATION - ĐÓNG GÓP ĐỊA ĐIỂM
// ==========================================

async function submitLocationToSupabase(data) {
  if (!sb) return { error: 'Chưa kết nối Supabase' };
  
  // Kiểm tra đăng nhập
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: 'Vui lòng đăng nhập' };

  console.log('Đang gửi với user:', user.id, user.email);

  try {
    const insertData = {
      name: data.name,
      description: data.description || '',
      address: data.address || '',
      category: data.category,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      photo_url: data.photo_url || '',
      price: data.price || '',
      hours: data.hours || '',
      status: 'pending',
      created_by: user.id
    };

    console.log('Dữ liệu gửi:', insertData);

    const { data: result, error } = await sb
      .from('places')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('✅ Gửi thành công:', result);
    return { data: result, error: null };
    
  } catch (error) {
    console.error('Lỗi gửi địa điểm:', error);
    return { error: error.message };
  }
}

// Lấy danh sách địa điểm user đã đóng góp
async function getMyContributions() {
  if (!sb) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const { data, error } = await sb
      .from('places')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Lỗi lấy contributions:', error);
    return [];
  }
}

// ==========================================
// ADMIN - QUẢN TRỊ ĐỊA ĐIỂM
// ==========================================

// Kiểm tra user có phải admin không
async function isCurrentUserAdmin() {
  const profile = await getCurrentProfile();
  return profile?.is_admin === true;
}

// Lấy danh sách địa điểm chờ duyệt
async function getPendingPlaces() {
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('places')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Lỗi lấy pending:', error);
    return [];
  }
}

// Lấy tất cả địa điểm (mọi status) — cho admin
async function getAllPlacesAdmin() {
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Lỗi lấy tất cả places:', error);
    return [];
  }
}

// Duyệt địa điểm
async function approvePlace(placeId) {
  if (!sb) return false;
  try {
    const { error } = await sb
      .from('places')
      .update({ status: 'approved' })
      .eq('id', placeId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Lỗi duyệt:', error);
    return false;
  }
}

// Từ chối địa điểm
async function rejectPlace(placeId) {
  if (!sb) return false;
  try {
    const { error } = await sb
      .from('places')
      .update({ status: 'rejected' })
      .eq('id', placeId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Lỗi từ chối:', error);
    return false;
  }
}

// Xóa địa điểm
async function deletePlaceAdmin(placeId) {
  if (!sb) return false;
  try {
    const { error } = await sb
      .from('places')
      .delete()
      .eq('id', placeId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Lỗi xóa:', error);
    return false;
  }
}