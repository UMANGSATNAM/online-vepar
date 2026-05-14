import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  String _selectedPeriod = '7d';
  Map<String, dynamic> _financeData = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFinance();
  }

  Future<void> _loadFinance() async {
    setState(() => _isLoading = true);
    final data = await context.read<ApiService>().getFinanceData(_selectedPeriod);
    setState(() {
      _financeData = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('💰 Hisab (Finance)', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          DropdownButton<String>(
            value: _selectedPeriod,
            underline: const SizedBox(),
            onChanged: (val) {
              if (val != null) {
                setState(() => _selectedPeriod = val);
                _loadFinance();
              }
            },
            items: const [
              DropdownMenuItem(value: '7d', child: Text('7 Days')),
              DropdownMenuItem(value: '30d', child: Text('30 Days')),
              DropdownMenuItem(value: '90d', child: Text('90 Days')),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadFinance,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildProfitCard(),
                  const SizedBox(height: 16),
                  _buildBreakdownCards(),
                  const SizedBox(height: 24),
                  _buildRevenueChart(),
                  const SizedBox(height: 24),
                  _buildExpensesList(),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddExpenseSheet,
        icon: const Icon(Icons.add),
        label: const Text('Log Expense'),
        backgroundColor: const Color(0xFF10b981),
      ),
    );
  }

  Widget _buildProfitCard() {
    final revenue = (_financeData['revenue'] ?? 0).toDouble();
    final expenses = (_financeData['expenses'] ?? 0).toDouble();
    final profit = revenue - expenses;
    final isProfit = profit >= 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isProfit
              ? [const Color(0xFF10b981), const Color(0xFF059669)]
              : [Colors.red.shade400, Colors.red.shade600],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isProfit ? Colors.green : Colors.red).withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isProfit ? '📈 Net Profit' : '📉 Net Loss',
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Text(
            '${isProfit ? '+' : '-'}₹${profit.abs().toStringAsFixed(0)}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Based on ₹${revenue.toStringAsFixed(0)} revenue',
            style: const TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildBreakdownCards() {
    final revenue = (_financeData['revenue'] ?? 0).toDouble();
    final expenses = (_financeData['expenses'] ?? 0).toDouble();
    final adSpend = (_financeData['adSpend'] ?? 0).toDouble();
    final shipping = (_financeData['shipping'] ?? 0).toDouble();

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: [
        _metricCard('Revenue', revenue, Colors.green, Icons.trending_up),
        _metricCard('Expenses', expenses, Colors.red, Icons.trending_down),
        _metricCard('Ad Spend', adSpend, Colors.orange, Icons.campaign),
        _metricCard('Shipping', shipping, Colors.blue, Icons.local_shipping),
      ],
    );
  }

  Widget _metricCard(String title, double amount, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 22),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '₹${amount.toStringAsFixed(0)}',
                style: TextStyle(
                  color: color,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(title,
                  style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRevenueChart() {
    final dailyRevenue = List<double>.from(
      (_financeData['dailyRevenue'] as List?)?.map((e) => e.toDouble()) ?? List.filled(7, 0.0),
    );

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Revenue Trend', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            SizedBox(
              height: 150,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: dailyRevenue.asMap().entries
                          .map((e) => FlSpot(e.key.toDouble(), e.value))
                          .toList(),
                      isCurved: true,
                      color: const Color(0xFF10b981),
                      barWidth: 3,
                      belowBarData: BarAreaData(
                        show: true,
                        color: const Color(0xFF10b981).withValues(alpha: 0.1),
                      ),
                      dotData: const FlDotData(show: false),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpensesList() {
    final expenses = (_financeData['expensesList'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Recent Expenses', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        if (expenses.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text('No expenses logged yet.\nTap + to add one.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey)),
              ),
            ),
          )
        else
          ...expenses.map((expense) => Card(
                elevation: 0,
                margin: const EdgeInsets.only(bottom: 8),
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.orange.shade50,
                    child: Icon(_expenseIcon(expense['category']), color: Colors.orange),
                  ),
                  title: Text(expense['name'] ?? 'Expense'),
                  subtitle: Text(expense['category'] ?? ''),
                  trailing: Text(
                    '-₹${expense['amount']}',
                    style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                  ),
                ),
              )),
      ],
    );
  }

  IconData _expenseIcon(String? category) {
    switch (category) {
      case 'marketing': return Icons.campaign;
      case 'shipping': return Icons.local_shipping;
      case 'software': return Icons.computer;
      default: return Icons.receipt;
    }
  }

  void _showAddExpenseSheet() {
    final nameController = TextEditingController();
    final amountController = TextEditingController();
    String category = 'marketing';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Log Expense', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Expense Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (₹)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            StatefulBuilder(builder: (context, setInnerState) {
              return DropdownButtonFormField<String>(
                initialValue: category,
                decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'marketing', child: Text('📢 Marketing / Ads')),
                  DropdownMenuItem(value: 'shipping', child: Text('🚚 Shipping')),
                  DropdownMenuItem(value: 'software', child: Text('💻 Software')),
                  DropdownMenuItem(value: 'custom', child: Text('🗂 Other')),
                ],
                onChanged: (val) => setInnerState(() => category = val ?? 'marketing'),
              );
            }),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10b981),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () async {
                  final api = context.read<ApiService>();
                  final nav = Navigator.of(ctx);
                  final success = await api.addExpense(
                    nameController.text,
                    double.tryParse(amountController.text) ?? 0,
                    category,
                  );
                  if (!mounted) return;
                  nav.pop();
                  if (success) _loadFinance();
                },
                child: const Text('Save Expense', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
