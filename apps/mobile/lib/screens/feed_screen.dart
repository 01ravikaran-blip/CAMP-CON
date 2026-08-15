import 'package:flutter/material.dart';

class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text("Feed"),
      ),
      body: PageView.builder(
        scrollDirection: Axis.vertical,
        itemCount: 10,
        itemBuilder: (context, index) {
          final colors = [Colors.red, Colors.blue, Colors.green, Colors.purple, Colors.orange];
          final color = colors[index % colors.length];

          return Container(
            color: color.withOpacity(0.8),
            child: Stack(
              children: [
                Center(
                  child: Icon(Icons.play_circle_fill, size: 80, color: Colors.white.withOpacity(0.5)),
                ),
                Positioned(
                  bottom: 100,
                  left: 20,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "@student_${index + 1}",
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Campus life vibe check #${index + 1} 🎓✨",
                        style: const TextStyle(color: Colors.white),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 100,
                  right: 20,
                  child: Column(
                    children: [
                      _SideButton(icon: Icons.favorite, label: "1.2k"),
                      _SideButton(icon: Icons.comment, label: "45"),
                      _SideButton(icon: Icons.share, label: "Share"),
                    ],
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SideButton extends StatelessWidget {
  final IconData icon;
  final String label;

  const _SideButton({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 30),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }
}
