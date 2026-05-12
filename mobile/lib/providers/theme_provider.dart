import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppTheme {
  final String id;
  final String label;
  final IconData icon;
  final bool isLight;
  final Color primaryBg;
  final Color cardBg;
  final Color accent;
  final Color accentLight;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color danger;
  final Color success;
  final Color warning;
  final Color info;

  const AppTheme({
    required this.id,
    required this.label,
    required this.icon,
    this.isLight = false,
    required this.primaryBg,
    required this.cardBg,
    required this.accent,
    required this.accentLight,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    this.danger = const Color(0xFFef4444),
    this.success = const Color(0xFF22c55e),
    this.warning = const Color(0xFFf59e0b),
    this.info = const Color(0xFF3b82f6),
  });
}

final List<AppTheme> appThemes = [
  const AppTheme(
    id: 'navy-gold',
    label: 'Navy Gold',
    icon: Icons.sunny,
    primaryBg: Color(0xFF091428),
    cardBg: Color(0xFF0f1f3d),
    accent: Color(0xFFd4a830),
    accentLight: Color(0xFFe7c764),
    textPrimary: Color(0xFFf0f4f8),
    textSecondary: Color(0xFFa0aec0),
    textMuted: Color(0xFF718096),
  ),
  const AppTheme(
    id: 'ocean-blue',
    label: 'Ocean Blue',
    icon: Icons.water,
    primaryBg: Color(0xFF0a1628),
    cardBg: Color(0xFF101e36),
    accent: Color(0xFF38bdf8),
    accentLight: Color(0xFF7dd3fc),
    textPrimary: Color(0xFFf0f4f8),
    textSecondary: Color(0xFF94a3b8),
    textMuted: Color(0xFF64748b),
  ),
  const AppTheme(
    id: 'emerald',
    label: 'Emerald',
    icon: Icons.eco,
    primaryBg: Color(0xFF071a12),
    cardBg: Color(0xFF0d2818),
    accent: Color(0xFF34d399),
    accentLight: Color(0xFF6ee7b7),
    textPrimary: Color(0xFFecfdf5),
    textSecondary: Color(0xFFa7f3d0),
    textMuted: Color(0xFF4ade80),
  ),
  const AppTheme(
    id: 'royal-purple',
    label: 'Royal Purple',
    icon: Icons.diamond,
    primaryBg: Color(0xFF110a28),
    cardBg: Color(0xFF1a1040),
    accent: Color(0xFFa78bfa),
    accentLight: Color(0xFFc4b5fd),
    textPrimary: Color(0xFFf5f3ff),
    textSecondary: Color(0xFFc4b5fd),
    textMuted: Color(0xFF7c3aed),
  ),
  const AppTheme(
    id: 'rose',
    label: 'Rose',
    icon: Icons.favorite,
    primaryBg: Color(0xFF1a0a14),
    cardBg: Color(0xFF2a1020),
    accent: Color(0xFFfb7185),
    accentLight: Color(0xFFfda4af),
    textPrimary: Color(0xFFfff1f2),
    textSecondary: Color(0xFFfecdd3),
    textMuted: Color(0xFFf43f5e),
  ),
  const AppTheme(
    id: 'light-white',
    label: 'White',
    icon: Icons.light_mode,
    isLight: true,
    primaryBg: Color(0xFFffffff),
    cardBg: Color(0xFFffffff),
    accent: Color(0xFF1a56db),
    accentLight: Color(0xFF3b82f6),
    textPrimary: Color(0xFF111827),
    textSecondary: Color(0xFF4b5563),
    textMuted: Color(0xFF9ca3af),
    danger: Color(0xFFdc2626),
    success: Color(0xFF059669),
    warning: Color(0xFFd97706),
    info: Color(0xFF2563eb),
  ),
  const AppTheme(
    id: 'light-offwhite',
    label: 'Off-White',
    icon: Icons.cloud,
    isLight: true,
    primaryBg: Color(0xFFf8f6f1),
    cardBg: Color(0xFFffffff),
    accent: Color(0xFFb8860b),
    accentLight: Color(0xFFd4a830),
    textPrimary: Color(0xFF1c1917),
    textSecondary: Color(0xFF57534e),
    textMuted: Color(0xFFa8a29e),
    danger: Color(0xFFdc2626),
    success: Color(0xFF059669),
    warning: Color(0xFFd97706),
    info: Color(0xFF2563eb),
  ),
  const AppTheme(
    id: 'light-grey',
    label: 'White Grey',
    icon: Icons.cloud_queue,
    isLight: true,
    primaryBg: Color(0xFFf1f5f9),
    cardBg: Color(0xFFffffff),
    accent: Color(0xFF475569),
    accentLight: Color(0xFF64748b),
    textPrimary: Color(0xFF0f172a),
    textSecondary: Color(0xFF475569),
    textMuted: Color(0xFF94a3b8),
    danger: Color(0xFFdc2626),
    success: Color(0xFF059669),
    warning: Color(0xFFd97706),
    info: Color(0xFF2563eb),
  ),
];

class ThemeProvider extends ChangeNotifier {
  static const _key = 'uv_theme';
  AppTheme _current = appThemes[0];

  ThemeProvider() {
    _load();
  }

  AppTheme get current => _current;

  ThemeData get currentTheme {
    final t = _current;
    return ThemeData(
      brightness: t.isLight ? Brightness.light : Brightness.dark,
      scaffoldBackgroundColor: t.primaryBg,
      primaryColor: t.accent,
      colorScheme: ColorScheme(
        brightness: t.isLight ? Brightness.light : Brightness.dark,
        primary: t.accent,
        onPrimary: t.isLight ? Colors.white : t.primaryBg,
        secondary: t.accentLight,
        onSecondary: t.primaryBg,
        error: t.danger,
        onError: Colors.white,
        surface: t.cardBg,
        onSurface: t.textPrimary,
      ),
      cardColor: t.cardBg,
      appBarTheme: AppBarTheme(
        backgroundColor: t.cardBg,
        foregroundColor: t.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: t.cardBg,
        selectedItemColor: t.accent,
        unselectedItemColor: t.textMuted,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: t.isLight ? t.primaryBg : t.primaryBg.withValues(alpha: 0.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: t.textMuted.withValues(alpha: 0.3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: t.textMuted.withValues(alpha: 0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: t.accent, width: 2),
        ),
        labelStyle: TextStyle(color: t.textSecondary),
        hintStyle: TextStyle(color: t.textMuted),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: t.accent,
          foregroundColor: t.isLight ? Colors.white : t.primaryBg,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      textTheme: TextTheme(
        headlineLarge: TextStyle(color: t.textPrimary, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: t.textPrimary, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: t.textPrimary, fontWeight: FontWeight.w700),
        titleMedium: TextStyle(color: t.textPrimary, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: t.textPrimary),
        bodyMedium: TextStyle(color: t.textSecondary),
        bodySmall: TextStyle(color: t.textMuted),
      ),
      dividerColor: t.textMuted.withValues(alpha: 0.2),
    );
  }

  void setTheme(String id) {
    final found = appThemes.firstWhere((t) => t.id == id, orElse: () => appThemes[0]);
    _current = found;
    notifyListeners();
    SharedPreferences.getInstance().then((p) => p.setString(_key, id));
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_key);
    if (saved != null) {
      _current = appThemes.firstWhere((t) => t.id == saved, orElse: () => appThemes[0]);
      notifyListeners();
    }
  }
}
