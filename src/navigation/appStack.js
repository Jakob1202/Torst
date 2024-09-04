import React from "react";
import { Dimensions } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import SessionStack from "./sessionStack";
import DrinksStack from "./drinksStack";
import ProfileStack from "./profileStack";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";

const Tab = createBottomTabNavigator();

const { width } = Dimensions.get("window");
import { theme } from "../styles/theme";

const tabIconSize = width * 0.075;

export default function AppStack() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.tab,
            borderTopColor: theme.colors.tab,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text,
          tabBarLabelStyle: {
            display: "none",
          },
        }}
      >
        <Tab.Screen
          name="Sessions"
          component={SessionStack}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="party-popper"
                color={color}
                size={tabIconSize}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Drinks"
          component={DrinksStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="beer-outline" color={color} size={tabIconSize} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            tabBarIcon: ({ color }) => (
              <AntDesign name="user" color={color} size={tabIconSize} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
