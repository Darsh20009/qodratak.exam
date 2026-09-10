import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AppStorage {
  AppStorage._();

  static const _store = FlutterSecureStorage(
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _kSession  = 'qodratak_session';
  static const _kPhone    = 'qodratak_phone';
  static const _kName     = 'qodratak_name';
  static const _kUsername = 'qodratak_username';
  static const _kUserId   = 'qodratak_user_id';
  static const _kDevice   = 'qodratak_device_id';
  static const _kCookie   = 'qodratak_session_cookie';

  static Future<bool> hasSession() async {
    try { return (await _store.read(key: _kSession)) == '1'; } catch (_) { return false; }
  }

  static Future<void> saveSession({required String phone, String? name, String? username, dynamic userId}) async {
    try {
      await _store.write(key: _kSession, value: '1');
      await savePhone(phone);
      if (name != null) await saveName(name);
      if (username != null) await _store.write(key: _kUsername, value: username);
      if (userId != null) await _store.write(key: _kUserId, value: '$userId');
    } catch (_) {}
  }

  // ─── Phone ───────────────────────────────────────────────────────────────
  static Future<String?> getPhone() async {
    try { return await _store.read(key: _kPhone); } catch (_) { return null; }
  }

  static Future<void> savePhone(String p) async {
    try { await _store.write(key: _kPhone, value: p); } catch (_) {}
  }

  // ─── Name ────────────────────────────────────────────────────────────────
  static Future<String?> getName() async {
    try { return await _store.read(key: _kName); } catch (_) { return null; }
  }

  static Future<void> saveName(String n) async {
    try { await _store.write(key: _kName, value: n); } catch (_) {}
  }

  static Future<String?> getUsername() async {
    try { return await _store.read(key: _kUsername); } catch (_) { return null; }
  }

  static Future<String?> getUserId() async {
    try { return await _store.read(key: _kUserId); } catch (_) { return null; }
  }

  static Future<String> getDeviceId() async {
    try {
      final existing = await _store.read(key: _kDevice);
      if (existing != null && existing.isNotEmpty) return existing;
      final random = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
      final value = 'flutter-$random';
      await _store.write(key: _kDevice, value: value);
      return value;
    } catch (_) {
      return 'flutter-device';
    }
  }

  static Future<String?> getSessionCookie() async {
    try { return await _store.read(key: _kCookie); } catch (_) { return null; }
  }

  static Future<void> saveSessionCookie(String cookie) async {
    try { await _store.write(key: _kCookie, value: cookie); } catch (_) {}
  }

  // ─── Logout ──────────────────────────────────────────────────────────────
  static Future<void> clearAll() async {
    try {
      final device = await getDeviceId();
      await _store.deleteAll();
      await _store.write(key: _kDevice, value: device);
    } catch (_) {}
  }
}
