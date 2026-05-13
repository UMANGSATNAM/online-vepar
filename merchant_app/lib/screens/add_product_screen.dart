import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _comparePriceController = TextEditingController();
  final _skuController = TextEditingController();
  final _stockController = TextEditingController();
  final _hsnCodeController = TextEditingController();
  final _gstRateController = TextEditingController();
  String _status = 'active';
  String _originCountry = 'IN';
  bool _isCodEnabled = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _comparePriceController.dispose();
    _skuController.dispose();
    _stockController.dispose();
    _hsnCodeController.dispose();
    _gstRateController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final success = await context.read<ApiService>().createProduct({
      'name': _nameController.text,
      'description': _descController.text,
      'price': double.tryParse(_priceController.text) ?? 0,
      'comparePrice': double.tryParse(_comparePriceController.text),
      'sku': _skuController.text,
      'stock': int.tryParse(_stockController.text) ?? 0,
      'status': _status,
      'hsnCode': _hsnCodeController.text,
      'gstRate': double.tryParse(_gstRateController.text) ?? 0,
      'originCountry': _originCountry,
      'isCodEnabled': _isCodEnabled,
    });

    setState(() => _isLoading = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Product created successfully!'),
          backgroundColor: Color(0xFF10b981),
        ),
      );
      Navigator.pop(context, true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to create product'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Product', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else
            TextButton(
              onPressed: _submit,
              child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildSection('Basic Info', [
              _field(_nameController, 'Product Name *', required: true),
              _field(_descController, 'Description', maxLines: 3),
            ]),
            const SizedBox(height: 16),
            _buildSection('Pricing', [
              _field(_priceController, 'Price (₹) *',
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  required: true),
              _field(_comparePriceController, 'Compare at Price (₹)',
                  keyboardType: const TextInputType.numberWithOptions(decimal: true)),
            ]),
            const SizedBox(height: 16),
            _buildSection('Inventory', [
              _field(_skuController, 'SKU'),
              _field(_stockController, 'Stock Quantity',
                  keyboardType: TextInputType.number),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _status,
                decoration: const InputDecoration(
                  labelText: 'Status',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'active', child: Text('Active – Visible on store')),
                  DropdownMenuItem(value: 'draft', child: Text('Draft – Hidden from store')),
                ],
                onChanged: (val) => setState(() => _status = val ?? 'active'),
              ),
            ]),
            const SizedBox(height: 16),
            _buildSection('Compliance (India)', [
              Row(
                children: [
                  Expanded(child: _field(_hsnCodeController, 'HSN Code')),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _field(_gstRateController, 'GST %',
                        keyboardType: const TextInputType.numberWithOptions(decimal: true)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _originCountry,
                decoration: const InputDecoration(
                  labelText: 'Country of Origin',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'IN', child: Text('India')),
                  DropdownMenuItem(value: 'CN', child: Text('China')),
                  DropdownMenuItem(value: 'US', child: Text('United States')),
                  DropdownMenuItem(value: 'UK', child: Text('United Kingdom')),
                  DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                ],
                onChanged: (val) => setState(() => _originCountry = val ?? 'IN'),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Cash on Delivery', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Allow COD for this item'),
                value: _isCodEnabled,
                activeColor: const Color(0xFF10b981),
                onChanged: (val) => setState(() => _isCodEnabled = val),
              ),
            ]),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10b981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Create Product', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const Divider(),
            ...children.map((w) => Padding(padding: const EdgeInsets.only(top: 12), child: w)),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController ctrl,
    String label, {
    TextInputType? keyboardType,
    int maxLines = 1,
    bool required = false,
  }) {
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: required
          ? (v) => (v == null || v.isEmpty) ? 'Required field' : null
          : null,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      ),
    );
  }
}
