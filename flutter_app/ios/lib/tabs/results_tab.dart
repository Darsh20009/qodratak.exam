import 'package:flutter/material.dart';
import '../core/api.dart';
import '../core/colors.dart';

class ResultsTab extends StatefulWidget {
  const ResultsTab({super.key});

  @override
  State<ResultsTab> createState() => _ResultsTabState();
}

class _ResultsTabState extends State<ResultsTab> {
  List<Map<String, dynamic>> _results = const [];
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
      final id = user['id'] ?? user['_id'];
      final raw = await Api.get('/api/mobile/test-results');
      final list = raw is List ? raw : const [];
      if (mounted) {
        setState(() {
          _results = list.map((item) => Map<String, dynamic>.from(item as Map)).toList().reversed.toList();
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
    return Scaffold(
      appBar: AppBar(title: const Text('نتائجي')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null
                ? ListView(
                    children: [
                      const SizedBox(height: 120),
                      _EmptyResults(icon: Icons.cloud_off_outlined, title: _error!, action: _load),
                    ],
                  )
                : _results.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 120),
                          _EmptyResults(
                            icon: Icons.insights_outlined,
                            title: 'لم تسجل أي نتائج بعد\nابدأ أول اختبار لتظهر إحصائياتك هنا.',
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(18, 10, 18, 32),
                        itemCount: _results.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) => _ResultCard(result: _results[index]),
                      ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  final Map<String, dynamic> result;

  const _ResultCard({required this.result});

  @override
  Widget build(BuildContext context) {
    final score = (result['score'] as num?)?.toInt() ?? 0;
    final total = (result['totalQuestions'] as num?)?.toInt() ?? 1;
    final percentage = (score / total * 100).round();
    final type = result['testType'] == 'quantitative' ? 'القدرات الكمي' : 'القدرات اللفظي';
    final color = percentage >= 70 ? AppColors.success : percentage >= 50 ? const Color(0xFFD09B30) : AppColors.error;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 58,
            height: 58,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: percentage / 100,
                  strokeWidth: 6,
                  color: color,
                  backgroundColor: AppColors.border,
                ),
                Center(child: Text('$percentage%', style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w800))),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(type, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('$score إجابات صحيحة من $total', style: const TextStyle(color: AppColors.textSecond, fontSize: 12)),
              ],
            ),
          ),
          Text(
            '+${((result['pointsEarned'] as num?) ?? 0).round()}',
            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? action;

  const _EmptyResults({required this.icon, required this.title, this.action});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          children: [
            Icon(icon, size: 64, color: AppColors.textSecond),
            const SizedBox(height: 14),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecond, height: 1.6)),
            if (action != null) ...[
              const SizedBox(height: 14),
              TextButton.icon(onPressed: action, icon: const Icon(Icons.refresh), label: const Text('إعادة المحاولة')),
            ],
          ],
        ),
      ),
    );
  }
}