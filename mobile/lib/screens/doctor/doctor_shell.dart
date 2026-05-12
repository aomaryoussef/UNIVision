import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/theme_switcher.dart';
import 'students_screen.dart';
import 'schedule_manage_screen.dart';

class DoctorShell extends StatefulWidget {
  const DoctorShell({super.key});

  @override
  State<DoctorShell> createState() => _DoctorShellState();
}

class _DoctorShellState extends State<DoctorShell> {
  int _index = 0;

  final _pages = const [
    StudentsScreen(),
    ScheduleManageScreen(),
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
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('UniVision',
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: tp.accent)),
                Text(
                  '${auth.role == 'admin' ? 'Admin' : 'Doctor'} Dashboard',
                  style: TextStyle(fontSize: 11, color: tp.textMuted),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.palette_outlined),
            onPressed: () => ThemeSwitcherSheet.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
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
        height: 64,
        destinations: [
          NavigationDestination(
            icon: Icon(Icons.people,
                color: _index == 0 ? tp.accent : tp.textMuted),
            label: 'Students',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month,
                color: _index == 1 ? tp.accent : tp.textMuted),
            label: 'Schedule',
          ),
        ],
      ),
    );
  }
}
