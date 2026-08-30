import 'dart:async';
import 'package:flutter/material.dart';
import '../core/api.dart';
import '../core/colors.dart';

class ExamScreen extends StatefulWidget {
  final String category;
  final String title;

  const ExamScreen({required this.category, required this.title, super.key});

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends State<ExamScreen> {
  List<Map<String, dynamic>> _questions = const [];
  final Map<int, int> _answers = {};
  int _current = 0;
  int _elapsed = 0;
  String? _attemptId;
  bool _loading = true;
  bool _submitting = false;
  String? _error;
  Timer? _timer;

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
      final raw = await Api.get('/api/mobile/questions/free-test/${widget.category}');
      final payload = Map<String, dynamic>.from(raw as Map);
      final list = payload['questions'] as List?;
      if (list == null || list.isEmpty) throw StateError('لا توجد أسئلة متاحة حالياً');
      if (!mounted) return;
      setState(() {
        _questions = list.map((item) => Map<String, dynamic>.from(item as Map)).toList();
        _attemptId = payload['attemptId']?.toString();
        _loading = false;
      });
      _timer?.cancel();
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() => _elapsed++);
      });
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = Api.errorMessage(error);
          _loading = false;
        });
      }
    }
  }

  List<String> _options(Map<String, dynamic> question) {
    final raw = question['options'] ?? question['choices'];
    if (raw is List) return raw.map((item) => item.toString()).toList();
    return const [];
  }

  Future<void> _submit() async {
    if (_submitting) return;
    final unanswered = _questions.length - _answers.length;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إرسال الاختبار'),
        content: Text(
          unanswered > 0
              ? 'لديك $unanswered أسئلة لم تُجب عنها. هل تريد الإرسال؟'
              : 'هل أنت جاهز لإرسال إجاباتك؟',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('متابعة الحل')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(minimumSize: const Size(100, 42)),
            child: const Text('إرسال'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _submitting = true);
    _timer?.cancel();
    try {
      final raw = await Api.post('/api/mobile/test-results', data: {
        'attemptId': _attemptId,
        'timeTaken': _elapsed,
        'answers': _answers.entries.map((entry) => {
          'questionId': _questions[entry.key]['id'],
          'selectedIndex': entry.value,
        }).toList(),
      });
      final result = Map<String, dynamic>.from(raw as Map);
      final correct = (result['score'] as num?)?.toInt() ?? 0;
      final total = (result['totalQuestions'] as num?)?.toInt() ?? _questions.length;
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          icon: const Icon(Icons.emoji_events_rounded, color: AppColors.gold, size: 54),
          title: const Text('أحسنت!'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('$correct من $total', style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800)),
              const SizedBox(height: 6),
              Text('نسبتك ${(correct / total * 100).round()}%'),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('عرض نتائجي'),
            ),
          ],
        ),
      );
      if (mounted) Navigator.pop(context);
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = Api.errorMessage(error);
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _loading || _questions.isEmpty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('مغادرة الاختبار؟'),
            content: const Text('لن تُحفظ الإجابات إذا غادرت الآن.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('البقاء')),
              TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('مغادرة')),
            ],
          ),
        );
        if (leave == true && context.mounted) Navigator.pop(context);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.title),
          actions: [
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 16),
              child: Center(child: Text('${_elapsed ~/ 60}:${(_elapsed % 60).toString().padLeft(2, '0')}')),
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null && _questions.isEmpty
                ? _LoadError(message: _error!, onRetry: _load)
                : _examBody(),
      ),
    );
  }

  Widget _examBody() {
    final question = _questions[_current];
    final options = _options(question);
    final progress = (_current + 1) / _questions.length;
    return SafeArea(
      child: Column(
        children: [
          LinearProgressIndicator(value: progress, minHeight: 5, color: AppColors.primary, backgroundColor: AppColors.border),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 22, 18, 18),
              children: [
                Row(
                  children: [
                    Text('السؤال ${_current + 1}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                    const Spacer(),
                    Text('من ${_questions.length}', style: const TextStyle(color: AppColors.textSecond)),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  (question['text'] ?? question['question'] ?? '').toString(),
                  style: const TextStyle(fontSize: 20, height: 1.7, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 22),
                ...List.generate(options.length, (index) {
                  final selected = _answers[_current] == index;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 11),
                    child: InkWell(
                      onTap: () => setState(() => _answers[_current] = index),
                      borderRadius: BorderRadius.circular(15),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 160),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.primaryLight : AppColors.surface,
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 1.5 : 1),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 15,
                              backgroundColor: selected ? AppColors.primary : AppColors.card,
                              child: Text(
                                String.fromCharCode(65 + index),
                                style: TextStyle(color: selected ? Colors.white : AppColors.textSecond, fontWeight: FontWeight.w700),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text(options[index], style: const TextStyle(fontSize: 15, height: 1.5))),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
                if (_error != null) Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(_error!, style: const TextStyle(color: AppColors.error)),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(18, 10, 18, 14),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                if (_current > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _current--),
                      child: const Text('السابق'),
                    ),
                  ),
                if (_current > 0) const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _submitting
                        ? null
                        : _current == _questions.length - 1
                            ? _submit
                            : () => setState(() => _current++),
                    child: _submitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(_current == _questions.length - 1 ? 'إنهاء الاختبار' : 'التالي'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

class _LoadError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _LoadError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.quiz_outlined, size: 60, color: AppColors.textSecond),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
          ],
        ),
      ),
    );
  }
}