import 'package:flutter/material.dart';
import '../core/api.dart';
import '../core/colors.dart';
import '../core/storage.dart';

class HomeTab extends StatefulWidget {
  final VoidCallback onOpenExams;

  const HomeTab({required this.onOpenExams, super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  Map<String, dynamic>? _user;
  List<dynamic> _results = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final userRaw = await Api.get('/api/user');
      final user = Map<String, dynamic>.from(userRaw as Map);
      List<dynamic> results = const [];
      final id = user['id'] ?? user['_id'];
      if (id != null) {
        try {
          final raw = await Api.get('/api/mobile/test-results');
          if (raw is List) results = raw;
        } catch (_) {}
      }
      await AppStorage.saveSession(
        phone: user['phone']?.toString() ?? '',
        name: user['name']?.toString() ?? user['fullName']?.toString(),
        username: user['username']?.toString(),
        userId: id,
      );
      if (mounted) {
        setState(() {
          _user = user;
          _results = results;
          _loading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = Api.errorMessage(error);
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = (_user?['name'] ?? _user?['fullName'] ?? _user?['username'] ?? 'طالب قدراتك').toString();
    final points = (_user?['points'] as num?)?.toInt() ?? 0;
    final level = (_user?['level'] as num?)?.toInt() ?? 1;
    final average = _results.isEmpty
        ? 0
        : (_results.fold<double>(
                  0,
                  (sum, item) {
                    final result = item as Map;
                    final score = (result['score'] as num?)?.toDouble() ?? 0;
                    final total = (result['totalQuestions'] as num?)?.toDouble() ?? 1;
                    return sum + (score / total * 100);
                  },
                ) /
                _results.length)
            .round();

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 32),
            children: [
              Row(
                children: [
                  Image.asset('assets/images/qodratak-logo.png', width: 42, height: 42),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('قدراتك', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                        Text('منصة التميز والإنجاز', style: TextStyle(fontSize: 11, color: AppColors.textSecond)),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _load,
                    icon: const Icon(Icons.notifications_none_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              if (_loading)
                const Center(child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: AppColors.primary),
                ))
              else if (_error != null)
                _ErrorCard(message: _error!, onRetry: _load)
              else ...[
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primaryDark, AppColors.primary],
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                    ),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('مرحباً بك 👋', style: TextStyle(color: Colors.white70)),
                      const SizedBox(height: 4),
                      Text(
                        name,
                        style: const TextStyle(color: Colors.white, fontSize: 23, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 18),
                      ElevatedButton.icon(
                        onPressed: widget.onOpenExams,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppColors.primaryDark,
                          minimumSize: const Size(0, 46),
                        ),
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text('ابدأ اختباراً الآن'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(child: _MetricCard(label: 'النقاط', value: '$points', icon: Icons.stars_rounded)),
                    const SizedBox(width: 10),
                    Expanded(child: _MetricCard(label: 'المستوى', value: '$level', icon: Icons.workspace_premium_outlined)),
                    const SizedBox(width: 10),
                    Expanded(child: _MetricCard(label: 'المتوسط', value: '$average%', icon: Icons.trending_up_rounded)),
                  ],
                ),
                const SizedBox(height: 26),
                const Text('مساراتك التعليمية', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                _TrackCard(
                  title: 'القدرات العامة',
                  subtitle: 'اختبارات لفظية وكمية مع شرح الإجابات',
                  icon: Icons.psychology_alt_outlined,
                  color: AppColors.primary,
                  onTap: widget.onOpenExams,
                ),
                const SizedBox(height: 10),
                _TrackCard(
                  title: 'التحصيلي',
                  subtitle: 'تدريب منظم لمواد الاختبار التحصيلي',
                  icon: Icons.science_outlined,
                  color: const Color(0xFFC97A5B),
                  onTap: widget.onOpenExams,
                ),
                const SizedBox(height: 10),
                _TrackCard(
                  title: 'GAT و IELTS',
                  subtitle: 'مسارات اللغة والاختبارات الدولية',
                  icon: Icons.language_rounded,
                  color: const Color(0xFF6457A6),
                  onTap: widget.onOpenExams,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _MetricCard({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primary, size: 22),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecond)),
        ],
      ),
    );
  }
}

class _TrackCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _TrackCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: color.withOpacity(.1), borderRadius: BorderRadius.circular(14)),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecond)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left_rounded, color: AppColors.textSecond),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorCard({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          const Icon(Icons.cloud_off_outlined, size: 42, color: AppColors.textSecond),
          const SizedBox(height: 10),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          TextButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('إعادة المحاولة')),
        ],
      ),
    );
  }
}