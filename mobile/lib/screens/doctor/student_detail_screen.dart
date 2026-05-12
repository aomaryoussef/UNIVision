import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class StudentDetailScreen extends StatefulWidget {
  final String studentId;
  const StudentDetailScreen({super.key, required this.studentId});

  @override
  State<StudentDetailScreen> createState() => _StudentDetailScreenState();
}

class _StudentDetailScreenState extends State<StudentDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  Map<String, dynamic>? _student;
  List<Map<String, dynamic>> _grades = [];
  List<Map<String, dynamic>> _attendance = [];
  List<Map<String, dynamic>> _feedback = [];
  List<Map<String, dynamic>> _adminFeedback = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        ApiService.doctorGetStudent(widget.studentId),
        ApiService.doctorGetGrades(widget.studentId),
        ApiService.doctorGetAttendance(widget.studentId),
        ApiService.doctorGetFeedback(widget.studentId),
        ApiService.doctorGetAdminFeedback(widget.studentId),
      ]);
      if (mounted) {
        setState(() {
          _student = results[0] as Map<String, dynamic>;
          _grades = List<Map<String, dynamic>>.from(results[1] as List);
          _attendance = List<Map<String, dynamic>>.from(results[2] as List);
          _feedback = List<Map<String, dynamic>>.from(results[3] as List);
          _adminFeedback = List<Map<String, dynamic>>.from(results[4] as List);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);
    final isAdmin = context.read<AuthProvider>().role == 'admin';

    return Scaffold(
      appBar: AppBar(
        title: Text(_student?['profile']?['name_en'] ?? 'Student',
            style: const TextStyle(fontSize: 16)),
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: tp.accent,
          unselectedLabelColor: tp.textMuted,
          indicatorColor: tp.accent,
          tabs: const [
            Tab(text: 'Grades'),
            Tab(text: 'Attendance'),
            Tab(text: 'Feedback'),
          ],
        ),
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : Column(
                  children: [
                    // Student header
                    _StudentHeader(student: _student!, tp: tp),
                    Expanded(
                      child: TabBarView(
                        controller: _tabCtrl,
                        children: [
                          _GradesTab(
                            grades: _grades,
                            studentId: widget.studentId,
                            tp: tp,
                            onRefresh: _load,
                          ),
                          _AttendanceTab(
                            attendance: _attendance,
                            studentId: widget.studentId,
                            tp: tp,
                            onRefresh: _load,
                          ),
                          _FeedbackTab(
                            feedback: _feedback,
                            adminFeedback: _adminFeedback,
                            studentId: widget.studentId,
                            isAdmin: isAdmin,
                            tp: tp,
                            onRefresh: _load,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }
}

class _StudentHeader extends StatelessWidget {
  final Map<String, dynamic> student;
  final AppTheme tp;
  const _StudentHeader({required this.student, required this.tp});

  @override
  Widget build(BuildContext context) {
    final profile = student['profile'] as Map<String, dynamic>? ?? {};
    final gpa = student['gpa'];
    final att = student['attendance'] as Map<String, dynamic>? ?? {};

    return Container(
      padding: const EdgeInsets.all(16),
      color: Theme.of(context).cardColor,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: tp.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.person, color: tp.accent, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile['name_en'] ?? '',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: tp.textPrimary,
                        fontSize: 15)),
                Text('ID: ${profile['student_id'] ?? profile['id'] ?? ''}',
                    style: TextStyle(fontSize: 12, color: tp.textMuted)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('GPA: ${gpa ?? '-'}',
                  style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: tp.accent,
                      fontSize: 14)),
              Text('Att: ${(att['percentage'] ?? 0).round()}%',
                  style: TextStyle(fontSize: 12, color: tp.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Grades Tab ──────────────────────────────────
class _GradesTab extends StatelessWidget {
  final List<Map<String, dynamic>> grades;
  final String studentId;
  final AppTheme tp;
  final VoidCallback onRefresh;

  const _GradesTab({
    required this.grades,
    required this.studentId,
    required this.tp,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Text('Grades (${grades.length})',
                style: theme.textTheme.titleMedium),
            const Spacer(),
            IconButton(
              icon: Icon(Icons.add_circle, color: tp.accent),
              onPressed: () => _showGradeForm(context),
            ),
          ],
        ),
        ...grades.map((g) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: (g['is_danger'] == 1)
                      ? tp.danger.withValues(alpha: 0.3)
                      : theme.dividerColor,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(g['course_name'] ?? '',
                            style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: tp.textPrimary)),
                        const SizedBox(height: 4),
                        Text(
                          'Pre-Final: ${g['pre_final'] ?? '-'} | Att: ${g['att_score'] ?? 0}/${g['att_max'] ?? 0}',
                          style:
                              TextStyle(fontSize: 11, color: tp.textMuted),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: tp.accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(g['grade'] ?? '-',
                        style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: tp.accent,
                            fontSize: 14)),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: Icon(Icons.delete_outline,
                        color: tp.danger, size: 20),
                    onPressed: () async {
                      try {
                        await ApiService.doctorDeleteGrade(g['id']);
                        onRefresh();
                      } catch (_) {}
                    },
                  ),
                ],
              ),
            )),
      ],
    );
  }

  void _showGradeForm(BuildContext context) {
    final courseCtrl = TextEditingController();
    String grade = 'A';
    final attGot = TextEditingController();
    final attMax = TextEditingController();
    final midGot = TextEditingController();
    final midMax = TextEditingController();
    final q1Got = TextEditingController();
    final q1Max = TextEditingController();
    final q2Got = TextEditingController();
    final q2Max = TextEditingController();
    bool isDanger = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding: EdgeInsets.fromLTRB(
              20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Add Grade', style: Theme.of(ctx).textTheme.titleLarge),
                const SizedBox(height: 12),
                TextField(
                    controller: courseCtrl,
                    decoration:
                        const InputDecoration(labelText: 'Course Name')),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: grade,
                  decoration: const InputDecoration(labelText: 'Grade'),
                  dropdownColor: Theme.of(ctx).cardColor,
                  items: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F']
                      .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                      .toList(),
                  onChanged: (v) => setS(() => grade = v ?? 'A'),
                ),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                      child: TextField(
                          controller: attGot,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Att Got'))),
                  const SizedBox(width: 8),
                  Expanded(
                      child: TextField(
                          controller: attMax,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Att Max'))),
                ]),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                      child: TextField(
                          controller: midGot,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Mid Got'))),
                  const SizedBox(width: 8),
                  Expanded(
                      child: TextField(
                          controller: midMax,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Mid Max'))),
                ]),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                      child: TextField(
                          controller: q1Got,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Q1 Got'))),
                  const SizedBox(width: 8),
                  Expanded(
                      child: TextField(
                          controller: q1Max,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Q1 Max'))),
                ]),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                      child: TextField(
                          controller: q2Got,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Q2 Got'))),
                  const SizedBox(width: 8),
                  Expanded(
                      child: TextField(
                          controller: q2Max,
                          keyboardType: TextInputType.number,
                          decoration:
                              const InputDecoration(labelText: 'Q2 Max'))),
                ]),
                const SizedBox(height: 8),
                CheckboxListTile(
                  value: isDanger,
                  onChanged: (v) => setS(() => isDanger = v ?? false),
                  title: Text('At Risk',
                      style: TextStyle(color: tp.danger, fontSize: 14)),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () async {
                    if (courseCtrl.text.isEmpty) return;
                    try {
                      await ApiService.doctorSaveGrade(studentId, {
                        'course_name': courseCtrl.text,
                        'grade': grade,
                        'att_score': int.tryParse(attGot.text) ?? 0,
                        'att_max': int.tryParse(attMax.text) ?? 0,
                        'midterm_score': int.tryParse(midGot.text) ?? 0,
                        'midterm_max': int.tryParse(midMax.text) ?? 0,
                        'quiz1_score': int.tryParse(q1Got.text) ?? 0,
                        'quiz1_max': int.tryParse(q1Max.text) ?? 0,
                        'quiz2_score': int.tryParse(q2Got.text) ?? 0,
                        'quiz2_max': int.tryParse(q2Max.text) ?? 0,
                        'is_danger': isDanger ? 1 : 0,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      onRefresh();
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text('Error: $e')));
                      }
                    }
                  },
                  child: const Text('Save Grade'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Attendance Tab ──────────────────────────────
class _AttendanceTab extends StatelessWidget {
  final List<Map<String, dynamic>> attendance;
  final String studentId;
  final AppTheme tp;
  final VoidCallback onRefresh;

  const _AttendanceTab({
    required this.attendance,
    required this.studentId,
    required this.tp,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Text('Attendance (${attendance.length})',
                style: theme.textTheme.titleMedium),
            const Spacer(),
            IconButton(
              icon: Icon(Icons.add_circle, color: tp.accent),
              onPressed: () => _showAttForm(context),
            ),
          ],
        ),
        ...attendance.map((a) {
          final pct =
              (a['total'] ?? 0) > 0 ? (a['attended'] / a['total']) * 100 : 0.0;
          final c = pct >= 75
              ? tp.success
              : pct >= 60
                  ? tp.warning
                  : tp.danger;

          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: theme.dividerColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(a['course_name'] ?? '',
                          style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                              color: tp.textPrimary)),
                    ),
                    Text('${pct.round()}%',
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: c,
                            fontSize: 14)),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(Icons.delete_outline,
                          color: tp.danger, size: 20),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                      onPressed: () async {
                        try {
                          await ApiService.doctorDeleteAttendance(a['id']);
                          onRefresh();
                        } catch (_) {}
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ProgressBar(
                    value: pct / 100, color: c, height: 6),
                const SizedBox(height: 4),
                Text('${a['attended']} / ${a['total']}',
                    style: TextStyle(fontSize: 11, color: tp.textMuted)),
              ],
            ),
          );
        }),
      ],
    );
  }

  void _showAttForm(BuildContext context) {
    final courseCtrl = TextEditingController();
    final attCtrl = TextEditingController();
    final totCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Add Attendance', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextField(
                controller: courseCtrl,
                decoration: const InputDecoration(labelText: 'Course Name')),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                  child: TextField(
                      controller: attCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Attended'))),
              const SizedBox(width: 8),
              Expanded(
                  child: TextField(
                      controller: totCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Total'))),
            ]),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                if (courseCtrl.text.isEmpty) return;
                try {
                  await ApiService.doctorSaveAttendance(studentId, {
                    'course_name': courseCtrl.text,
                    'attended': int.tryParse(attCtrl.text) ?? 0,
                    'total': int.tryParse(totCtrl.text) ?? 0,
                  });
                  if (ctx.mounted) Navigator.pop(ctx);
                  onRefresh();
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx)
                        .showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              },
              child: const Text('Save Attendance'),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Feedback Tab ────────────────────────────────
class _FeedbackTab extends StatelessWidget {
  final List<Map<String, dynamic>> feedback;
  final List<Map<String, dynamic>> adminFeedback;
  final String studentId;
  final bool isAdmin;
  final AppTheme tp;
  final VoidCallback onRefresh;

  const _FeedbackTab({
    required this.feedback,
    required this.adminFeedback,
    required this.studentId,
    required this.isAdmin,
    required this.tp,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Text('Feedback', style: theme.textTheme.titleMedium),
            const Spacer(),
            IconButton(
              icon: Icon(Icons.add_circle, color: tp.accent),
              onPressed: () => _showFeedbackForm(context),
            ),
          ],
        ),

        // Student feedback
        ...feedback.map((f) => _FbCard(
              fb: f,
              tp: tp,
              isAdminFb: false,
              onDelete: () async {
                try {
                  await ApiService.doctorDeleteFeedback(f['id']);
                  onRefresh();
                } catch (_) {}
              },
            )),

        // Admin feedback
        if (adminFeedback.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(top: 16, bottom: 8),
            child: Text('Admin Feedback',
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: tp.info,
                    fontSize: 15)),
          ),
          ...adminFeedback.map((f) => _FbCard(
                fb: f,
                tp: tp,
                isAdminFb: true,
                onDelete: isAdmin
                    ? () async {
                        try {
                          await ApiService.doctorDeleteAdminFeedback(f['id']);
                          onRefresh();
                        } catch (_) {}
                      }
                    : null,
              )),
        ],
      ],
    );
  }

  void _showFeedbackForm(BuildContext context) {
    final courseCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();
    bool isDanger = false;
    String sendTo = 'student';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding: EdgeInsets.fromLTRB(
              20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Add Feedback',
                  style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 12),
              TextField(
                  controller: courseCtrl,
                  decoration:
                      const InputDecoration(labelText: 'Course Name')),
              const SizedBox(height: 8),
              if (isAdmin)
                DropdownButtonFormField<String>(
                  value: sendTo,
                  decoration: const InputDecoration(labelText: 'Send To'),
                  dropdownColor: Theme.of(ctx).cardColor,
                  items: const [
                    DropdownMenuItem(value: 'student', child: Text('Student')),
                    DropdownMenuItem(
                        value: 'doctor', child: Text('Doctor Only')),
                  ],
                  onChanged: (v) => setS(() => sendTo = v ?? 'student'),
                ),
              const SizedBox(height: 8),
              TextField(
                controller: bodyCtrl,
                maxLines: 3,
                decoration:
                    const InputDecoration(labelText: 'Feedback Message'),
              ),
              const SizedBox(height: 8),
              CheckboxListTile(
                value: isDanger,
                onChanged: (v) => setS(() => isDanger = v ?? false),
                title: Text(sendTo == 'doctor' ? 'Urgent' : 'Flagged',
                    style: TextStyle(color: tp.danger, fontSize: 14)),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () async {
                  if (courseCtrl.text.isEmpty || bodyCtrl.text.isEmpty) return;
                  try {
                    if (sendTo == 'doctor' && isAdmin) {
                      await ApiService.doctorSendAdminFeedback(studentId, {
                        'course_name': courseCtrl.text,
                        'body': bodyCtrl.text,
                        'is_urgent': isDanger ? 1 : 0,
                      });
                    } else {
                      await ApiService.doctorAddFeedback(studentId, {
                        'course_name': courseCtrl.text,
                        'body': bodyCtrl.text,
                        'is_danger': isDanger ? 1 : 0,
                      });
                    }
                    if (ctx.mounted) Navigator.pop(ctx);
                    onRefresh();
                  } catch (e) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx)
                          .showSnackBar(SnackBar(content: Text('Error: $e')));
                    }
                  }
                },
                child: const Text('Send Feedback'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FbCard extends StatelessWidget {
  final Map<String, dynamic> fb;
  final AppTheme tp;
  final bool isAdminFb;
  final VoidCallback? onDelete;

  const _FbCard({
    required this.fb,
    required this.tp,
    required this.isAdminFb,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDanger = (fb['is_danger'] ?? fb['is_urgent'] ?? 0) == 1;
    final borderColor = isAdminFb
        ? tp.info.withValues(alpha: 0.3)
        : isDanger
            ? tp.danger.withValues(alpha: 0.3)
            : theme.dividerColor;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isAdminFb
            ? tp.info.withValues(alpha: 0.04)
            : theme.cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isAdminFb ? Icons.admin_panel_settings : Icons.comment,
                size: 16,
                color: isAdminFb ? tp.info : tp.accent,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  fb['course_name'] ?? '',
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: tp.textPrimary),
                ),
              ),
              if (isDanger)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: tp.danger.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(isAdminFb ? 'URGENT' : 'FLAGGED',
                      style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: tp.danger)),
                ),
              if (onDelete != null) ...[
                const SizedBox(width: 4),
                IconButton(
                  icon: Icon(Icons.delete_outline,
                      color: tp.danger, size: 18),
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                  onPressed: onDelete,
                ),
              ],
            ],
          ),
          const SizedBox(height: 6),
          Text(fb['body'] ?? fb['text'] ?? '',
              style: TextStyle(fontSize: 13, color: tp.textSecondary)),
          const SizedBox(height: 4),
          Text(fb['created_at'] ?? '',
              style: TextStyle(fontSize: 10, color: tp.textMuted)),
        ],
      ),
    );
  }
}
