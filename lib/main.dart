import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:roktodan/home.dart';
import 'package:window_manager/window_manager.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  if (Platform.isLinux || Platform.isMacOS || Platform.isWindows) {
    await windowManager.ensureInitialized();

    WindowOptions windowOptions = const WindowOptions(
      size: Size(1024, 768),
      minimumSize: Size(800, 600),
      center: true,
      backgroundColor: Colors.transparent,
      title: 'RoktoDan',
      skipTaskbar: false,
    );

    await windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();
      await windowManager.focus();
    });
  }
  
  runApp(const RoktoDan());
}

class RoktoDan extends StatefulWidget {
  const RoktoDan({super.key});

  @override
  State<RoktoDan> createState() => _RoktoDanState();
}

class _RoktoDanState extends State<RoktoDan> {
  ThemeMode _themeMode = ThemeMode.system;

  void _updateThemeMode(String theme) {
    setState(() {
      switch (theme) {
        case 'dark':
          _themeMode = ThemeMode.dark;
          break;
        case 'light':
          _themeMode = ThemeMode.light;
          break;
        default:
          _themeMode = ThemeMode.system;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.light().copyWith(
        appBarTheme: const AppBarTheme(
          toolbarHeight: 0,
          backgroundColor: Colors.white,
        ),
        scaffoldBackgroundColor: Colors.white,
      ),
      darkTheme: ThemeData.dark().copyWith(
        appBarTheme: const AppBarTheme(
          toolbarHeight: 0,
        ),
      ),
      themeMode: _themeMode,
      home: Home(onThemeChanged: _updateThemeMode),
    );
  }
}
