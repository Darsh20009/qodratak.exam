import 'package:dio/dio.dart';
import 'storage.dart';

class Api {
  Api._();

  static late final Dio _dio;
  static bool _initialized = false;

  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://qodratak.sa',
  );

  static Future<void> initialize() async {
    if (_initialized) return;
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      headers: const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'ar',
      },
    ));
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final cookie = await AppStorage.getSessionCookie();
          if (cookie != null && cookie.isNotEmpty) {
            options.headers['Cookie'] = cookie;
          }
          handler.next(options);
        },
        onResponse: (response, handler) async {
          await _captureSessionCookie(response.headers);
          handler.next(response);
        },
        onError: (error, handler) async {
          if (error.response != null) {
            await _captureSessionCookie(error.response!.headers);
          }
          handler.next(error);
        },
      ),
    );
    _initialized = true;
  }

  static Future<void> _captureSessionCookie(Headers headers) async {
    final setCookies = headers.map['set-cookie'] ?? const <String>[];
    for (final header in setCookies) {
      final match = RegExp(r'((?:__Host-)?qodratak\.sid=[^;]+)').firstMatch(header);
      if (match != null) {
        await AppStorage.saveSessionCookie(match.group(1)!);
        return;
      }
    }
  }

  static Future<dynamic> get(String path, {Map<String, dynamic>? params}) async {
    _ensureInitialized();
    final response = await _dio.get<dynamic>(path, queryParameters: params);
    return response.data;
  }

  static Future<dynamic> post(String path, {dynamic data}) async {
    _ensureInitialized();
    final response = await _dio.post<dynamic>(path, data: data);
    return response.data;
  }

  static Future<dynamic> patch(String path, {dynamic data}) async {
    _ensureInitialized();
    final response = await _dio.patch<dynamic>(path, data: data);
    return response.data;
  }

  static String errorMessage(Object error) {
    if (error is FormatException) return error.message;
    if (error is StateError) return error.message.replaceFirst('Bad state: ', '');
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] != null) return '${data['message']}';
      if (data is Map && data['error'] != null) return '${data['error']}';
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'تعذر الاتصال بالإنترنت. حاول مرة أخرى.';
      }
    }
    return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
  }

  static void _ensureInitialized() {
    if (!_initialized) {
      throw StateError('Api.initialize() must be called before using Api');
    }
  }
}