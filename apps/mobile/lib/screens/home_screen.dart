import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'feed_screen.dart';
import 'map_screen.dart';
import 'verify_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const FeedScreen(),
    const MapScreen(),
    const VerifyScreen(),
    const Center(child: Text("Profile (Coming Soon)")),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Theme.of(context).dividerColor.withOpacity(0.1))),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) => setState(() => _currentIndex = index),
          backgroundColor: Theme.of(context).colorScheme.background.withOpacity(0.8),
          elevation: 0,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: const [
            NavigationDestination(
              icon: Icon(CupertinoIcons.home),
              label: 'Feed',
            ),
            NavigationDestination(
              icon: Icon(CupertinoIcons.map),
              label: 'Map',
            ),
            NavigationDestination(
              icon: Icon(CupertinoIcons.checkmark_shield),
              label: 'Verify',
            ),
            NavigationDestination(
              icon: Icon(CupertinoIcons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
