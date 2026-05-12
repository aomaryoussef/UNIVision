import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthProvider>();
      final data = await ApiService.studentHome(auth.userId!);
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
    final auth = context.read<AuthProvider>();
    final gpa = (d['cumulativeGPA'] ?? 0).toDouble();
    final att = d['attendance'] ?? {};
    final attPct = (att['percentage'] ?? 0).toDouble();
    final attended = att['attended'] ?? 0;
    final total = att['total'] ?? 0;
    final alerts = List<Map<String, dynamic>>.from(d['alerts'] ?? []);
    final gpaHistory = List<Map<String, dynamic>>.from(d['gpaHistory'] ?? []);
    final topStudents = List<Map<String, dynamic>>.from(d['topStudents'] ?? []);

    return RefreshIndicator(
      onRefresh: _load,
      color: tp.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Welcome
          Text('Welcome back,',
              style: theme.textTheme.bodyMedium),
          Text(auth.name ?? 'Student',
              style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('ID: ${auth.userId}',
              style: theme.textTheme.bodySmall),

          // Alerts
          if (alerts.isNotEmpty) ...[
            const SizedBox(height: 16),
            ...alerts.map((a) => _AlertBanner(alert: a)),
          ],

          // Stats
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'Cumulative GPA',
                  value: gpa.toStringAsFixed(2),
                  icon: Icons.trending_up,
                  iconColor: tp.accent,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatCard(
                  label: 'Attendance',
                  value: '${attPct.round()}%',
                  icon: Icons.fact_check,
                  iconColor: attPct >= 75
                      ? tp.success
                      : attPct >= 60
                          ? tp.warning
                          : tp.danger,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          StatCard(
            label: 'Classes Attended',
            value: '$attended / $total',
            icon: Icons.school,
            iconColor: tp.info,
          ),

          // GPA Chart
          if (gpaHistory.length > 1) ...[
            SectionHeader(title: 'GPA Progress'),
            AppCard(
              child: SizedBox(
                height: 200,
                child: LineChart(
                  LineChartData(
                    gridData: FlGridData(
                      show: true,
                      drawVerticalLine: false,
                      getDrawingHorizontalLine: (_) => FlLine(
                        color: theme.dividerColor,
                        strokeWidth: 0.5,
                      ),
                    ),
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 30,
                          getTitlesWidget: (v, _) => Text(
                            v.toStringAsFixed(1),
                            style: TextStyle(
                                fontSize: 10, color: tp.textMuted),
                          ),
                        ),
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (v, _) {
                            final i = v.toInt();
                            if (i < 0 || i >= gpaHistory.length) {
                              return const SizedBox();
                            }
                            return Text(
                              'S${gpaHistory[i]['semester_number']}',
                              style: TextStyle(
                                  fontSize: 10, color: tp.textMuted),
                            );
                          },
                        ),
                      ),
                      topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false)),
                      rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false)),
                    ),
                    borderData: FlBorderData(show: false),
                    minY: 0,
                    maxY: 4,
                    lineBarsData: [
                      LineChartBarData(
                        spots: gpaHistory.asMap().entries.map((e) {
                          return FlSpot(e.key.toDouble(),
                              (e.value['gpa'] ?? 0).toDouble());
                        }).toList(),
                        isCurved: true,
                        color: tp.accent,
                        barWidth: 3,
                        dotData: FlDotData(
                          show: true,
                          getDotPainter: (_, __, ___, ____) =>
                              FlDotCirclePainter(
                            radius: 4,
                            color: tp.accent,
                            strokeWidth: 2,
                            strokeColor: tp.cardBg,
                          ),
                        ),
                        belowBarData: BarAreaData(
                          show: true,
                          color: tp.accent.withValues(alpha: 0.1),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],

          // GPA History bars
          if (gpaHistory.isNotEmpty) ...[
            SectionHeader(title: 'GPA History'),
            ...gpaHistory.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: ProgressBar(
                    value: ((s['gpa'] ?? 0).toDouble()) / 4.0,
                    color: tp.accent,
                    label:
                        '${s['label'] ?? 'Semester ${s['semester_number']}'} — ${(s['gpa'] ?? 0).toStringAsFixed(2)}',
                  ),
                )),
          ],

          // Top Achievers
          if (topStudents.isNotEmpty) ...[
            SectionHeader(title: 'Top Achievers'),
            AppCard(
              child: Column(
                children: topStudents.asMap().entries.map((e) {
                  final i = e.key;
                  final s = e.value;
                  final isYou =
                      s['student_id'].toString() == auth.userId;
                  final medals = ['🥇', '🥈', '🥉'];
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        Text(
                          i < 3 ? medals[i] : '${i + 1}',
                          style: TextStyle(
                              fontSize: i < 3 ? 20 : 14,
                              fontWeight: FontWeight.w700,
                              color: tp.textMuted),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '${s['name_en']}${isYou ? '  (YOU)' : ''}',
                            style: TextStyle(
                              fontWeight:
                                  isYou ? FontWeight.w800 : FontWeight.w500,
                              color: isYou
                                  ? tp.accent
                                  : tp.textPrimary,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        Text(
                          (s['gpa'] ?? 0).toStringAsFixed(2),
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: tp.accent,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],

          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

class _AlertBanner extends StatelessWidget {
  final Map<String, dynamic> alert;
  const _AlertBanner({required this.alert});

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<ThemeProvider>().current;
    final type = alert['type'] ?? 'warning';
    final color = type == 'danger' ? tp.danger : tp.warning;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(
            type == 'danger' ? Icons.error : Icons.warning_amber,
            color: color,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(alert['title'] ?? '',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: color)),
                Text(alert['message'] ?? '',
                    style: TextStyle(fontSize: 12, color: tp.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
