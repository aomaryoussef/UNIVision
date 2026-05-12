import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
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
      final data = await ApiService.studentAttendance(auth.userId!);
      if (mounted) setState(() { _data = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView();
    if (_error != null) return ErrorView(message: _error!, onRetry: _load);

    final d = _data!;
    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);
    final overall = d['overall'] ?? {};
    final pct = (overall['percentage'] ?? 0).toDouble();
    final subjects = List<Map<String, dynamic>>.from(d['subjects'] ?? []);

    Color statusColor(double p) =>
        p >= 75 ? tp.success : p >= 60 ? tp.warning : tp.danger;

    return RefreshIndicator(
      onRefresh: _load,
      color: tp.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Overall card
          AppCard(
            child: Column(
              children: [
                Text('Overall Attendance', style: theme.textTheme.bodySmall),
                const SizedBox(height: 8),
                Text('${pct.round()}%',
                    style: theme.textTheme.headlineLarge
                        ?.copyWith(color: statusColor(pct), fontSize: 48)),
                const SizedBox(height: 4),
                Text(
                  '${overall['attended'] ?? 0} / ${overall['total'] ?? 0} classes',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                ProgressBar(
                  value: pct / 100,
                  color: statusColor(pct),
                  height: 10,
                ),
              ],
            ),
          ),

          SectionHeader(title: 'Per Course (${subjects.length})'),

          ...subjects.map((s) {
            final sp = (s['percentage'] ?? 0).toDouble();
            final att = s['attended'] ?? 0;
            final tot = s['total'] ?? 0;
            final status = s['status'] ?? '';
            final msg = s['message'] ?? '';
            final c = statusColor(sp);

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: theme.dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(s['course_name'] ?? '',
                            style: theme.textTheme.titleMedium
                                ?.copyWith(fontSize: 14)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: c.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(status,
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: c)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ProgressBar(value: sp / 100, color: c),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('$att / $tot',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: tp.textSecondary)),
                      Text('${sp.round()}%',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: c)),
                    ],
                  ),
                  if (msg.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(msg,
                        style:
                            TextStyle(fontSize: 11, color: tp.textMuted)),
                  ],
                ],
              ),
            );
          }),

          const SizedBox(height: 80),
        ],
      ),
    );
  }
}
