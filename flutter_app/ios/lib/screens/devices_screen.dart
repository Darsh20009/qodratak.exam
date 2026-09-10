import 'package:flutter/material.dart';
import '../core/api.dart';
import '../core/colors.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  List<Map<String, dynamic>> _devices = const [];
  int _limit = 2;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final raw = await Api.get('/api/user/devices');
      final data = Map<String, dynamic>.from(raw as Map);
      final list = data['devices'] is List ? data['devices'] as List : const [];
      if (mounted) {
        setState(() {
          _devices = list.map((item) => Map<String, dynamic>.from(item as Map)).toList();
          _limit = (data['limit'] as num?)?.toInt() ?? 2;
          _loading = false;
        });
      }
    } catch (error) {
      if (mounted) setState(() { _error = Api.errorMessage(error); _loading = false; });
    }
  }

  Future<void> _remove(Map<String, dynamic> device) async {
    final id = device['deviceKey']?.toString() ?? '';
    if (id.isEmpty) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف الجهاز؟'),
        content: const Text('سيتم تسجيل خروج هذا الجهاز في المرة القادمة التي يتصل فيها.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('حذف')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await Api.delete('/api/user/devices/$id');
      await _load();
    } catch (error) {
      if (mounted) setState(() => _error = Api.errorMessage(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('إدارة الأجهزة')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, textAlign: TextAlign.center)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(18, 10, 18, 32),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(16)),
                        child: Text(
                          'يمكن استخدام حسابك على $_limit أجهزة كحد أقصى. احذف جهازاً قديماً إذا وصلت للحد.',
                          style: const TextStyle(color: AppColors.primaryDark, height: 1.6),
                        ),
                      ),
                      const SizedBox(height: 18),
                      ..._devices.map((device) => _DeviceTile(device: device, onRemove: () => _remove(device))),
                      if (_devices.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(40),
                          child: Text('لا توجد أجهزة مسجلة.', textAlign: TextAlign.center),
                        ),
                    ],
                  ),
                ),
    );
  }
}

class _DeviceTile extends StatelessWidget {
  final Map<String, dynamic> device;
  final VoidCallback onRemove;

  const _DeviceTile({required this.device, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    final platform = (device['platform'] ?? device['deviceType'] ?? 'mobile').toString();
    final label = (device['label'] ?? device['deviceName'] ?? 'جهاز غير مسمى').toString();
    final current = device['isCurrent'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(platform.toLowerCase().contains('ios') ? Icons.phone_iphone_rounded : Icons.phone_android_rounded, color: AppColors.primary, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(current ? 'هذا الجهاز' : platform, style: const TextStyle(color: AppColors.textSecond, fontSize: 12)),
              ],
            ),
          ),
          if (current)
            const Chip(label: Text('نشط'))
          else
            IconButton(onPressed: onRemove, icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error)),
        ],
      ),
    );
  }
}