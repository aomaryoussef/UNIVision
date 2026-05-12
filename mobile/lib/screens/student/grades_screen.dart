import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class GradesScreen extends StatefulWidget {
  const GradesScreen({super.key});

  @override
  State<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends State<GradesScreen> {
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
      final data = await ApiService.studentGrades(auth.userId!);
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
    final gpa = (d['currentGPA'] ?? 0).toDouble();
    final subjects = List<Map<String, dynamic>>.from(d['subjects'] ?? []);
    final feedback = List<Map<String, dynamic>>.from(d['feedback'] ?? []);

    return RefreshIndicator(
      onRefresh: _load,
      color: tp.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // GPA Banner
          AppCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: tp.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.grade, color: tp.accent, size: 28),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Current GPA', style: theme.textTheme.bodySmall),
                    Text(gpa.toStringAsFixed(2),
                        style: theme.textTheme.headlineMedium
                            ?.copyWith(color: tp.accent)),
                  ],
                ),
              ],
            ),
          ),

          // Subjects
          SectionHeader(title: 'Courses (${subjects.length})'),
          ...subjects.map((s) => _SubjectCard(subject: s)),

          // Feedback
          if (feedback.isNotEmpty) ...[
            SectionHeader(title: 'Doctor Feedback'),
            ...feedback.map((f) => _FeedbackCard(feedback: f)),
          ],

          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

class _SubjectCard extends StatelessWidget {
  final Map<String, dynamic> subject;
  const _SubjectCard({required this.subject});

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);
    final s = subject;
    final isDanger = s['danger'] == 1 || s['danger'] == true;
    final grade = s['grade'] ?? '-';
    final preFinal = (s['preFinal'] ?? 0).toDouble();
    final maxPreFinal = (s['maxPreFinal'] ?? 60).toDouble();
    final breakdown = s['breakdown'] as Map<String, dynamic>? ?? {};
    final nextTarget = s['nextTarget'] as Map<String, dynamic>?;
    final staff = s['staff'] as Map<String, dynamic>?;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDanger
              ? tp.danger.withValues(alpha: 0.4)
              : theme.dividerColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Expanded(
                child: Text(s['name'] ?? '',
                    style: theme.textTheme.titleMedium),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: isDanger
                      ? tp.danger.withValues(alpha: 0.15)
                      : tp.accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(grade,
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: isDanger ? tp.danger : tp.accent,
                        fontSize: 15)),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Breakdown grid
          _BreakdownRow(breakdown: breakdown, tp: tp),
          const SizedBox(height: 12),

          // Pre-final bar
          ProgressBar(
            value: maxPreFinal > 0 ? preFinal / maxPreFinal : 0,
            color: isDanger ? tp.danger : tp.accent,
            label: 'Pre-Final: ${preFinal.toStringAsFixed(1)} / ${maxPreFinal.toStringAsFixed(0)}',
          ),

          // Next target
          if (nextTarget != null && nextTarget['label'] != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: tp.info.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.flag, size: 14, color: tp.info),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Target for ${nextTarget['label']}: ${nextTarget['need']}',
                      style: TextStyle(fontSize: 12, color: tp.info),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Staff
          if (staff != null) ...[
            const SizedBox(height: 10),
            Divider(color: theme.dividerColor),
            const SizedBox(height: 4),
            if (staff['doctor_name'] != null)
              _StaffRow(
                  icon: Icons.person, label: staff['doctor_name'], tp: tp),
            if (staff['assistant_name'] != null)
              _StaffRow(
                  icon: Icons.person_outline,
                  label: staff['assistant_name'],
                  tp: tp),
          ],
        ],
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  final Map<String, dynamic> breakdown;
  final AppTheme tp;
  const _BreakdownRow({required this.breakdown, required this.tp});

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Att', breakdown['attendance']),
      ('Mid', breakdown['midterm']),
      ('Q1', breakdown['quiz1']),
      ('Q2', breakdown['quiz2']),
    ];

    return Row(
      children: items.map((item) {
        final val = item.$2;
        final text = val is Map
            ? '${val['got'] ?? '-'}/${val['max'] ?? '-'}'
            : '${val ?? '-'}';
        return Expanded(
          child: Column(
            children: [
              Text(item.$1,
                  style: TextStyle(
                      fontSize: 10,
                      color: tp.textMuted,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(text,
                  style: TextStyle(
                      fontSize: 13,
                      color: tp.textPrimary,
                      fontWeight: FontWeight.w700)),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _StaffRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final AppTheme tp;
  const _StaffRow(
      {required this.icon, required this.label, required this.tp});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 14, color: tp.textMuted),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(fontSize: 12, color: tp.textSecondary)),
        ],
      ),
    );
  }
}

class _FeedbackCard extends StatelessWidget {
  final Map<String, dynamic> feedback;
  const _FeedbackCard({required this.feedback});

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);
    final isDanger = feedback['danger'] == 1 || feedback['danger'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDanger
            ? tp.danger.withValues(alpha: 0.06)
            : theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDanger
              ? tp.danger.withValues(alpha: 0.3)
              : theme.dividerColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.comment, size: 16, color: tp.accent),
              const SizedBox(width: 8),
              Expanded(
                child: Text(feedback['doctor'] ?? '',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: tp.textPrimary,
                        fontSize: 13)),
              ),
              Text(feedback['subject'] ?? '',
                  style: TextStyle(fontSize: 11, color: tp.textMuted)),
            ],
          ),
          const SizedBox(height: 8),
          Text(feedback['text'] ?? '',
              style: TextStyle(fontSize: 13, color: tp.textSecondary)),
          const SizedBox(height: 4),
          Text(feedback['created_at'] ?? '',
              style: TextStyle(fontSize: 10, color: tp.textMuted)),
        ],
      ),
    );
  }
}
