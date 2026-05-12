import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

class ApiService {
  // Web/iOS: localhost; Android emulator: 10.0.2.2
  // For physical devices, replace with your machine's IP address
  static final String _baseUrl = kIsWeb
      ? 'http://localhost:3001/api'
      : Platform.isAndroid
          ? 'http://10.0.2.2:3001/api'
          : 'http://localhost:3001/api';

  static String? _token;

  static void setToken(String? token) => _token = token;

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  // ── Auth ────────────────────────────────────
  static Future<Map<String, dynamic>> login(
      String role, String id, String password) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'role': role, 'id': id, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) return {'error': data['error'] ?? 'Login failed'};
    _token = data['token'];
    return data;
  }

  // ── Generic GET / POST / PUT / DELETE ───────
  static Future<dynamic> get(String path) async {
    final res = await http.get(Uri.parse('$_baseUrl$path'), headers: _headers);
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['error'] ?? 'Request failed');
    }
    return jsonDecode(res.body);
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$_baseUrl$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception(data['error'] ?? 'Request failed');
    }
    return data;
  }

  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final res = await http.put(
      Uri.parse('$_baseUrl$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'Request failed');
    }
    return data;
  }

  static Future<dynamic> delete(String path) async {
    final res =
        await http.delete(Uri.parse('$_baseUrl$path'), headers: _headers);
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'Request failed');
    }
    return data;
  }

  // ── Student API ─────────────────────────────
  static Future<Map<String, dynamic>> studentHome(String id) async =>
      await get('/student/$id/home');

  static Future<Map<String, dynamic>> studentProfile(String id) async =>
      await get('/student/$id/profile');

  static Future<Map<String, dynamic>> studentGrades(String id) async =>
      await get('/student/$id/grades');

  static Future<Map<String, dynamic>> studentAttendance(String id) async =>
      await get('/student/$id/attendance');

  static Future<List<dynamic>> studentReports(String id) async =>
      List<dynamic>.from(await get('/student/$id/reports'));

  static Future<Map<String, dynamic>> studentReport(
          String id, int semester) async =>
      await get('/student/$id/reports/$semester');

  static Future<List<dynamic>> studentSchedule(String id) async =>
      List<dynamic>.from(await get('/student/$id/schedule'));

  static Future<Map<String, dynamic>> studentComparison(String id) async =>
      await get('/student/$id/comparison');

  // ── Doctor API ──────────────────────────────
  static Future<List<dynamic>> doctorGetStudents() async =>
      List<dynamic>.from(await get('/doctor/students'));

  static Future<Map<String, dynamic>> doctorGetStudent(String id) async =>
      await get('/doctor/student/$id');

  static Future<List<dynamic>> doctorGetSemesters(String id) async =>
      List<dynamic>.from(await get('/doctor/student/$id/semesters'));

  static Future<List<dynamic>> doctorGetGrades(String id) async =>
      List<dynamic>.from(await get('/doctor/student/$id/grades'));

  static Future<dynamic> doctorSaveGrade(
          String id, Map<String, dynamic> data) async =>
      await post('/doctor/student/$id/grades', data);

  static Future<dynamic> doctorDeleteGrade(int gid) async =>
      await delete('/doctor/grade/$gid');

  static Future<List<dynamic>> doctorGetAttendance(String id) async =>
      List<dynamic>.from(await get('/doctor/student/$id/attendance'));

  static Future<dynamic> doctorSaveAttendance(
          String id, Map<String, dynamic> data) async =>
      await post('/doctor/student/$id/attendance', data);

  static Future<dynamic> doctorDeleteAttendance(int aid) async =>
      await delete('/doctor/attendance/$aid');

  static Future<List<dynamic>> doctorGetFeedback(String id) async =>
      List<dynamic>.from(await get('/doctor/student/$id/feedback'));

  static Future<dynamic> doctorAddFeedback(
          String id, Map<String, dynamic> data) async =>
      await post('/doctor/student/$id/feedback', data);

  static Future<dynamic> doctorUpdateFeedback(
          int fid, Map<String, dynamic> data) async =>
      await put('/doctor/feedback/$fid', data);

  static Future<dynamic> doctorDeleteFeedback(int fid) async =>
      await delete('/doctor/feedback/$fid');

  static Future<List<dynamic>> doctorGetSchedule(String semester) async =>
      List<dynamic>.from(await get('/doctor/schedule/$semester'));

  static Future<dynamic> doctorAddSchedule(
          String semester, Map<String, dynamic> data) async =>
      await post('/doctor/schedule/$semester', data);

  static Future<dynamic> doctorUpdateSchedule(
          int id, Map<String, dynamic> data) async =>
      await put('/doctor/schedule-entry/$id', data);

  static Future<dynamic> doctorDeleteSchedule(int id) async =>
      await delete('/doctor/schedule-entry/$id');

  static Future<List<dynamic>> doctorGetAdminFeedback(String sid) async =>
      List<dynamic>.from(await get('/doctor/student/$sid/admin-feedback'));

  static Future<dynamic> doctorSendAdminFeedback(
          String sid, Map<String, dynamic> data) async =>
      await post('/doctor/student/$sid/admin-feedback', data);

  static Future<dynamic> doctorUpdateAdminFeedback(
          int id, Map<String, dynamic> data) async =>
      await put('/doctor/admin-feedback/$id', data);

  static Future<dynamic> doctorDeleteAdminFeedback(int id) async =>
      await delete('/doctor/admin-feedback/$id');

  // ── Admin API ───────────────────────────────
  static Future<dynamic> adminAddStudent(Map<String, dynamic> data) async =>
      await post('/admin/students', data);
}
