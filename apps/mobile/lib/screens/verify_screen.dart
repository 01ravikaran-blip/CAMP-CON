import 'package:flutter/material.dart';
// import 'package:image_picker/image_picker.dart';

class VerifyScreen extends StatefulWidget {
  const VerifyScreen({super.key});

  @override
  State<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends State<VerifyScreen> {
  // final ImagePicker _picker = ImagePicker();
  bool isScanning = false;
  bool isVerified = false;

  Future<void> _scanId() async {
    // Mock Scanning Logic
    setState(() => isScanning = true);
    await Future.delayed(const Duration(seconds: 3));
    setState(() {
      isScanning = false;
      isVerified = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isVerified) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle, color: Colors.green, size: 80),
              SizedBox(height: 16),
              Text("You are Verified!", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Text("Welcome to the Campus Bubble 🎓"),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text("Verify Student ID")),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Text(
              "Please scan the front of your official Student ID card.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const Spacer(),
            
            // Scanner Viewfinder
            Container(
              height: 300,
              decoration: BoxDecoration(
                border: Border.all(color: isScanning ? Colors.green : Colors.blue, width: 4),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: isScanning 
                  ? const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text("Analyzing Hologram...")
                      ],
                    )
                  : const Icon(Icons.camera_alt, size: 60, color: Colors.grey),
              ),
            ),
            
            const Spacer(),
            
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: isScanning ? null : _scanId,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF007AFF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text("Scan ID Card", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
