import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/home_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(
    const ProviderScope(
      child: SmartCampusApp(),
    ),
  );
}

class SmartCampusApp extends ConsumerWidget {
  const SmartCampusApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // In a real app, we would watch a ThemeProvider here
    const isDarkMode = false; // Default for MVP

    return MaterialApp(
      title: 'Smart Campus',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const HomeScreen(),
    );
  }
}
