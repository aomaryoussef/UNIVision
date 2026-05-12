import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class ComparisonScreen extends StatefulWidget {
  const ComparisonScreen({super.key});

  @override
  State<ComparisonScreen> createState() => _ComparisonScreenState();
}

class _ComparisonScreenState extends State<ComparisonScreen> {
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
      final data = await ApiService.studentComparison(auth.userId!);
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
    final gpa = d['gpa'] as Map<String, dynamic>? ?? {};
    final att = d['attendance'] as Map<String, dynamic>? ?? {};
    final courses = List<Map<String, dynamic>>.from(d['courses'] ?? []);
    final gpaTrend = List<Map<String, dynamic>>.from(d['gpaTrend'] ?? []);

    return RefreshIndicator(
      onRefresh: _load,
      color: tp.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Performance Comparison', style: theme.textTheme.titleLarge),
          Text('Grade ${d['grade']} — ${d['peerCount']} peers',
              style: theme.textTheme.bodySmall),
          const SizedBox(height: 16),

          // Overview stats
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'Your GPA',
                  value: (gpa['mine'] ?? 0).toStringAsFixed(2),
                  icon: Icons.trending_up,
                  iconColor: tp.accent,
                  subtitle: 'Avg: ${(gpa['classAvg'] ?? 0).toStringAsFixed(2)}',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatCard(
                  label: 'GPA Rank',
                  value: '#${gpa['rank'] ?? '-'}',
                  icon: Icons.leaderboard,
                  iconColor: tp.warning,
                  subtitle: 'Top ${gpa['percentile'] ?? '-'}%',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'Attendance',
                  value: '${(att['mine'] ?? 0).round()}%',
                  icon: Icons.fact_check,
                  iconColor: tp.success,
                  subtitle: 'Avg: ${(att['classAvg'] ?? 0).round()}%',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatCard(
                  label: 'Att. Rank',
                  value: '#${att['rank'] ?? '-'}',
                  icon: Icons.emoji_events,
                  iconColor: tp.info,
                ),
              ),
            ],
          ),

          // GPA Trend chart
          if (gpaTrend.length > 1) ...[
            SectionHeader(title: 'GPA Trend'),
            AppCard(
              child: SizedBox(
                height: 200,
                child: LineChart(
                  LineChartData(
                    gridData: FlGridData(
                      show: true,
                      drawVerticalLine: false,
                      getDrawingHorizontalLine: (_) =>
                          FlLine(color: theme.dividerColor, strokeWidth: 0.5),
                    ),
                    titlesData: FlTitlesData(
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 30,
                          getTitlesWidget: (v, _) => Text(
                            v.toStringAsFixed(1),
                            style: TextStyle(fontSize: 10, color: tp.textMuted),
                          ),
                        ),
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (v, _) {
                            final i = v.toInt();
                            if (i < 0 || i >= gpaTrend.length) {
                              return const SizedBox();
                            }
                            return Text('S${gpaTrend[i]['semester']}',
                                style: TextStyle(
                                    fontSize: 10, color: tp.textMuted));
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
                        spots: gpaTrend.asMap().entries.map((e) =>
                            FlSpot(e.key.toDouble(),
                                (e.value['myGPA'] ?? 0).toDouble())).toList(),
                        isCurved: true,
                        color: tp.accent,
                        barWidth: 3,
                        dotData: const FlDotData(show: true),
                      ),
                      LineChartBarData(
                        spots: gpaTrend.asMap().entries.map((e) =>
                            FlSpot(e.key.toDouble(),
                                (e.value['classAvg'] ?? 0).toDouble())).toList(),
                        isCurved: true,
                        color: tp.textMuted,
                        barWidth: 2,
                        dashArray: [5, 3],
                        dotData: const FlDotData(show: false),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _Legend(color: tp.accent, label: 'Your GPA'),
                  const SizedBox(width: 20),
                  _Legend(color: tp.textMuted, label: 'Class Avg'),
                ],
              ),
            ),
          ],

          // Per-course comparison
          if (courses.isNotEmpty) ...[
            SectionHeader(title: 'Course Comparison'),
            ...courses.map((c) {
              final my = (c['myScore'] ?? 0).toDouble();
              final avg = (c['classAvg'] ?? 0).toDouble();
              final max = (c['classMax'] ?? 100).toDouble();
              final diff = my - avg;

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
                          child: Text(c['course'] ?? '',
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(fontSize: 14)),
                        ),
                        Text(
                          '${diff >= 0 ? '+' : ''}${diff.toStringAsFixed(1)}',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: diff >= 0 ? tp.success : tp.danger,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _CompBar(label: 'You', value: my, maxVal: max,
                        color: tp.accent, tp: tp),
                    const SizedBox(height: 4),
                    _CompBar(label: 'Avg', value: avg, maxVal: max,
                        color: tp.textMuted, tp: tp),
                    const SizedBox(height: 4),
                    _CompBar(label: 'Top', value: max, maxVal: max,
                        color: tp.success.withValues(alpha: 0.5), tp: tp),
                    const SizedBox(height: 4),
                    Text(
                        'Rank: #${c['rank']} / ${c['totalStudents']}',
                        style: TextStyle(
                            fontSize: 11, color: tp.textMuted)),
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
}

class _CompBar extends StatelessWidget {
  final String label;
  final double value;
  final double maxVal;
  final Color color;
  final AppTheme tp;
  const _CompBar({
    required this.label,
    required this.value,
    required this.maxVal,
    required this.color,
    required this.tp,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
            width: 28,
            child: Text(label,
                style: TextStyle(fontSize: 10, color: tp.textMuted))),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: maxVal > 0 ? value / maxVal : 0),
              duration: const Duration(milliseconds: 600),
              builder: (_, v, __) => LinearProgressIndicator(
                value: v.clamp(0.0, 1.0),
                minHeight: 6,
                backgroundColor: Theme.of(context).dividerColor,
                valueColor: AlwaysStoppedAnimation(color),
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        SizedBox(
            width: 32,
            child: Text(value.toStringAsFixed(0),
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: tp.textSecondary),
                textAlign: TextAlign.right)),
      ],
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
            width: 10, height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label,
            style: TextStyle(
                fontSize: 11,
                color: Theme.of(context).textTheme.bodySmall?.color)),
      ],
    );
  }
}
