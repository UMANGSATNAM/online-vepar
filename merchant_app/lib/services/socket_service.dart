import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_service.dart';

class SocketService extends ChangeNotifier {
  IO.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void connect(String storeId) {
    if (_socket != null && _socket!.connected) return;

    // Use the same base URL as the ApiService, assuming server.js is running on the same host
    const String baseUrl = 'https://online-vepar-production.up.railway.app'; // Production WS URL
    
    _socket = IO.io(baseUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build()
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      _isConnected = true;
      notifyListeners();
      
      // Join the store-specific room
      if (storeId.isNotEmpty) {
        _socket!.emit('join_store_room', storeId);
      }
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      notifyListeners();
    });

    // Listen for real-time notifications
    _socket!.on('new_order', (data) {
      // Trigger a notification callback or notify listeners
      _handleNewOrder(data);
    });
  }

  // Define a callback mechanism for the UI to listen to
  Function(Map<String, dynamic>)? onNewOrderReceived;

  void _handleNewOrder(dynamic data) {
    if (onNewOrderReceived != null && data is Map<String, dynamic>) {
      onNewOrderReceived!(data);
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
