export const buildUserTokenPayload = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: 'user',
  nama_lengkap: user.nama_lengkap || user.full_name || user.name || null,
});
