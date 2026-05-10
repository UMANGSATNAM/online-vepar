import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class OrderDetailScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late String _status;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _status = widget.order['status'] ?? 'pending';
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isLoading = true);
    final success = await context.read<ApiService>().updateOrderStatus(widget.order['id'], newStatus);
    setState(() {
      _isLoading = false;
      if (success) _status = newStatus;
    });
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order status updated successfully')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    return Scaffold(
      appBar: AppBar(
        title: Text('Order ${order['orderNumber'] ?? '#000'}'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildStatusDropdown(),
          const SizedBox(height: 24),
          _buildCustomerInfo(order),
          const SizedBox(height: 24),
          const Text('Order Items', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _buildOrderItems(order['items'] ?? []),
          const SizedBox(height: 24),
          _buildOrderSummary(order),
        ],
      ),
    );
  }

  Widget _buildStatusDropdown() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Fulfillment Status', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 8),
            _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : DropdownButtonFormField<String>(
                  value: _status,
                  decoration: const InputDecoration(border: OutlineInputBorder()),
                  items: const [
                    DropdownMenuItem(value: 'pending', child: Text('Pending')),
                    DropdownMenuItem(value: 'processing', child: Text('Processing')),
                    DropdownMenuItem(value: 'shipped', child: Text('Shipped')),
                    DropdownMenuItem(value: 'delivered', child: Text('Delivered')),
                    DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                  ],
                  onChanged: (val) {
                    if (val != null && val != _status) {
                      _updateStatus(val);
                    }
                  },
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerInfo(Map<String, dynamic> order) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Customer', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.person, color: Colors.grey),
              title: Text(order['customerName'] ?? 'Guest'),
              subtitle: Text(order['customerEmail'] ?? order['customerPhone'] ?? 'No contact info'),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.location_on, color: Colors.grey),
              title: const Text('Shipping Address'),
              subtitle: Text(order['shippingAddress'] ?? 'No shipping address provided'),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildOrderItems(List<dynamic> items) {
    if (items.isEmpty) return const Text('No items in this order.');
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: items.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final item = items[index];
          return ListTile(
            title: Text(item['name'] ?? 'Item'),
            subtitle: Text('Qty: ${item['quantity']}'),
            trailing: Text('₹${item['total']}'),
          );
        },
      ),
    );
  }

  Widget _buildOrderSummary(Map<String, dynamic> order) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            _summaryRow('Subtotal', order['subtotal']),
            _summaryRow('Shipping', order['shipping']),
            _summaryRow('Tax', order['tax']),
            _summaryRow('Discount', order['discount'], isDiscount: true),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text('₹${order['total']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10b981))),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, dynamic amount, {bool isDiscount = false}) {
    final val = (amount ?? 0).toString();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(isDiscount ? '-₹$val' : '₹$val', style: TextStyle(color: isDiscount ? Colors.red : null)),
        ],
      ),
    );
  }
}
