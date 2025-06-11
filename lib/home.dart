import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

class Home extends StatefulWidget {
  const Home({super.key});

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  late final WebViewController _controller;
  late final StreamSubscription<List<ConnectivityResult>>
  _connectivitySubscription;

  bool isLoading = true;
  bool hasInternet = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
    _checkInitialConnectivity();
    _listenToConnectivityChanges();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => _setLoading(true),
          onPageFinished: (_) => _setLoading(false),
          onWebResourceError: (_) => _handleWebError(),
        ),
      )
      ..loadRequest(Uri.parse('https://roktodan.xyz'));
  }

  Future<void> _checkInitialConnectivity() async {
    final List<ConnectivityResult> results = await Connectivity()
        .checkConnectivity();
    final bool isConnected = _hasValidConnection(results);
    if (mounted) {
      setState(() => hasInternet = isConnected);
    }
  }

  void _listenToConnectivityChanges() {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((
      List<ConnectivityResult> results,
    ) {
      final bool isConnected = _hasValidConnection(results);
      if (mounted) {
        setState(() => hasInternet = isConnected);
        if (isConnected) {
          _controller.reload();
        }
      }
    });
  }

  bool _hasValidConnection(List<ConnectivityResult> results) {
    return results.any(
      (result) =>
          result == ConnectivityResult.mobile ||
          result == ConnectivityResult.wifi ||
          result == ConnectivityResult.ethernet ||
          result == ConnectivityResult.vpn ||
          result == ConnectivityResult.bluetooth ||
          result == ConnectivityResult.other,
    );
  }

  void _setLoading(bool loading) {
    if (mounted) {
      setState(() {
        isLoading = loading;
      });
    }
  }

  void _handleWebError() {
    if (mounted) {
      setState(() {
        isLoading = false;
        hasInternet = false;
      });
    }
  }

  @override
  void dispose() {
    _connectivitySubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(toolbarHeight: 0, backgroundColor: Colors.white),
      body: Stack(
        children: [
          if (!hasInternet)
            _buildNoInternetWidget()
          else
            WebViewWidget(controller: _controller),
          if (isLoading && hasInternet)
            const Center(child: CircularProgressIndicator(color: Colors.red)),
        ],
      ),
    );
  }

  Widget _buildNoInternetWidget() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi_off, size: 64, color: Colors.grey),
            SizedBox(height: 24),
            Text(
              'No Internet Connection',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Text(
              'Please check your connection and try again.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
