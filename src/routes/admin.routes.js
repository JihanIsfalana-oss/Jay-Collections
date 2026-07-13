import express from 'express';
import { adminLogin, verifyAdminMfa, adminLogout } from '../controllers/admin.auth.controller.js';
import { verifyAdminToken } from '../middleware/admin.middleware.js';
import { requirePermission, requireRole } from '../middleware/admin.role.middleware.js';

// Dashboard
import { getDashboardStats, getRevenueChart, getRecentActivities } from '../controllers/admin/dashboard.controller.js';

// Users
import { getAllUsers, getUserDetail, banUser, unbanUser, getUserOrders } from '../controllers/admin/users.controller.js';

// Orders
import { getAllOrders, getOrderDetail, updateOrderStatus, assignOrder, addInternalNote, getEngineers } from '../controllers/admin/orders.controller.js';

// Admins
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin, getAdminRoles, createAdminRole, getAdminAuditLogs } from '../controllers/admin/admins.controller.js';

// Designs
import { getCategories, createCategory, updateCategory, deleteCategory, getDesigns, createDesign, updateDesign, deleteDesign } from '../controllers/admin/designs.controller.js';

// Notifications
import { getNotifications, createNotification, updateNotification, deleteNotification } from '../controllers/admin/notifications.controller.js';

// Vouchers
import { getVouchers, createVoucher, revokeVoucher, getVoucherStats } from '../controllers/admin/vouchers.controller.js';

// Audit
import { getAuditLogs, getAuditDetail } from '../controllers/admin/audit.controller.js';

// IP Whitelist
import { getAllowedIps, addAllowedIp, deleteAllowedIp } from '../controllers/admin/ip.controller.js';

const router = express.Router();

// ================================================================
// RUTE PUBLIK (tanpa token)
// ================================================================
router.post('/login', adminLogin);
router.post('/mfa/verify', verifyAdminMfa);

// ================================================================
// DASHBOARD — requirePermission('can_view_revenue') atau super_admin
// ================================================================
router.get('/dashboard/stats', verifyAdminToken, requirePermission('can_view_revenue'), getDashboardStats);
router.get('/dashboard/revenue', verifyAdminToken, requirePermission('can_view_revenue'), getRevenueChart);
router.get('/dashboard/activities', verifyAdminToken, requirePermission('can_view_audit_logs'), getRecentActivities);

// ================================================================
// USERS — requirePermission('can_manage_users')
// ================================================================
router.get('/users', verifyAdminToken, requirePermission('can_manage_users'), getAllUsers);
router.get('/users/:id', verifyAdminToken, requirePermission('can_manage_users'), getUserDetail);
router.put('/users/:id/ban', verifyAdminToken, requirePermission('can_ban_users'), banUser);
router.put('/users/:id/unban', verifyAdminToken, requirePermission('can_ban_users'), unbanUser);
router.get('/users/:id/orders', verifyAdminToken, requirePermission('can_manage_users'), getUserOrders);

// ================================================================
// ORDERS — requirePermission('can_assign_orders')
// ================================================================
router.get('/orders', verifyAdminToken, requirePermission('can_assign_orders'), getAllOrders);
router.get('/orders/engineers', verifyAdminToken, requirePermission('can_assign_orders'), getEngineers);
router.get('/orders/:id', verifyAdminToken, requirePermission('can_assign_orders'), getOrderDetail);
router.put('/orders/:id/status', verifyAdminToken, requirePermission('can_assign_orders'), updateOrderStatus);
router.post('/orders/:id/assign', verifyAdminToken, requirePermission('can_assign_orders'), assignOrder);
router.post('/orders/:id/notes', verifyAdminToken, requirePermission('can_assign_orders'), addInternalNote);

// ================================================================
// ADMINS — requirePermission('can_manage_admins')
// ================================================================
router.get('/admins', verifyAdminToken, requirePermission('can_manage_admins'), getAllAdmins);
router.post('/admins', verifyAdminToken, requirePermission('can_manage_admins'), createAdmin);
router.put('/admins/:id', verifyAdminToken, requirePermission('can_manage_admins'), updateAdmin);
router.delete('/admins/:id', verifyAdminToken, requirePermission('can_manage_admins'), deleteAdmin);
router.get('/admins/roles', verifyAdminToken, requirePermission('can_manage_admins'), getAdminRoles);
router.post('/admins/roles', verifyAdminToken, requirePermission('can_manage_admins'), createAdminRole);
router.get('/admins/:id/logs', verifyAdminToken, requirePermission('can_view_audit_logs'), getAdminAuditLogs);

// ================================================================
// DESIGN CATALOG — requirePermission('can_manage_designs')
// ================================================================
router.get('/designs/categories', verifyAdminToken, requirePermission('can_manage_designs'), getCategories);
router.post('/designs/categories', verifyAdminToken, requirePermission('can_manage_designs'), createCategory);
router.put('/designs/categories/:id', verifyAdminToken, requirePermission('can_manage_designs'), updateCategory);
router.delete('/designs/categories/:id', verifyAdminToken, requirePermission('can_manage_designs'), deleteCategory);
router.get('/designs/references', verifyAdminToken, requirePermission('can_manage_designs'), getDesigns);
router.post('/designs/references', verifyAdminToken, requirePermission('can_manage_designs'), createDesign);
router.put('/designs/references/:id', verifyAdminToken, requirePermission('can_manage_designs'), updateDesign);
router.delete('/designs/references/:id', verifyAdminToken, requirePermission('can_manage_designs'), deleteDesign);

// ================================================================
// NOTIFICATIONS — requirePermission('can_send_notifications')
// ================================================================
router.get('/notifications', verifyAdminToken, requirePermission('can_send_notifications'), getNotifications);
router.post('/notifications', verifyAdminToken, requirePermission('can_send_notifications'), createNotification);
router.put('/notifications/:id', verifyAdminToken, requirePermission('can_send_notifications'), updateNotification);
router.delete('/notifications/:id', verifyAdminToken, requirePermission('can_send_notifications'), deleteNotification);

// ================================================================
// VOUCHERS — requirePermission('can_manage_vouchers')
// ================================================================
router.get('/vouchers', verifyAdminToken, requirePermission('can_manage_vouchers'), getVouchers);
router.post('/vouchers', verifyAdminToken, requirePermission('can_manage_vouchers'), createVoucher);
router.put('/vouchers/:id/revoke', verifyAdminToken, requirePermission('can_manage_vouchers'), revokeVoucher);
router.get('/vouchers/stats', verifyAdminToken, requirePermission('can_manage_vouchers'), getVoucherStats);

// ================================================================
// AUDIT LOGS — requirePermission('can_view_audit_logs')
// ================================================================
router.get('/audit-logs', verifyAdminToken, requirePermission('can_view_audit_logs'), getAuditLogs);
router.get('/audit-logs/:id', verifyAdminToken, requirePermission('can_view_audit_logs'), getAuditDetail);

// ================================================================
// IP WHITELIST — requirePermission('can_manage_admins')
// ================================================================
router.get('/ip-whitelist', verifyAdminToken, requirePermission('can_manage_admins'), getAllowedIps);
router.post('/ip-whitelist', verifyAdminToken, requirePermission('can_manage_admins'), addAllowedIp);
router.delete('/ip-whitelist/:id', verifyAdminToken, requirePermission('can_manage_admins'), deleteAllowedIp);

// ================================================================
// LOGOUT — endpoint umum untuk semua admin yang sudah login
// ================================================================
router.post('/logout', verifyAdminToken, adminLogout);

export default router;
