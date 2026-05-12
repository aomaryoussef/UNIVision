import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class ScheduleManageScreen extends StatefulWidget {
  const ScheduleManageScreen({super.key});

  @override
  State<ScheduleManageScreen> createState() => _ScheduleManageScreenState();
}

class _ScheduleManageScreenState extends State<ScheduleManageScreen> {
  String _semester = 'grade_1_sem_1';
  List<Map<String, dynamic>> _entries = [];
  bool _loading = true;
  String? _error;

  final _semesters = [
    ('grade_1_sem_1', 'Grade 1 — Semester 1'),
    ('grade_1_sem_2', 'Grade 1 — Semester 2'),
    ('grade_2_sem_1', 'Grade 2 — Semester 1'),
    ('grade_2_sem_2', 'Grade 2 — Semester 2'),
    ('grade_3_sem_1', 'Grade 3 — Semester 1'),
    ('grade_3_sem_2', 'Grade 3 — Semester 2'),
    ('grade_4_sem_1', 'Grade 4 — Semester 1'),
    ('grade_4_sem_2', 'Grade 4 — Semester 2'),
  ];

  final _days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.doctorGetSchedule(_semester);
      if (mounted) {
        _entries = List<Map<String, dynamic>>.from(data);
        setState(() => _loading = false);
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);

    return Column(
      children: [
        // Semester selector
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _semester,
                      dropdownColor: theme.cardColor,
                      style: TextStyle(color: tp.textPrimary, fontSize: 14),
                      items: _semesters
                          .map((s) => DropdownMenuItem(
                              value: s.$1, child: Text(s.$2)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) {
                          _semester = v;
                          _load();
                        }
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: Icon(Icons.add_circle, color: tp.accent, size: 28),
                onPressed: () => _showEntryForm(context),
              ),
            ],
          ),
        ),

        if (_loading)
          const Expanded(child: LoadingView())
        else if (_error != null)
          Expanded(child: ErrorView(message: _error!, onRetry: _load))
        else
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              color: tp.accent,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  for (final day in _days)
                    ..._buildDaySection(day, tp, theme),
                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
      ],
    );
  }

  List<Widget> _buildDaySection(String day, AppTheme tp, ThemeData theme) {
    final dayEntries = _entries.where((e) => e['day'] == day).toList();
    if (dayEntries.isEmpty) return [];
    return [
      Padding(
        padding: const EdgeInsets.only(top: 12, bottom: 6),
        child: Text(day,
            style: TextStyle(
                fontWeight: FontWeight.w700, fontSize: 15, color: tp.accent)),
      ),
      ...dayEntries.map((entry) {
        final type = entry['type'] ?? 'Lecture';
        final typeColor = type == 'Lab'
            ? tp.success
            : type == 'Tutorial'
                ? tp.info
                : tp.accent;
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Row(
            children: [
              Column(children: [
                Text(entry['start_time'] ?? '',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                        color: tp.textPrimary)),
                Text(entry['end_time'] ?? '',
                    style: TextStyle(fontSize: 11, color: tp.textMuted)),
              ]),
              Container(
                width: 3,
                height: 36,
                margin: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: typeColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry['course_name'] ?? '',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: tp.textPrimary)),
                    Text(
                      '${entry['location'] ?? ''} • ${entry['doctor_name'] ?? ''}',
                      style: TextStyle(fontSize: 11, color: tp.textMuted),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: typeColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(type,
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: typeColor)),
              ),
              IconButton(
                icon: Icon(Icons.delete_outline, color: tp.danger, size: 18),
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.only(left: 8),
                onPressed: () async {
                  try {
                    await ApiService.doctorDeleteSchedule(entry['id']);
                    _load();
                  } catch (_) {}
                },
              ),
            ],
          ),
        );
      }),
    ];
  }

  void _showEntryForm(BuildContext context) {
    final courseCtrl = TextEditingController();
    final locCtrl = TextEditingController();
    final doctorCtrl = TextEditingController();
    final startCtrl = TextEditingController();
    final endCtrl = TextEditingController();
    String day = 'Sunday';
    String type = 'Lecture';

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
                Text('Add Schedule Entry',
                    style: Theme.of(ctx).textTheme.titleLarge),
                const SizedBox(height: 12),
                TextField(
                    controller: courseCtrl,
                    decoration:
                        const InputDecoration(labelText: 'Course Name')),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: day,
                  decoration: const InputDecoration(labelText: 'Day'),
                  dropdownColor: Theme.of(ctx).cardColor,
                  items: _days
                      .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                      .toList(),
                  onChanged: (v) => setS(() => day = v ?? 'Sunday'),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: type,
                  decoration: const InputDecoration(labelText: 'Type'),
                  dropdownColor: Theme.of(ctx).cardColor,
                  items: ['Lecture', 'Lab', 'Tutorial']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) => setS(() => type = v ?? 'Lecture'),
                ),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                      child: TextField(
                          controller: startCtrl,
                          decoration: const InputDecoration(
                              labelText: 'Start (HH:MM)'))),
                  const SizedBox(width: 8),
                  Expanded(
                      child: TextField(
                          controller: endCtrl,
                          decoration: const InputDecoration(
                              labelText: 'End (HH:MM)'))),
                ]),
                const SizedBox(height: 8),
                TextField(
                    controller: locCtrl,
                    decoration:
                        const InputDecoration(labelText: 'Location')),
                const SizedBox(height: 8),
                TextField(
                    controller: doctorCtrl,
                    decoration:
                        const InputDecoration(labelText: 'Doctor Name')),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    if (courseCtrl.text.isEmpty) return;
                    try {
                      await ApiService.doctorAddSchedule(_semester, {
                        'course_name': courseCtrl.text,
                        'day': day,
                        'type': type,
                        'start_time': startCtrl.text,
                        'end_time': endCtrl.text,
                        'location': locCtrl.text,
                        'doctor_name': doctorCtrl.text,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      _load();
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text('Error: $e')));
                      }
                    }
                  },
                  child: const Text('Add Entry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
