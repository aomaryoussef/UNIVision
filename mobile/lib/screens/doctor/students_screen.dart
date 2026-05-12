import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';
import 'student_detail_screen.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  List<Map<String, dynamic>> _students = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _loading = true;
  String? _error;
  String _search = '';
  int _gradeFilter = 0; // 0 = all

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.doctorGetStudents();
      if (mounted) {
        _students = List<Map<String, dynamic>>.from(data);
        _applyFilter();
        setState(() => _loading = false);
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  void _applyFilter() {
    _filtered = _students.where((s) {
      if (_gradeFilter > 0 && s['grade'] != _gradeFilter) return false;
      if (_search.isNotEmpty) {
        final q = _search.toLowerCase();
        final name = (s['name'] ?? s['name_en'] ?? '').toString().toLowerCase();
        final id = (s['id'] ?? '').toString();
        return name.contains(q) || id.contains(q);
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView();
    if (_error != null) return ErrorView(message: _error!, onRetry: _load);

    final tp = context.watch<ThemeProvider>().current;
    final theme = Theme.of(context);
    final isAdmin = context.read<AuthProvider>().role == 'admin';

    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Search by name or ID...',
              prefixIcon: const Icon(Icons.search),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
            onChanged: (v) {
              setState(() { _search = v; _applyFilter(); });
            },
          ),
        ),

        // Grade filter chips
        SizedBox(
          height: 38,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              _FilterChip(
                  label: 'All',
                  active: _gradeFilter == 0,
                  tp: tp,
                  onTap: () =>
                      setState(() { _gradeFilter = 0; _applyFilter(); })),
              for (int g = 1; g <= 4; g++)
                _FilterChip(
                    label: 'Grade $g',
                    active: _gradeFilter == g,
                    tp: tp,
                    onTap: () =>
                        setState(() { _gradeFilter = g; _applyFilter(); })),
            ],
          ),
        ),

        // Student count
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Row(
            children: [
              Text('${_filtered.length} students',
                  style: theme.textTheme.bodySmall),
              const Spacer(),
              if (isAdmin)
                TextButton.icon(
                  onPressed: () => _showAddStudent(context),
                  icon: Icon(Icons.add, size: 16, color: tp.accent),
                  label: Text('Add',
                      style: TextStyle(color: tp.accent, fontSize: 13)),
                ),
            ],
          ),
        ),

        // List
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            color: tp.accent,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _filtered.length,
              itemBuilder: (_, i) {
                final s = _filtered[i];
                return _StudentTile(
                  student: s,
                  tp: tp,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => StudentDetailScreen(
                            studentId: s['id'].toString()),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  void _showAddStudent(BuildContext context) {
    final tp = context.read<ThemeProvider>().current;
    final idCtrl = TextEditingController();
    final nameCtrl = TextEditingController();
    final nameArCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    final natIdCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    int grade = 1;

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
                Text('Add Student',
                    style: Theme.of(ctx).textTheme.titleLarge),
                const SizedBox(height: 16),
                TextField(
                    controller: idCtrl,
                    decoration: const InputDecoration(labelText: 'Student ID *')),
                const SizedBox(height: 10),
                TextField(
                    controller: passCtrl,
                    decoration: const InputDecoration(labelText: 'Password *')),
                const SizedBox(height: 10),
                TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(labelText: 'Name (EN) *')),
                const SizedBox(height: 10),
                TextField(
                    controller: nameArCtrl,
                    decoration: const InputDecoration(labelText: 'Name (AR)')),
                const SizedBox(height: 10),
                TextField(
                    controller: natIdCtrl,
                    decoration: const InputDecoration(labelText: 'National ID')),
                const SizedBox(height: 10),
                TextField(
                    controller: phoneCtrl,
                    decoration: const InputDecoration(labelText: 'Phone')),
                const SizedBox(height: 10),
                TextField(
                    controller: emailCtrl,
                    decoration: const InputDecoration(labelText: 'Email')),
                const SizedBox(height: 10),
                DropdownButtonFormField<int>(
                  value: grade,
                  decoration: const InputDecoration(labelText: 'Grade *'),
                  dropdownColor: Theme.of(ctx).cardColor,
                  items: List.generate(
                      4,
                      (i) => DropdownMenuItem(
                          value: i + 1, child: Text('Grade ${i + 1}'))),
                  onChanged: (v) => setS(() => grade = v ?? 1),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    if (idCtrl.text.isEmpty ||
                        nameCtrl.text.isEmpty ||
                        passCtrl.text.isEmpty) return;
                    try {
                      await ApiService.adminAddStudent({
                        'id': idCtrl.text,
                        'name': nameCtrl.text,
                        'name_ar': nameArCtrl.text,
                        'password': passCtrl.text,
                        'national_id': natIdCtrl.text,
                        'phone': phoneCtrl.text,
                        'email': emailCtrl.text,
                        'grade': grade,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      _load();
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(content: Text('Error: $e')),
                        );
                      }
                    }
                  },
                  child: const Text('Create Student'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final AppTheme tp;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.active,
    required this.tp,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: active ? tp.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: active ? tp.accent : tp.textMuted.withValues(alpha: 0.3)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: active
                ? (tp.isLight ? Colors.white : tp.primaryBg)
                : tp.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _StudentTile extends StatelessWidget {
  final Map<String, dynamic> student;
  final AppTheme tp;
  final VoidCallback onTap;

  const _StudentTile({
    required this.student,
    required this.tp,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = student;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: theme.dividerColor),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: tp.accent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.person, color: tp.accent, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s['name'] ?? s['name_en'] ?? '',
                      style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: tp.textPrimary)),
                  Text('ID: ${s['id']}',
                      style:
                          TextStyle(fontSize: 11, color: tp.textMuted)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('GPA: ${(s['gpa'] ?? 0).toStringAsFixed(2)}',
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: tp.accent)),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: tp.accent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text('Grade ${s['grade'] ?? '-'}',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: tp.accent)),
                ),
              ],
            ),
            const SizedBox(width: 4),
            Icon(Icons.chevron_right, color: tp.textMuted, size: 20),
          ],
        ),
      ),
    );
  }
}
