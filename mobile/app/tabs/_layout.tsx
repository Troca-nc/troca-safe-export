// ============================================================
//  Troca Mobile — Navigation par onglets
// ============================================================

import { Tabs }       from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons }   from '@expo/vector-icons';
import { Colors, FontSize, TAB_BAR_HEIGHT } from '@/constants/theme';

function TabIcon({
  name, focused, badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? name : `${name}-outline` as any}
        size={24}
        color={focused ? Colors.primary : Colors.gray400}
      />
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarShowLabel: true,
        tabBarStyle:     styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
      }}
    >
      <Tabs.Screen
        name="accueil"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="annonces"
        options={{
          title: 'Annonces',
          tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="publier"
        options={{
          title: 'Publier',
          tabBarIcon: ({ focused }) => (
            <View style={styles.publishBtn}>
              <Ionicons name="add" size={28} color={Colors.white} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chatbubble-ellipses" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height:          TAB_BAR_HEIGHT + (Platform.OS === 'ios' ? 20 : 0),
    paddingBottom:   Platform.OS === 'ios' ? 20 : 8,
    paddingTop:      8,
    backgroundColor: Colors.white,
    borderTopColor:  Colors.border,
    borderTopWidth:  1,
  },
  label:      { fontSize: FontSize.xs, marginTop: -2 },
  tabItem:    { minHeight: 44 },
  iconWrap:   {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 999, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText:  { color: Colors.white, fontSize: 9, fontWeight: '700' },
  publishBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});
