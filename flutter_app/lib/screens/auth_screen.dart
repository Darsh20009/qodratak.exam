import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/api.dart';
import '../core/colors.dart';
import '../core/storage.dart';

enum _AuthStep { phone, otp, details, passwordLogin, twoFactor }

class AuthScreen extends StatefulWidget {
  final VoidCallback onAuthenticated;

  const AuthScreen({required this.onAuthenticated, super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _signup = false;
  bool _loading = false;
  bool _showPassword = false;
  _AuthStep _step = _AuthStep.phone;
  String _countryCode = '966';
  String? _verificationToken;
  List<String> _twoFactorMethods = const [];
  String? _twoFactorMethod;
  String? _error;

  static const _countries = <(String, String, String)>[
    ('السعودية', '966', '🇸🇦'),
    ('الإمارات', '971', '🇦🇪'),
    ('الكويت', '965', '🇰🇼'),
    ('البحرين', '973', '🇧🇭'),
    ('قطر', '974', '🇶🇦'),
    ('عُمان', '968', '🇴🇲'),
    ('الأردن', '962', '🇯🇴'),
    ('مصر', '20', '🇪🇬'),
    ('العراق', '964', '🇮🇶'),
    ('اليمن', '967', '🇾🇪'),
    ('سوريا', '963', '🇸🇾'),
    ('لبنان', '961', '🇱🇧'),
    ('فلسطين', '970', '🇵🇸'),
    ('المغرب', '212', '🇲🇦'),
    ('الجزائر', '213', '🇩🇿'),
    ('تونس', '216', '🇹🇳'),
    ('السودان', '249', '🇸🇩'),
    ('تركيا', '90', '🇹🇷'),
    ('المملكة المتحدة', '44', '🇬🇧'),
    ('الولايات المتحدة', '1', '🇺🇸'),
  ];

  String get _phone {
    final local = _phoneController.text.replaceAll(RegExp(r'\D'), '').replaceFirst(RegExp(r'^0+'), '');
    return '+$_countryCode$local';
  }

  void _switchMode(bool signup) {
    setState(() {
      _signup = signup;
      _step = _AuthStep.phone;
      _verificationToken = null;
      _otpController.clear();
      _error = null;
    });
  }

  Future<void> _run(Future<void> Function() operation) async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await operation();
    } catch (error) {
      if (mounted) setState(() => _error = Api.errorMessage(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _requestOtp() => _run(() async {
        if (_phoneController.text.replaceAll(RegExp(r'\D'), '').length < 6) {
          throw const FormatException('أدخل رقم جوال صحيحاً');
        }
        final deviceId = await AppStorage.getDeviceId();
        await Api.post('/api/auth/phone-otp/request', data: {
          'phone': _phone,
          'purpose': _signup ? 'signup' : 'login',
          'deviceId': deviceId,
        });
        if (mounted) setState(() => _step = _AuthStep.otp);
      });

  Future<void> _verifyOtp() => _run(() async {
        if (_otpController.text.length != 6) {
          throw const FormatException('أدخل رمز التحقق المكون من 6 أرقام');
        }
        final deviceId = await AppStorage.getDeviceId();
        final raw = await Api.post('/api/auth/phone-otp/verify', data: {
          'phone': _phone,
          'otp': _otpController.text,
          'purpose': _signup ? 'signup' : 'login',
          'deviceId': deviceId,
        });
        final data = Map<String, dynamic>.from(raw as Map);
        if (_signup) {
          final token = data['verificationToken']?.toString();
          if (token == null || token.isEmpty) {
            throw StateError('تعذر إكمال التحقق');
          }
          if (mounted) {
            setState(() {
              _verificationToken = token;
              _step = _AuthStep.details;
            });
          }
        } else {
          await _completeLogin(data);
        }
      });

  Future<void> _register() => _run(() async {
        final nameParts = _nameController.text.trim().split(RegExp(r'\s+'));
        if (nameParts.length < 2) throw const FormatException('أدخل الاسم الثنائي');
        if (_usernameController.text.trim().length < 3) {
          throw const FormatException('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        }
        final email = _emailController.text.trim();
        if (email.isNotEmpty && !email.contains('@')) {
          throw const FormatException('البريد الإلكتروني غير صحيح');
        }
        if (_passwordController.text.length < 6) {
          throw const FormatException('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        if (_passwordController.text != _confirmPasswordController.text) {
          throw const FormatException('كلمتا المرور غير متطابقتين');
        }

        final raw = await Api.post('/api/auth/register-multi', data: {
          'fullName': _nameController.text.trim(),
          'username': _usernameController.text.trim(),
          if (email.isNotEmpty) 'email': email.toLowerCase(),
          'phone': _phone,
          'whatsapp': _phone,
          'password': _passwordController.text,
          'role': 'student',
          'phoneVerificationToken': _verificationToken,
        });
        await _completeLogin(Map<String, dynamic>.from(raw as Map));
      });

  Future<void> _passwordLogin() => _run(() async {
        final identifier = _emailController.text.trim();
        if (identifier.isEmpty || _passwordController.text.isEmpty) {
          throw const FormatException('أدخل اسم المستخدم أو البريد وكلمة المرور');
        }
        final deviceId = await AppStorage.getDeviceId();
        final raw = await Api.post('/api/auth/login', data: {
          'identifier': identifier,
          'password': _passwordController.text,
          'deviceId': deviceId,
        });
        final data = Map<String, dynamic>.from(raw as Map);
        if (data['require2FA'] == true) {
          final methods = (data['methods'] as List? ?? const [])
              .map((method) => method.toString())
              .where((method) => method == 'totp' || method == 'email' || method == 'recovery')
              .toList();
          if (methods.isEmpty) {
            throw StateError('طريقة التحقق الثنائي المفعلة غير مدعومة على التطبيق بعد');
          }
          final method = methods.first;
          if (method == 'email') {
            await Api.post('/api/auth/2fa/send-email-otp');
          }
          if (mounted) {
            setState(() {
              _twoFactorMethods = methods;
              _twoFactorMethod = method;
              _otpController.clear();
              _step = _AuthStep.twoFactor;
            });
          }
          return;
        }
        await _completeLogin(data);
      });

  Future<void> _verifyTwoFactor() => _run(() async {
        final code = _otpController.text.trim();
        if (code.isEmpty) throw const FormatException('أدخل رمز التحقق');
        final raw = await Api.post('/api/auth/verify-2fa', data: {
          'method': _twoFactorMethod,
          'code': code,
        });
        final data = Map<String, dynamic>.from(raw as Map);
        final user = data['user'];
        if (user is! Map) throw StateError('تعذر إكمال تسجيل الدخول');
        await _completeLogin(Map<String, dynamic>.from(user));
      });

  Future<void> _changeTwoFactorMethod(String? method) async {
    if (method == null || method == _twoFactorMethod || _loading) return;
    setState(() {
      _twoFactorMethod = method;
      _otpController.clear();
      _error = null;
    });
    if (method == 'email') {
      await _run(() async {
        await Api.post('/api/auth/2fa/send-email-otp');
      });
    }
  }

  Future<void> _completeLogin(Map<String, dynamic> user) async {
    await AppStorage.saveSession(
      phone: user['phone']?.toString() ?? _phone,
      name: user['name']?.toString() ?? user['fullName']?.toString(),
      username: user['username']?.toString(),
      userId: user['id'] ?? user['_id'],
    );
    if (mounted) widget.onAuthenticated();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 22, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Image.asset(
                  'assets/images/qodratak-logo.png',
                  width: 78,
                  height: 78,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'قدراتك',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 23, fontWeight: FontWeight.w800),
              ),
              const Text(
                'تعلّم بثقة، وتقدّم بخطوات واضحة',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecond, fontSize: 13),
              ),
              const SizedBox(height: 28),
              _modeTabs(),
              const SizedBox(height: 26),
              Text(
                _step == _AuthStep.otp
                    ? 'أدخل رمز واتساب'
                    : _step == _AuthStep.details
                        ? 'أكمل بيانات حسابك'
                        : _step == _AuthStep.twoFactor
                            ? 'التحقق بخطوتين'
                        : _step == _AuthStep.passwordLogin
                            ? 'الدخول بكلمة المرور'
                            : _signup
                                ? 'ابدأ برقم جوالك'
                                : 'أهلاً بعودتك',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                _step == _AuthStep.details
                    ? 'تم تأكيد رقمك بنجاح. البريد الإلكتروني اختياري.'
                    : _step == _AuthStep.otp
                        ? 'أرسلنا رمزاً من 6 أرقام إلى $_phone'
                        : _step == _AuthStep.twoFactor
                            ? 'أكمل التحقق الإضافي لحماية حسابك.'
                        : 'سنرسل رمز التحقق إلى واتساب.',
                style: const TextStyle(color: AppColors.textSecond, height: 1.5),
              ),
              const SizedBox(height: 22),
              if (_step == _AuthStep.phone) _phoneForm(),
              if (_step == _AuthStep.otp) _otpForm(),
              if (_step == _AuthStep.details) _detailsForm(),
              if (_step == _AuthStep.passwordLogin) _passwordLoginForm(),
              if (_step == _AuthStep.twoFactor) _twoFactorForm(),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 19),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 14),
              _primaryButton(),
              if (!_signup && _step == _AuthStep.phone) ...[
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => setState(() {
                    _step = _AuthStep.passwordLogin;
                    _error = null;
                  }),
                  icon: const Icon(Icons.alternate_email_rounded),
                  label: const Text('الدخول باسم المستخدم أو البريد'),
                ),
              ],
              if (_step != _AuthStep.phone) ...[
                const SizedBox(height: 10),
                TextButton(
                  onPressed: _loading
                      ? null
                      : () => setState(() {
                            _step = _AuthStep.phone;
                            _otpController.clear();
                            _error = null;
                          }),
                  child: Text(_step == _AuthStep.twoFactor ? 'العودة إلى تسجيل الدخول' : 'العودة وتغيير رقم الجوال'),
                ),
              ],
              const SizedBox(height: 14),
              const Text(
                'بالمتابعة أنت توافق على شروط الاستخدام وسياسة الخصوصية.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: AppColors.textSecond),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modeTabs() {
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(child: _modeButton('تسجيل الدخول', !_signup, () => _switchMode(false))),
          Expanded(child: _modeButton('إنشاء حساب', _signup, () => _switchMode(true))),
        ],
      ),
    );
  }

  Widget _modeButton(String label, bool active, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(11),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(11),
          boxShadow: active
              ? [BoxShadow(color: Colors.black.withOpacity(.05), blurRadius: 8)]
              : null,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: active ? AppColors.text : AppColors.textSecond,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _phoneForm() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 125,
          child: DropdownButtonFormField<String>(
            value: _countryCode,
            isExpanded: true,
            decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 16)),
            items: _countries
                .map((country) => DropdownMenuItem(
                      value: country.$2,
                      child: Text('${country.$3} +${country.$2}', textDirection: TextDirection.ltr),
                    ))
                .toList(),
            onChanged: (value) => setState(() => _countryCode = value ?? '966'),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            textDirection: TextDirection.ltr,
            textAlign: TextAlign.left,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(
              hintText: '5XXXXXXXX',
              prefixIcon: Icon(Icons.phone_outlined),
            ),
          ),
        ),
      ],
    );
  }

  Widget _otpForm() {
    return TextField(
      controller: _otpController,
      autofocus: true,
      keyboardType: TextInputType.number,
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
      maxLength: 6,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      style: const TextStyle(fontSize: 24, letterSpacing: 10, fontWeight: FontWeight.w700),
      decoration: const InputDecoration(
        counterText: '',
        hintText: '------',
        prefixIcon: Icon(Icons.key_rounded),
      ),
      onSubmitted: (_) => _verifyOtp(),
    );
  }

  Widget _detailsForm() {
    return Column(
      children: [
        TextField(
          controller: _nameController,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'الاسم الثنائي', prefixIcon: Icon(Icons.person_outline)),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _usernameController,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.left,
          textInputAction: TextInputAction.next,
          inputFormatters: [FilteringTextInputFormatter.deny(RegExp(r'\s'))],
          decoration: const InputDecoration(labelText: 'اسم المستخدم', prefixIcon: Icon(Icons.alternate_email_rounded)),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.left,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'البريد الإلكتروني (اختياري)', prefixIcon: Icon(Icons.mail_outline)),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordController,
          obscureText: !_showPassword,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: 'كلمة المرور',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              onPressed: () => setState(() => _showPassword = !_showPassword),
              icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
            ),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _confirmPasswordController,
          obscureText: !_showPassword,
          decoration: const InputDecoration(labelText: 'تأكيد كلمة المرور', prefixIcon: Icon(Icons.lock_reset_rounded)),
          onSubmitted: (_) => _register(),
        ),
      ],
    );
  }

  Widget _passwordLoginForm() {
    return Column(
      children: [
        TextField(
          controller: _emailController,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.left,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            labelText: 'اسم المستخدم أو البريد',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordController,
          obscureText: !_showPassword,
          decoration: InputDecoration(
            labelText: 'كلمة المرور',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              onPressed: () => setState(() => _showPassword = !_showPassword),
              icon: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
            ),
          ),
          onSubmitted: (_) => _passwordLogin(),
        ),
      ],
    );
  }

  Widget _twoFactorForm() {
    String label(String method) {
      if (method == 'email') return 'رمز البريد الإلكتروني';
      if (method == 'recovery') return 'عبارة الاسترداد';
      return 'تطبيق المصادقة';
    }

    return Column(
      children: [
        if (_twoFactorMethods.length > 1) ...[
          DropdownButtonFormField<String>(
            value: _twoFactorMethod,
            decoration: const InputDecoration(
              labelText: 'طريقة التحقق',
              prefixIcon: Icon(Icons.security_rounded),
            ),
            items: _twoFactorMethods
                .map((method) => DropdownMenuItem(value: method, child: Text(label(method))))
                .toList(),
            onChanged: _changeTwoFactorMethod,
          ),
          const SizedBox(height: 12),
        ],
        TextField(
          controller: _otpController,
          autofocus: true,
          obscureText: _twoFactorMethod == 'recovery',
          keyboardType: _twoFactorMethod == 'recovery' ? TextInputType.text : TextInputType.number,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.center,
          inputFormatters: _twoFactorMethod == 'recovery'
              ? null
              : [FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(
            labelText: label(_twoFactorMethod ?? 'totp'),
            prefixIcon: const Icon(Icons.verified_user_outlined),
          ),
          onSubmitted: (_) => _verifyTwoFactor(),
        ),
      ],
    );
  }

  Widget _primaryButton() {
    final label = _step == _AuthStep.otp
        ? 'تأكيد الرمز'
        : _step == _AuthStep.details
            ? 'إنشاء الحساب'
            : _step == _AuthStep.twoFactor
                ? 'إكمال التحقق'
            : _step == _AuthStep.passwordLogin
                ? 'تسجيل الدخول'
                : 'إرسال رمز واتساب';
    return ElevatedButton.icon(
      onPressed: _loading
          ? null
          : () {
              if (_step == _AuthStep.phone) {
                _requestOtp();
              } else if (_step == _AuthStep.otp) {
                _verifyOtp();
              } else if (_step == _AuthStep.details) {
                _register();
              } else if (_step == _AuthStep.twoFactor) {
                _verifyTwoFactor();
              } else {
                _passwordLogin();
              }
            },
      icon: _loading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
            )
          : Icon(_step == _AuthStep.otp ? Icons.verified_outlined : Icons.chat_outlined),
      label: Text(label),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}