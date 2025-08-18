import React from "react";
import { Dimensions, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import SessionStack from "./sessionStack";
import DrinksStack from "./drinksStack";
import UserStack from "./userStack";
import Ionicons from '@expo/vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

const { width, height } = Dimensions.get("window");
import { theme } from "../styles/theme";

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
              <Image
                source={require('../../assets/tabs/session.png')}
                style={{
                  width: width * 0.09,
                  height: width * 0.09,
                  tintColor: color,
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Drinks"
          component={DrinksStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Image
                source={require('../../assets/tabs/drinks.png')}
                style={{
                  width: width * 0.1,
                  height: width * 0.1,
                  tintColor: color,
                  marginTop: height * 0.01,
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tab.Screen
          name="User"
          component={UserStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="stats-chart-sharp"
                size={width * 0.09}
                color={color}
                style={{ marginTop: height * 0.01 }}
              />

            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
