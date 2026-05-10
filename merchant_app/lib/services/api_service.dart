import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService extends ChangeNotifier {
  static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android emulator local API
  
  String? _userId;
  String? _storeId;
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  bool get isAuthenticated => _userId != null;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;
  String? get currentStoreId => _storeId;

  ApiService() {
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    _userId = prefs.getString('x-user-id');
    _storeId = prefs.getString('current-store-id');
    if (_userId != null) {
      // In a real app, you might want to fetch user details here to confirm token is valid
    }
    _isLoading = false;
    notifyListeners();
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_userId != null) 'x-user-id': _userId!,
  };

  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _userId = data['user']['id'];
        _user = data['user'];
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('x-user-id', _userId!);
        
        if (data['stores'] != null && data['stores'].isNotEmpty) {
          _storeId = data['stores'][0]['id'];
          await prefs.setString('current-store-id', _storeId!);
        }
        
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    _userId = null;
    _user = null;
    _storeId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }

  Future<Map<String, dynamic>> getStoreOverview() async {
    if (_storeId == null) return {};
    final response = await http.get(Uri.parse('$baseUrl/dashboard?storeId=$_storeId'), headers: _headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['stats'] ?? {};
    }
    throw Exception('Failed to load store overview');
  }

  Future<List<dynamic>> getRecentOrders() async {
    if (_storeId == null) return [];
    final response = await http.get(Uri.parse('$baseUrl/dashboard?storeId=$_storeId'), headers: _headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['recentOrders'] ?? [];
    }
    return [];
  }

  Future<List<dynamic>> getOrders() async {
    if (_storeId == null) return [];
    final response = await http.get(Uri.parse('$baseUrl/orders?storeId=$_storeId'), headers: _headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['orders'] ?? [];
    }
    return [];
  }

  Future<List<dynamic>> getProducts() async {
    if (_storeId == null) return [];
    final response = await http.get(Uri.parse('$baseUrl/products?storeId=$_storeId'), headers: _headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body)['products'] ?? [];
    }
    return [];
  }
  Future<bool> updateOrderStatus(String orderId, String status) async {
    if (_storeId == null) return false;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders/update'),
        headers: _headers,
        body: jsonEncode({
          'storeId': _storeId,
          'orderId': orderId,
          'status': status,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateProduct(String productId, double price, int stock, String status) async {
    if (_storeId == null) return false;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/products/update'),
        headers: _headers,
        body: jsonEncode({
          'storeId': _storeId,
          'productId': productId,
          'price': price,
          'stock': stock,
          'status': status,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> getFinanceData(String period) async {
    if (_storeId == null) return {};
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/finance?storeId=$_storeId&period=$period'),
        headers: _headers,
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (e) { /* ignore */ }
    return {};
  }

  Future<List<dynamic>> getCustomers() async {
    if (_storeId == null) return [];
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/customers?storeId=$_storeId'),
        headers: _headers,
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body)['customers'] ?? [];
      }
    } catch (e) { /* ignore */ }
    return [];
  }

  Future<bool> addExpense(String name, double amount, String category) async {
    if (_storeId == null) return false;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/finance/expenses'),
        headers: _headers,
        body: jsonEncode({
          'storeId': _storeId,
          'name': name,
          'amount': amount,
          'category': category,
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  Future<bool> createProduct(Map<String, dynamic> productData) async {
    if (_storeId == null) return false;
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/products'),
        headers: _headers,
        body: jsonEncode({...productData, 'storeId': _storeId}),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }
}
