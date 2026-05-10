import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import 'orders_screen.dart';
import 'products_screen.dart';
import 'settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Store Overview', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<ApiService>().logout(),
          ),
        ],
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: context.read<ApiService>().getStoreOverview(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final stats = snapshot.data ?? {};
          final productsCount = stats['totalProducts'] ?? 0;
          final ordersCount = stats['totalOrders'] ?? 0;
          final salesCount = stats['totalRevenue'] ?? 0;
          final customersCount = stats['totalCustomers'] ?? 0;

          final screens = [
            _buildDashboardContent(stats, productsCount, ordersCount, salesCount, customersCount),
            const OrdersScreen(),
            const ProductsScreen(),
            const SettingsScreen(),
          ];

          return IndexedStack(
            index: _currentIndex,
            children: screens,
          );
        },
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: const Color(0xFF10b981),
        unselectedItemColor: Colors.grey,
        onTap: (i) => setState(() => _currentIndex = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.shopping_bag), label: 'Orders'),
          BottomNavigationBarItem(icon: Icon(Icons.inventory), label: 'Products'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }

  Widget _buildDashboardContent(Map<String, dynamic> stats, int productsCount, int ordersCount, num salesCount, int customersCount) {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {});
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'My Dashboard',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: _buildStatCard('Total Sales', '₹$salesCount', Icons.currency_rupee, Colors.green)),
              const SizedBox(width: 16),
              Expanded(child: _buildStatCard('Orders', '$ordersCount', Icons.shopping_bag, Colors.blue)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildStatCard('Products', '$productsCount', Icons.inventory, Colors.orange)),
              const SizedBox(width: 16),
              Expanded(child: _buildStatCard('Customers', '$customersCount', Icons.people, Colors.purple)),
            ],
          ),
          const SizedBox(height: 32),
          const Text('Recent Orders', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildRecentOrders(),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color.withOpacity(0.8))),
          Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildRecentOrders() {
    return FutureBuilder<List<dynamic>>(
      future: context.read<ApiService>().getRecentOrders(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final orders = snapshot.data!;
        if (orders.isEmpty) {
          return const Padding(
            padding: EdgeInsets.all(32.0),
            child: Center(child: Text('No orders yet', style: TextStyle(color: Colors.grey))),
          );
        }
        return ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: orders.length,
          separatorBuilder: (_, __) => const Divider(),
          itemBuilder: (context, index) {
            final order = orders[index];
            return ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.green.shade50,
                child: const Icon(Icons.local_shipping, color: Colors.green, size: 20),
              ),
              title: Text(order['orderNumber'] ?? '#000'),
              subtitle: Text(order['customerName'] ?? 'Guest'),
              trailing: Text('₹${order['total']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            );
          },
        );
      },
    );
  }
}
