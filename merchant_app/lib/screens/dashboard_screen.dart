import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import 'orders_screen.dart';
import 'products_screen.dart';
import 'customers_screen.dart';
import 'finance_screen.dart';
import 'settings_screen.dart';
import 'menu_screen.dart';
import 'analytics_screen.dart';
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    _HomeTab(),
    OrdersScreen(),
    ProductsScreen(),
    CustomersScreen(),
    FinanceScreen(),
    MenuScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        indicatorColor: const Color(0xFF10b981).withValues(alpha: 0.15),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Products'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Customers'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), selectedIcon: Icon(Icons.account_balance_wallet), label: 'Hisab'),
          NavigationDestination(icon: Icon(Icons.menu_outlined), selectedIcon: Icon(Icons.menu), label: 'Menu'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatefulWidget {
  const _HomeTab();

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  Map<String, dynamic> _stats = {};
  List<dynamic> _recentOrders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _setupSocket() {
    final api = context.read<ApiService>();
    final socketService = context.read<SocketService>();
    final storeId = api.currentStoreId;
    
    if (storeId != null && !socketService.isConnected) {
      socketService.connect(storeId);
      socketService.onNewOrderReceived = (data) {
        if (!mounted) return;
        
        final customerName = data['customerName'] ?? 'Guest';
        final total = data['total']?.toString() ?? '0';
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.shopping_bag, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('🛍️ Cha-ching! New Order', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('From $customerName — ₹$total'),
                    ],
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF10b981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            duration: const Duration(seconds: 4),
          ),
        );
        
        // Refresh the dashboard stats when a new order comes in
        _load();
      };
    }
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final api = context.read<ApiService>();
    final stats = await api.getStoreOverview();
    final orders = await api.getRecentOrders();
    setState(() {
      _stats = stats;
      _recentOrders = orders;
      _isLoading = false;
    });
    
    // Setup socket after we have loaded and confirmed the storeId
    _setupSocket();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<ApiService>().user;
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome back 👋', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            Text(user?['name'] ?? 'Merchant', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<ApiService>().logout(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildTodayBanner(),
                  const SizedBox(height: 20),
                  _buildStatsGrid(),
                  const SizedBox(height: 24),
                  _buildQuickActions(context),
                  const SizedBox(height: 24),
                  _buildRecentOrders(),
                ],
              ),
            ),
    );
  }

  Widget _buildTodayBanner() {
    final todayRevenue = _stats['todayRevenue'] ?? 0;
    final todayOrders = _stats['todayOrders'] ?? 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10b981), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Today's Revenue", style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 4),
              Text('₹$todayRevenue', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('$todayOrders orders today', style: const TextStyle(color: Colors.white60, fontSize: 12)),
            ],
          ),
          const Icon(Icons.trending_up, color: Colors.white, size: 48),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _statCard('Total Revenue', '₹${_stats['totalRevenue'] ?? 0}', Icons.currency_rupee, Colors.green),
        _statCard('All Orders', '${_stats['totalOrders'] ?? 0}', Icons.receipt_long, Colors.blue),
        _statCard('Products', '${_stats['totalProducts'] ?? 0}', Icons.inventory_2, Colors.orange),
        _statCard('Customers', '${_stats['totalCustomers'] ?? 0}', Icons.people, Colors.purple),
      ],
    );
  }

  Widget _statCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 22),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color.withValues(alpha: 0.9))),
              Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _actionChip(context, '➕ Add Product', Icons.add_box_outlined, () {
                Navigator.pushNamed(context, '/add-product');
              }),
              const SizedBox(width: 10),
              _actionChip(context, '📦 View Orders', Icons.receipt_long_outlined, () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen()));
              }),
              const SizedBox(width: 10),
              _actionChip(context, '📊 View Analytics', Icons.bar_chart, () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen()));
              }),
              const SizedBox(width: 10),
              _actionChip(context, '⚙️ Manage Store', Icons.settings_outlined, () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()));
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _actionChip(BuildContext context, String label, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: const Color(0xFF10b981)),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentOrders() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Recent Orders', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        if (_recentOrders.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No orders yet', style: TextStyle(color: Colors.grey))),
            ),
          )
        else
          ..._recentOrders.take(5).map((order) => Card(
                elevation: 0,
                margin: const EdgeInsets.only(bottom: 8),
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.blue.shade50,
                    child: Icon(Icons.shopping_bag_outlined, color: Colors.blue.shade700, size: 20),
                  ),
                  title: Text(order['orderNumber'] ?? '#000', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(order['customerName'] ?? 'Guest'),
                  trailing: Text(
                    '₹${order['total']}',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10b981), fontSize: 15),
                  ),
                ),
              )),
      ],
    );
  }
}
