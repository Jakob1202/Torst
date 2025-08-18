import React from "react";
import { Pressable, Dimensions, StyleSheet } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuthContext } from "../context/authContext";
import ProfileScreen from "../screens/profile";
import EndedSessionScreen from "../screens/endedSession";
import SessionSettingsScreen from "../screens/sessionSettings";
import SessionDrinksScreen from "../screens/sessionDrinks";
import SettingsScreen from "../screens/settings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Foundation from "@expo/vector-icons/Foundation";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../styles/theme";

const { width } = Dimensions.get("window");

const Stack = createStackNavigator();

const headerIconSize = width * 0.075;
const headerTitleSize = width * 0.05;
const headerMargin = width * 0.03;

const UserStack = () => {
  const { user } = useAuthContext();

  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.menu,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: "Tørst",
          headerTitleStyle: {
            fontSize: width * 0.075,
            fontWeight: "bold",
          },
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("Settings")}
              style={{ marginRight: headerMargin }}
            >
              <Feather
                name="settings"
                size={headerIconSize}
                color={theme.colors.icon}
              />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="EndedSession"
        component={EndedSessionScreen}
        options={({ navigation, route }) => ({
          title: route.params?.sessionName || "Session",
          headerTitleStyle: {
            fontSize: headerTitleSize,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ marginLeft: headerMargin }}
            >
              <Ionicons
                name="arrow-back"
                size={headerIconSize}
                color={theme.colors.icon}
              />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() =>
                navigation.navigate("SessionDrinks", {
                  sessionId: route.params?.sessionId,
                  sessionName: route.params?.sessionName,
                  sessionStartedAt: route.params?.sessionStartedAt,
                  sessionEndedAt: route.params?.sessionEndedAt,
                  sessionEnded: true,
                })
              }
              style={{ marginRight: headerMargin }}
            >
              <Foundation name="list" size={headerIconSize} color={theme.colors.icon} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="SessionDrinks"
        component={SessionDrinksScreen}
        options={({ navigation, route }) => ({
          title: "Session Drinks",
          headerTitleStyle: {
            fontSize: headerTitleSize,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ marginLeft: headerMargin }}
            >
              <MaterialIcons
                name="arrow-back"
                size={headerIconSize}
                color={theme.colors.icon}
              />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() =>
                navigation.navigate("SessionSettings", {
                  sessionId: route.params?.sessionId,
                  sessionName: route.params?.sessionName,
                  sessionStartedAt: route.params?.sessionStartedAt,
                  sessionEndedAt: route.params?.sessionEndedAt,
                  sessionEnded: true,
                })
              }
              style={[styles.headerButton, { marginRight: headerMargin }]}
            >
              <Feather
                name="settings"
                size={headerIconSize}
                color={theme.colors.icon}
              />
            </Pressable>
          )
        })}
      />
      <Stack.Screen
        name="SessionSettings"
        component={SessionSettingsScreen}
        options={({ navigation, route }) => ({
          title: "Session Settings",
          headerTitleStyle: {
            fontSize: headerTitleSize,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.headerButton, { marginLeft: headerMargin }]}
            >
              <MaterialIcons
                name="arrow-back"
                size={headerIconSize}
                color={theme.colors.icon}
              />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: user.username,
          headerTitleStyle: {
            fontSize: headerTitleSize,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ marginLeft: headerMargin }}
            >
              <Ionicons
                name="arrow-back"
                size={headerIconSize}
                color={theme.colors.icon}
              />
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  
});

export default UserStack;
