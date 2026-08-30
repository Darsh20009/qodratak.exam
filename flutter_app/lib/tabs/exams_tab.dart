import 'package:flutter/material.dart';
import '../core/colors.dart';
import '../screens/exam_screen.dart';

class ExamsTab extends StatelessWidget {
  const ExamsTab({super.key});

  void _openExam(BuildContext context, String category, String title) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ExamScreen(category: category, title: title)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الاختبارات')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Row(
              children: [
                Icon(Icons.tips_and_updates_outlined, color: AppColors.primary, size: 30),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'اختر القسم وابدأ اختباراً من 20 سؤالاً. ستظهر نتيجتك وتفاصيل تقدمك عند الإرسال.',
                    style: TextStyle(height: 1.6, color: AppColors.primaryDark),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text('القدرات العامة', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          _ExamCard(
            title: 'القسم اللفظي',
            subtitle: 'استيعاب المقروء، التناظر، وإكمال الجمل',
            icon: Icons.menu_book_outlined,
            color: AppColors.primary,
            onTap: () => _openExam(context, 'verbal', 'اختبار القدرات اللفظي'),
          ),
          const SizedBox(height: 12),
          _ExamCard(
            title: 'القسم الكمي',
            subtitle: 'الحساب، الجبر، الهندسة وتحليل البيانات',
            icon: Icons.calculate_outlined,
            color: const Color(0xFFC97A5B),
            onTap: () => _openExam(context, 'quantitative', 'اختبار القدرات الكمي'),
          ),
          const SizedBox(height: 26),
          const Text('مسارات إضافية', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          const _ComingSoonCard(
            title: 'التحصيلي',
            subtitle: 'نماذج العلوم والرياضيات قيد التجهيز للموبايل',
            icon: Icons.science_outlined,
          ),
          const SizedBox(height: 12),
          const _ComingSoonCard(
            title: 'GAT و IELTS',
            subtitle: 'مسارات اللغة والاختبارات الدولية قريباً',
            icon: Icons.language_rounded,
          ),
        ],
      ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ExamCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: color.withOpacity(.1), borderRadius: BorderRadius.circular(14)),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                    Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecond)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: onTap,
            icon: const Icon(Icons.play_arrow_rounded),
            label: const Text('ابدأ الاختبار'),
          ),
        ],
      ),
    );
  }
}

class _ComingSoonCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const _ComingSoonCard({required this.title, required this.subtitle, required this.icon});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      tileColor: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
      leading: Icon(icon, color: AppColors.textSecond),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      subtitle: Text(subtitle),
      trailing: const Chip(label: Text('قريباً')),
    );
  }
}