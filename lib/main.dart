import 'package:flutter/material.dart';
import 'package:roktodan/home.dart';

void main() {
  runApp(const RoktoDan());
}

class RoktoDan extends StatelessWidget {
  const RoktoDan({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.light().copyWith(
        appBarTheme: AppBarTheme(
          toolbarHeight: 0,
          backgroundColor: Colors.white,
        ),
        scaffoldBackgroundColor: Colors.white,
      ),
      home: Home(),
    );
  }
}
