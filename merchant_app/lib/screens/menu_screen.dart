import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import 'analytics_screen.dart';
import 'settings_screen.dart';
import 'inventory_screen.dart';
import 'discounts_screen.dart';
import 'collections_screen.dart';

class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<ApiService>().user;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Menu', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User Profile Section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: const Color(0xFF10b981).withOpacity(0.1),
                  child: Text(
                    user?['name']?.substring(0, 1).toUpperCase() ?? 'M',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF10b981)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?['name'] ?? 'Merchant', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                      Text(user?['email'] ?? '', style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.logout, color: Colors.red),
                  onPressed: () => context.read<ApiService>().logout(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          _buildSectionTitle('MAIN'),
          _buildMenuCard([
            _buildMenuItem(context, 'Analytics', Icons.bar_chart, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen()))),
            _buildMenuItem(context, 'Settings', Icons.settings_outlined, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen()))),
          ]),
          
          const SizedBox(height: 24),
          _buildSectionTitle('CATALOG'),
          _buildMenuCard([
            _buildMenuItem(context, 'Collections', Icons.category_outlined, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CollectionsScreen()))),
            _buildMenuItem(context, 'Discounts', Icons.local_offer_outlined, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DiscountsScreen()))),
            _buildMenuItem(context, 'Reviews', Icons.star_outline, () => _showComingSoon(context)),
          ]),

          const SizedBox(height: 24),
          _buildSectionTitle('OPERATIONS'),
          _buildMenuCard([
            _buildMenuItem(context, 'Inventory', Icons.inventory_outlined, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InventoryScreen()))),
            _buildMenuItem(context, 'Shipping', Icons.local_shipping_outlined, () => _showComingSoon(context)),
            _buildMenuItem(context, 'Tax Rates', Icons.receipt_outlined, () => _showComingSoon(context)),
            _buildMenuItem(context, 'Gift Cards', Icons.card_giftcard, () => _showComingSoon(context)),
            _buildMenuItem(context, 'Abandoned Carts', Icons.remove_shopping_cart_outlined, () => _showComingSoon(context)),
            _buildMenuItem(context, 'Activity Log', Icons.history, () => _showComingSoon(context)),
          ]),
          
          const SizedBox(height: 24),
          _buildSectionTitle('STOREFRONT'),
          _buildMenuCard([
            _buildMenuItem(context, 'Visit Store', Icons.language, () => _showComingSoon(context)),
          ]),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildMenuCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, String title, IconData icon, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: Colors.grey.shade700),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
    );
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('This feature is coming soon!')),
    );
  }
}
