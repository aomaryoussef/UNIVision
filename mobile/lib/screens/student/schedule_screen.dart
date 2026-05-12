import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  List<dynamic>? _data;
  bool _loading = true;
  String? _error;

  final _dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final auth = context.read<AuthProvider>();
      final data = await ApiService.studentSchedule(auth.userId!);
      if (mounted) setState(() { _data = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView();
    if (_error != null) return ErrorView(message: _error!, onRetry: _load);

    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);
    final entries = List<Map<String, dynamic>>.from(_data ?? []);

    // Group by day
    final Map<String, List<Map<String, dynamic>>> grouped = {};
    for (final day in _dayOrder) {
      grouped[day] = entries.where((e) => e['day'] == day).toList();
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: tp.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Class Schedule', style: theme.textTheme.titleLarge),
          const SizedBox(height: 16),

          for (final day in _dayOrder)
            if (grouped[day]!.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 8),
                child: Text(day,
                    style: theme.textTheme.titleMedium
                        ?.copyWith(color: tp.accent)),
              ),
              ...grouped[day]!.map((slot) {
                final type = (slot['type'] ?? 'Lecture').toString();
                final typeColor = type == 'Lab'
                    ? tp.success
                    : type == 'Tutorial'
                        ? tp.info
                        : tp.accent;

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Row(
                    children: [
                      // Time
                      Column(
                        children: [
                          Text(_formatTime(slot['start_time']),
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                  color: tp.textPrimary)),
                          Text(_formatTime(slot['end_time']),
                              style: TextStyle(
                                  fontSize: 11, color: tp.textMuted)),
                        ],
                      ),
                      Container(
                        width: 3,
                        height: 40,
                        margin: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: typeColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(slot['course_name'] ?? '',
                                style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                    color: tp.textPrimary)),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(Icons.location_on,
                                    size: 12, color: tp.textMuted),
                                const SizedBox(width: 3),
                                Text(slot['location'] ?? '',
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: tp.textMuted)),
                                const SizedBox(width: 10),
                                Icon(Icons.person,
                                    size: 12, color: tp.textMuted),
                                const SizedBox(width: 3),
                                Expanded(
                                  child: Text(
                                      slot['doctor_name'] ?? '',
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: tp.textMuted),
                                      overflow: TextOverflow.ellipsis),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: typeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(type,
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: typeColor)),
                      ),
                    ],
                  ),
                );
              }),
            ],

          const SizedBox(height: 80),
        ],
      ),
    );
  }

  String _formatTime(String? time) {
    if (time == null) return '';
    try {
      final parts = time.split(':');
      var h = int.parse(parts[0]);
      final m = parts[1];
      final ampm = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h == 0) h = 12;
      return '$h:$m $ampm';
    } catch (_) {
      return time;
    }
  }
}
