import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  List<dynamic>? _semesters;
  Map<String, dynamic>? _detail;
  int? _selectedSem;
  bool _loading = true;
  bool _loadingDetail = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final auth = context.read<AuthProvider>();
      final data = await ApiService.studentReports(auth.userId!);
      if (mounted) {
        setState(() { _semesters = data; _loading = false; });
        if (data.isNotEmpty) _loadDetail(data.last['semester_number']);
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _loadDetail(int sem) async {
    setState(() { _selectedSem = sem; _loadingDetail = true; });
    try {
      final auth = context.read<AuthProvider>();
      final data = await ApiService.studentReport(auth.userId!, sem);
      if (mounted) setState(() { _detail = data; _loadingDetail = false; });
    } catch (e) {
      if (mounted) setState(() { _loadingDetail = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView();
    if (_error != null) return ErrorView(message: _error!, onRetry: _load);

    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);
    final semesters = List<Map<String, dynamic>>.from(_semesters ?? []);

    return RefreshIndicator(
      onRefresh: _load,
      color: tp.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Academic Reports', style: theme.textTheme.titleLarge),
          const SizedBox(height: 16),

          // Semester selector
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.dividerColor),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                isExpanded: true,
                value: _selectedSem,
                dropdownColor: theme.cardColor,
                style: TextStyle(color: tp.textPrimary, fontSize: 14),
                items: semesters.map((s) {
                  return DropdownMenuItem<int>(
                    value: s['semester_number'],
                    child: Row(
                      children: [
                        Expanded(child: Text(s['label'] ?? 'Semester ${s['semester_number']}')),
                        Text('GPA: ${(s['gpa'] ?? 0).toStringAsFixed(2)}',
                            style: TextStyle(
                                color: tp.accent,
                                fontWeight: FontWeight.w700,
                                fontSize: 12)),
                      ],
                    ),
                  );
                }).toList(),
                onChanged: (v) {
                  if (v != null) _loadDetail(v);
                },
              ),
            ),
          ),

          const SizedBox(height: 16),

          if (_loadingDetail)
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: LoadingView(),
            )
          else if (_detail != null) ...[
            // Stats row
            Row(
              children: [
                _MiniStat(
                    label: 'GPA',
                    value: (_detail!['gpa'] ?? 0).toStringAsFixed(2),
                    color: tp.accent),
                _MiniStat(
                    label: 'Credits',
                    value: '${_detail!['credits'] ?? 0}',
                    color: tp.info),
                _MiniStat(
                    label: 'Attendance',
                    value: '${(_detail!['attendance_pct'] ?? 0).round()}%',
                    color: tp.success),
              ],
            ),
            const SizedBox(height: 16),

            // Courses table
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: tp.accent.withValues(alpha: 0.06),
                      borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(14)),
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 24),
                        Expanded(
                            flex: 3,
                            child: Text('Course',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: tp.textMuted))),
                        Expanded(
                            child: Text('Cr',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: tp.textMuted),
                                textAlign: TextAlign.center)),
                        Expanded(
                            child: Text('Grade',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: tp.textMuted),
                                textAlign: TextAlign.center)),
                      ],
                    ),
                  ),
                  // Rows
                  ...List<Map<String, dynamic>>.from(
                          _detail!['courses'] ?? [])
                      .asMap()
                      .entries
                      .map((e) {
                    final i = e.key;
                    final c = e.value;
                    return Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: theme.dividerColor),
                        ),
                      ),
                      child: Row(
                        children: [
                          SizedBox(
                              width: 24,
                              child: Text('${i + 1}',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: tp.textMuted))),
                          Expanded(
                            flex: 3,
                            child: Text(c['name'] ?? '',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: tp.textPrimary)),
                          ),
                          Expanded(
                            child: Text('${c['credits'] ?? 0}',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    fontSize: 13,
                                    color: tp.textSecondary)),
                          ),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: tp.accent.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(c['grade'] ?? '-',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: tp.accent)),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],

          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MiniStat(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: theme.dividerColor),
        ),
        child: Column(
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label, style: theme.textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
