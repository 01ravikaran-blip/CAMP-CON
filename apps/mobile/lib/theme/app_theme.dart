import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static final TextTheme _textTheme = GoogleFonts.interTextTheme();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF007AFF), // Apple Blue
        background: Colors.white,
        surface: const Color(0xFFF5F5F7), // Apple Light Gray
      ),
      textTheme: _textTheme,
      scaffoldBackgroundColor: Colors.white,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
        iconTheme: IconThemeData(color: Colors.black),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF0A84FF), // Apple Dark Blue
        brightness: Brightness.dark,
        background: Colors.black,
        surface: const Color(0xFF1C1C1E), // Apple Dark Gray
      ),
      textTheme: _textTheme,
      scaffoldBackgroundColor: Colors.black,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        iconTheme: IconThemeData(color: Colors.white),
      ),
    );
  }
}
