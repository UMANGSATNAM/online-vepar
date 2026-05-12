import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'services/socket_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ApiService()),
        ChangeNotifierProvider(create: (_) => SocketService()),
      ],
      child: const OnlineVeparAdminApp(),
    ),
  );
}

class OnlineVeparAdminApp extends StatelessWidget {
  const OnlineVeparAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Online Vepar Admin',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF10b981)),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      home: Consumer<ApiService>(
        builder: (context, apiService, _) {
          if (apiService.isLoading) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }
          return apiService.isAuthenticated ? const DashboardScreen() : const LoginScreen();
        },
      ),
    );
  }
}
