import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
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
      final data = await ApiService.studentProfile(auth.userId!);
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

    final gradeLabels = {
      1: 'First Year — Freshman',
      2: 'Second Year — Sophomore',
      3: 'Third Year — Junior',
      4: 'Fourth Year — Senior',
    };

    return RefreshIndicator(
      onRefresh: _load,
      color: tp.accent,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero card
          AppCard(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: tp.accent.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.person, size: 48, color: tp.accent),
                ),
                const SizedBox(height: 12),
                Text(d['name_en'] ?? d['name'] ?? '',
                    style: theme.textTheme.titleLarge,
                    textAlign: TextAlign.center),
                if (d['name_ar'] != null) ...[
                  const SizedBox(height: 4),
                  Text(d['name_ar'],
                      style: TextStyle(
                          fontSize: 16, color: tp.textSecondary),
                      textAlign: TextAlign.center),
                ],
                const SizedBox(height: 8),
                Text('ID: ${d['student_id'] ?? d['id'] ?? ''}',
                    style: theme.textTheme.bodySmall),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: tp.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Grade ${d['grade'] ?? '-'} — ${gradeLabels[d['grade']] ?? ''}',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: tp.accent),
                  ),
                ),
                if (d['university_email'] != null) ...[
                  const SizedBox(height: 6),
                  Text(d['university_email'],
                      style:
                          TextStyle(fontSize: 12, color: tp.textMuted)),
                ],
              ],
            ),
          ),

          SectionHeader(title: 'Personal Information'),

          // Info grid
          AppCard(
            child: Column(
              children: [
                _InfoRow(
                    icon: Icons.badge,
                    label: 'National ID',
                    value: d['national_id'] ?? '-',
                    tp: tp),
                _InfoRow(
                    icon: Icons.cake,
                    label: 'Date of Birth',
                    value: d['dob'] ?? '-',
                    tp: tp),
                _InfoRow(
                    icon: Icons.location_city,
                    label: 'Birthplace',
                    value: d['birthplace'] ?? '-',
                    tp: tp),
                _InfoRow(
                    icon: Icons.flag,
                    label: 'Nationality',
                    value: d['nationality'] ?? '-',
                    tp: tp),
                _InfoRow(
                    icon: Icons.person_outline,
                    label: 'Gender',
                    value: d['gender'] ?? '-',
                    tp: tp),
                _InfoRow(
                    icon: Icons.auto_stories,
                    label: 'Religion',
                    value: d['religion'] ?? '-',
                    tp: tp),
                _InfoRow(
                    icon: Icons.phone,
                    label: 'Phone',
                    value: d['phone'] ?? '-',
                    tp: tp),
                _InfoRow(
                    icon: Icons.email,
                    label: 'Email',
                    value: d['email'] ?? '-',
                    tp: tp),
                _InfoRow(
                    icon: Icons.home,
                    label: 'Address',
                    value: d['address'] ?? '-',
                    tp: tp),
              ],
            ),
          ),

          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final AppTheme tp;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.tp,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: tp.textMuted),
          const SizedBox(width: 12),
          SizedBox(
            width: 90,
            child: Text(label,
                style: TextStyle(
                    fontSize: 12,
                    color: tp.textMuted,
                    fontWeight: FontWeight.w600)),
          ),
          Expanded(
            child: Text(value,
                style: TextStyle(fontSize: 13, color: tp.textPrimary)),
          ),
        ],
      ),
    );
  }
}
