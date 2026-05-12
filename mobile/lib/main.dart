import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/student/student_shell.dart';
import 'screens/doctor/doctor_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: const UniVisionApp(),
    ),
  );
}

class UniVisionApp extends StatelessWidget {
  const UniVisionApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProv = context.watch<ThemeProvider>();
    final authProv = context.watch<AuthProvider>();

    return MaterialApp(
      title: 'UniVision',
      debugShowCheckedModeBanner: false,
      theme: themeProv.currentTheme,
      home: _buildHome(authProv),
    );
  }

  Widget _buildHome(AuthProvider auth) {
    if (!auth.isLoggedIn) return const LoginScreen();
    if (auth.role == 'student') return const StudentShell();
    return const DoctorShell();
  }
}
