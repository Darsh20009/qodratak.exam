import 'package:flutter/material.dart';
import '../core/api.dart';
import '../core/colors.dart';
import '../core/storage.dart';
import '../screens/devices_screen.dart';
import '../screens/notification_settings_screen.dart';
import '../screens/subscription_screen.dart';

class ProfileTab extends StatefulWidget {
  final Future<void> Function() onLogout;

  const ProfileTab({required this.onLogout, super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  Map<String, dynamic>? _user;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final raw = await Api.get('/api/user');
      if (mounted) {
        setState(() {
          _user = Map<String, dynamic>.from(raw as Map);
          _loading = false;
        });
      }
    } catch (_) {
      final name = await AppStorage.getName();
      final phone = await AppStorage.getPhone();
      final username = await AppStorage.getUsername();
      if (mounted) {
        setState(() {
          _user = {'name': name, 'phone': phone, 'username': username};
          _loading = false;
        });
      }
    }
  }

  Future<void> _confirmLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل تريد تسجيل الخروج من حسابك على هذا الجهاز؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, minimumSize: const Size(100, 42)),
            child: const Text('تسجيل الخروج'),
          ),
        ],
      ),
    );
    if (confirmed == true) await widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    final name = (_user?['name'] ?? _user?['fullName'] ?? _user?['username'] ?? 'طالب قدراتك').toString();
    final phone = (_user?['phone'] ?? '').toString();
    final username = (_user?['username'] ?? '').toString();
    final subscription = _user?['subscription'];
    final plan = subscription is Map ? (subscription['type'] ?? 'free').toString() : 'free';

    return Scaffold(
      appBar: AppBar(title: const Text('حسابي')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : ListView(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 32),
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: AppColors.primaryLight,
                        child: Text(
                          name.isNotEmpty ? name.substring(0, 1) : 'ط',
                          style: const TextStyle(fontSize: 24, color: AppColors.primaryDark, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                            if (username.isNotEmpty) Text('@$username', style: const TextStyle(color: AppColors.textSecond)),
                            if (phone.isNotEmpty) Text(phone, textDirection: TextDirection.ltr, style: const TextStyle(color: AppColors.textSecond)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 34),
                      const SizedBox(width: 13),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('باقتك الحالية', style: TextStyle(color: Colors.white70)),
                            Text(
                              plan == 'free' ? 'الباقة المجانية' : plan,
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_left_rounded, color: Colors.white),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                _MenuTile(
                  icon: Icons.notifications_outlined,
                  title: 'الإشعارات',
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationSettingsScreen())),
                ),
                _MenuTile(
                  icon: Icons.devices_outlined,
                  title: 'إدارة الأجهزة',
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DevicesScreen())),
                ),
                _MenuTile(
                  icon: Icons.workspace_premium_outlined,
                  title: 'الباقات والاشتراك',
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionScreen())),
                ),
                _MenuTile(icon: Icons.lock_outline_rounded, title: 'الخصوصية والأمان', onTap: () => _notReady(context)),
                _MenuTile(icon: Icons.help_outline_rounded, title: 'الدعم والمساعدة', onTap: () => _notReady(context)),
                _MenuTile(
                  icon: Icons.info_outline_rounded,
                  title: 'عن التطبيق',
                  onTap: () => showAboutDialog(
                    context: context,
                    applicationName: 'قدراتك',
                    applicationVersion: '1.0.0',
                    applicationLegalese: '© 2026 Qirox Studio',
                  ),
                ),
                const SizedBox(height: 12),
                _MenuTile(
                  icon: Icons.logout_rounded,
                  title: 'تسجيل الخروج',
                  color: AppColors.error,
                  onTap: _confirmLogout,
                ),
              ],
            ),
    );
  }

  void _notReady(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('هذه الصفحة ستتوفر في التحديث القادم.')),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.color = AppColors.text,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: ListTile(
        tileColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.border),
        ),
        leading: Icon(icon, color: color),
        title: Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
        trailing: Icon(Icons.chevron_left_rounded, color: color.withOpacity(.45)),
        onTap: onTap,
      ),
    );
  }
}