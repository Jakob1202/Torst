import React from "react";
import { Pressable, Dimensions } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuthContext } from "../context/authContext";
import ProfileScreen from "../screens/profile";
import EndedSessionScreen from "../screens/endedSession";
import SessionDrinksScreen from "../screens/sessionSettings";
import SettingsScreen from "../screens/settings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../styles/theme";

const { width } = Dimensions.get("window");

const Stack = createStackNavigator();

const headerIconSize = width * 0.075;
const headerTitleSize = width * 0.05;
const headerMargin = width * 0.03;

const ProfileStack = () => {
  const { user } = useAuthContext();

  const userIcon = user.gender === "male" ? "user" : "user-female";

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
            fontSize: headerTitleSize,
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
                  sessionStartedAt: route.params?.sessionStartedAt,
                  sessionEndedAt: route.params?.sessionEndedAt,
                  sessionEnded: true,
                })
              }
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
        name="SessionDrinks"
        component={SessionDrinksScreen}
        options={({ navigation }) => ({
          title: "Drinks",
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

export default ProfileStack;
