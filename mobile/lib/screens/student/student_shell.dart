import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/theme_switcher.dart';
import 'home_screen.dart';
import 'grades_screen.dart';
import 'attendance_screen.dart';
import 'schedule_screen.dart';
import 'reports_screen.dart';
import 'comparison_screen.dart';
import 'profile_screen.dart';

class StudentShell extends StatefulWidget {
  const StudentShell({super.key});

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends State<StudentShell> {
  int _index = 0;

  final _pages = const [
    HomeScreen(),
    GradesScreen(),
    AttendanceScreen(),
    ComparisonScreen(),
    ReportsScreen(),
    ScheduleScreen(),
    ProfileScreen(),
  ];

  final _labels = const [
    'Home',
    'Grades',
    'Attendance',
    'Compare',
    'Reports',
    'Schedule',
    'Profile',
  ];

  final _icons = const [
    Icons.home_rounded,
    Icons.grade_rounded,
    Icons.fact_check_rounded,
    Icons.bar_chart_rounded,
    Icons.description_rounded,
    Icons.calendar_month_rounded,
    Icons.person_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.school, color: tp.accent, size: 28),
            const SizedBox(width: 10),
            Text('UniVision',
                style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                    color: tp.accent)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.palette_outlined),
            tooltip: 'Theme',
            onPressed: () => ThemeSwitcherSheet.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Logout',
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: theme.cardColor,
        indicatorColor: tp.accent.withValues(alpha: 0.15),
        height: 70,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: List.generate(
          _labels.length,
          (i) => NavigationDestination(
            icon: Icon(_icons[i],
                color: _index == i ? tp.accent : tp.textMuted, size: 22),
            label: _labels[i],
          ),
        ),
      ),
    );
  }
}
