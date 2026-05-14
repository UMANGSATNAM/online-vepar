import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  List<dynamic> _products = [];
  List<dynamic> _filtered = [];
  bool _isLoading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
    _searchController.addListener(_onSearch);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final data = await context.read<ApiService>().getProducts();
    setState(() {
      _products = data;
      _filtered = data;
      _isLoading = false;
    });
  }

  void _onSearch() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filtered = _products.where((p) => (p['name'] ?? '').toLowerCase().contains(query)).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Inventory', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search products to manage stock...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF10b981)))
                : _filtered.isEmpty
                    ? const Center(child: Text('No products found', style: TextStyle(color: Colors.grey)))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filtered.length,
                          itemBuilder: (ctx, i) {
                            final product = _filtered[i];
                            final stock = product['stock'] ?? 0;
                            final isLowStock = stock < 10;
                            
                            return Card(
                              elevation: 0,
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(
                                side: BorderSide(color: Colors.grey.shade200),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: Container(
                                  width: 50,
                                  height: 50,
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(8),
                                    image: product['images'] != null && (product['images'] as List).isNotEmpty
                                        ? DecorationImage(
                                            image: NetworkImage(product['images'][0]),
                                            fit: BoxFit.cover,
                                          )
                                        : null,
                                  ),
                                  child: product['images'] == null || (product['images'] as List).isEmpty
                                      ? const Icon(Icons.image_outlined, color: Colors.grey)
                                      : null,
                                ),
                                title: Text(product['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Row(
                                  children: [
                                    const Text('SKU: ', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                    Text(product['sku'] ?? 'N/A', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isLowStock ? Colors.red.shade50 : Colors.green.shade50,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '$stock in stock',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          color: isLowStock ? Colors.red.shade700 : Colors.green.shade700,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    const Text('Tap to update', style: TextStyle(fontSize: 10, color: Colors.blue)),
                                  ],
                                ),
                                onTap: () => _updateStockDialog(product),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  void _updateStockDialog(dynamic product) {
    final controller = TextEditingController(text: '${product['stock'] ?? 0}');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Update Stock: ${product['name']}'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Available Quantity',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10b981), foregroundColor: Colors.white),
            onPressed: () async {
              final newStock = int.tryParse(controller.text) ?? 0;
              final api = context.read<ApiService>();
              final nav = Navigator.of(ctx);
              final scaffoldMsg = ScaffoldMessenger.of(context);
              
              final price = (product['price'] ?? 0).toDouble();
              final status = product['status'] ?? 'active';
              final productId = product['_id'] ?? product['id'];
              
              if (productId == null) return;
              
              final success = await api.updateProduct(productId, price, newStock, status);
              
              if (!mounted) return;
              nav.pop();
              
              if (success) {
                scaffoldMsg.showSnackBar(const SnackBar(content: Text('Stock updated successfully')));
                _load();
              } else {
                scaffoldMsg.showSnackBar(const SnackBar(content: Text('Failed to update stock')));
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
