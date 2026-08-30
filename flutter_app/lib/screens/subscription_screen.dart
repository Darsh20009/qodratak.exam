import 'package:flutter/material.dart';
import '../core/api.dart';
import '../core/colors.dart';
import '../core/storage.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  Map<String, dynamic>? _status;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final userRaw = await Api.get('/api/user');
      final user = Map<String, dynamic>.from(userRaw as Map);
      final status = await Api.post('/api/subscription/status', data: {
        'deviceId': await AppStorage.getDeviceId(),
        'userId': user['id'] ?? user['_id'],
      });
      if (mounted) setState(() { _status = Map<String, dynamic>.from(status as Map); _loading = false; });
    } catch (error) {
      if (mounted) setState(() { _error = Api.errorMessage(error); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = _status ?? const <String, dynamic>{};
    final active = status['hasActiveSubscription'] == true;
    final trial = status['isTrialActive'] == true;
    final type = status['subscriptionType']?.toString() ?? 'Free';
    final days = (status['daysRemaining'] as num?)?.toInt() ?? 0;
    return Scaffold(
      appBar: AppBar(title: const Text('الباقات والاشتراك')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, textAlign: TextAlign.center)))
              : ListView(
                  padding: const EdgeInsets.fromLTRB(18, 10, 18, 32),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [AppColors.primaryDark, AppColors.primary]),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(trial ? 'فترتك التجريبية' : active ? 'اشتراكك الحالي' : 'الباقة الحالية', style: const TextStyle(color: Colors.white70)),
                          const SizedBox(height: 5),
                          Text(type == 'Free' ? 'الباقة المجانية' : type, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                          if (days > 0) Text('$days يوم متبقٍ', style: const TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text('اختر ما يناسب هدفك', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    const _PlanCard(
                      title: 'مجاني',
                      subtitle: 'ابدأ التدريب وتابع تقدمك',
                      features: ['اختبارات أساسية', 'لوحة الطالب', 'حفظ النتائج'],
                      color: AppColors.primary,
                    ),
                    const SizedBox(height: 12),
                    const _PlanCard(
                      title: 'Pro',
                      subtitle: 'تدريب أعمق واستعداد أفضل',
                      features: ['نماذج أكثر', 'تحليلات متقدمة', 'محتوى مميز'],
                      color: Color(0xFFC97A5B),
                      highlighted: true,
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'سيتم تفعيل الدفع والاشتراك المدفوع بعد ربط حسابات المتاجر وبوابة الدفع المعتمدة.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecond, fontSize: 12, height: 1.5),
                    ),
                  ],
                ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<String> features;
  final Color color;
  final bool highlighted;

  const _PlanCard({
    required this.title,
    required this.subtitle,
    required this.features,
    required this.color,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: highlighted ? color : AppColors.border, width: highlighted ? 1.5 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color))),
              if (highlighted) Chip(backgroundColor: color.withOpacity(.1), label: const Text('الأكثر اختياراً')),
            ],
          ),
          Text(subtitle, style: const TextStyle(color: AppColors.textSecond)),
          const SizedBox(height: 12),
          ...features.map((feature) => Padding(
                padding: const EdgeInsets.only(bottom: 7),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_rounded, size: 18, color: color),
                    const SizedBox(width: 8),
                    Text(feature),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}