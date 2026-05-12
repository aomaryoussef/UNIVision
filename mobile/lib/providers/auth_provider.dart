import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _token;
  String? _userId;
  String? _role;
  String? _name;

  bool get isLoggedIn => _token != null;
  String? get token => _token;
  String? get userId => _userId;
  String? get role => _role;
  String? get name => _name;

  AuthProvider() {
    _loadSession();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('uv_token');
    _userId = prefs.getString('uv_userId');
    _role = prefs.getString('uv_role');
    _name = prefs.getString('uv_name');
    if (_token != null) notifyListeners();
  }

  Future<String?> login(String role, String id, String password) async {
    try {
      final result = await ApiService.login(role, id, password);
      if (result['error'] != null) return result['error'];

      _token = result['token'];
      _userId = result['user']['id'].toString();
      _role = result['user']['role'];
      _name = result['user']['name'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('uv_token', _token!);
      await prefs.setString('uv_userId', _userId!);
      await prefs.setString('uv_role', _role!);
      await prefs.setString('uv_name', _name ?? '');

      notifyListeners();
      return null; // success
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> logout() async {
    _token = null;
    _userId = null;
    _role = null;
    _name = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }
}
