import 'package:flutter/material.dart';
import '../core/api.dart';
import '../core/colors.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _loading = true;
  bool _saving = false;
  bool _examReminder = true;
  bool _weeklyReport = true;
  bool _telegramLinked = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final raw = await Api.get('/api/notifications/preferences');
      final data = Map<String, dynamic>.from(raw as Map);
      if (mounted) {
        setState(() {
          _examReminder = data['notifExamReminder'] != false;
          _weeklyReport = data['notifWeeklyReport'] != false;
          _telegramLinked = data['telegramLinked'] == true;
          _loading = false;
        });
      }
    } catch (error) {
      if (mounted) setState(() { _error = Api.errorMessage(error); _loading = false; });
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await Api.patch('/api/notifications/preferences', data: {
        'notifExamReminder': _examReminder,
        'notifWeeklyReport': _weeklyReport,
      });
    } catch (error) {
      if (mounted) setState(() => _error = Api.errorMessage(error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _toggle({required bool examReminder}) async {
    setState(() {
      if (examReminder) {
        _examReminder = !_examReminder;
      } else {
        _weeklyReport = !_weeklyReport;
      }
      _error = null;
    });
    await _save();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإشعارات')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : ListView(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 32),
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: _telegramLinked ? AppColors.primaryLight : AppColors.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _telegramLinked ? AppColors.primary : AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.send_rounded, color: _telegramLinked ? AppColors.primary : AppColors.textSecond),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('تنبيهات تيليجرام', style: TextStyle(fontWeight: FontWeight.w800)),
                            Text(
                              _telegramLinked ? 'حسابك مرتبط وستصلك التنبيهات.' : 'اربط تيليجرام من المنصة لاستقبال التنبيهات.',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecond),
                            ),
                          ],
                        ),
                      ),
                      Icon(_telegramLinked ? Icons.check_circle_rounded : Icons.link_rounded, color: _telegramLinked ? AppColors.primary : AppColors.textSecond),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('تفضيلات التنبيه', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 10),
                _PreferenceTile(
                  icon: Icons.event_available_outlined,
                  title: 'تذكير بالاختبارات',
                  subtitle: 'تذكير قبل موعد الاختبار بساعة',
                  value: _examReminder,
                  onChanged: (_) => _toggle(examReminder: true),
                ),
                _PreferenceTile(
                  icon: Icons.insights_outlined,
                  title: 'التقرير الأسبوعي',
                  subtitle: 'ملخص تقدمك ونتائجك كل أسبوع',
                  value: _weeklyReport,
                  onChanged: (_) => _toggle(examReminder: false),
                ),
                if (_saving) const Padding(
                  padding: EdgeInsets.only(top: 18),
                  child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                ),
                if (_error != null) Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(_error!, style: const TextStyle(color: AppColors.error)),
                ),
              ],
            ),
    );
  }
}

class _PreferenceTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _PreferenceTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
      secondary: Icon(icon, color: AppColors.primary),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      subtitle: Text(subtitle),
      value: value,
      activeColor: AppColors.primary,
      onChanged: onChanged,
    );
  }
}