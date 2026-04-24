import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { storyTheme } from "@/components/ui/story-theme";
import { FloatingTabBar } from "@/components/navigation/floating-tab-bar";
import { TabBarVisibilityProvider } from "@/components/navigation/tab-bar-visibility";

export default function TabsLayout() {
  return (
    <TabBarVisibilityProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: storyTheme.navy,
          tabBarInactiveTintColor: storyTheme.inkSoft,
          tabBarStyle: {
            backgroundColor: "rgba(251, 244, 231, 0.78)",
            borderTopWidth: 0,
            borderRadius: 30,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.55)",
            elevation: 12,
            shadowColor: "#17091c",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.16,
            shadowRadius: 22,
            height: 68,
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "800",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="home" color={color} size={25} />
            ),
          }}
        />
        <Tabs.Screen
          name="lessons"
          options={{
            title: "Lessons",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="book" color={color} size={25} />
            ),
          }}
        />
        <Tabs.Screen
          name="game"
          options={{
            title: "Game",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="gamepad-variant"
                color={color}
                size={25}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="account" color={color} size={25} />
            ),
          }}
        />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}
