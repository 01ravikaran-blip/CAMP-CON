import 'package:flutter/material.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  bool isGhostMode = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Mock Map Background
          Container(
            color: isGhostMode ? Colors.grey[800] : Colors.blue[50],
            child: Center(
              child: isGhostMode 
                ? const Icon(Icons.visibility_off, size: 100, color: Colors.grey)
                : const Icon(Icons.map, size: 100, color: Colors.blue),
            ),
          ),
          
          // Ghost Mode Toggle
          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTap: () => setState(() => isGhostMode = !isGhostMode),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: isGhostMode ? Colors.black : Colors.white,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      )
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isGhostMode ? Icons.adb : Icons.location_on,
                        color: isGhostMode ? Colors.white : Colors.blue,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isGhostMode ? "Ghost Mode ON" : "Go Ghost",
                        style: TextStyle(
                          color: isGhostMode ? Colors.white : Colors.blue,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
