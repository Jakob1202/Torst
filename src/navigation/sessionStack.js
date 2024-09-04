import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SessionFeedScreen from "../screens/sessionFeed";
import SessionCreatorScreen from "../screens/sessionCreator";
import CurrentSessionScreen from "../screens/currentSession";
import SessionSettingsScreen from "../screens/sessionSettings";
import AddSessionDrinkScreen from "../screens/addSessionDrink";
import CreateSessionDrinkScreen from "../screens/createSessionDrink";
import EditSessionDrinkScreen from "../screens/editSessionDrink";
import {
  Pressable,
  View,
  Dimensions,
  Alert,
  StyleSheet,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import { theme } from "../styles/theme";

const Stack = createStackNavigator();

const { width } = Dimensions.get("window");

const headerIconSize = width * 0.075;
const headerTitleSize = width * 0.05;
const headerMargin = width * 0.03;

const SessionStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="SessionFeed"
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.menu,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: headerTitleSize,
        },
      }}
    >
      <Stack.Screen
        name="SessionFeed"
        component={SessionFeedScreen}
        options={{
          title: "Tørst",
        }}
      />
      <Stack.Screen
        name="SessionCreator"
        component={SessionCreatorScreen}
        options={({ navigation }) => ({
          title: "Create Session",
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.headerButton, { marginLeft: headerMargin }]}
            >
              <MaterialIcons
                name="arrow-back"
                size={headerIconSize}
                color="white"
              />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="CurrentSession"
        component={CurrentSessionScreen}
        options={({ navigation, route }) => ({
          title: route.params?.sessionName || "Session",
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
          headerRight: () => (
            <View style={styles.headerButtonContainer}>
              <Pressable
                onPress={async () => {
                  const { sessionId } = route.params;
                  await Clipboard.setStringAsync(sessionId);
                  Alert.alert(
                    "Share Session",
                    "Session Key has been copied to clipboard"
                  );
                }}
                style={[styles.headerButton, { marginRight: headerMargin }]}
              >
                <Entypo
                  name="share"
                  size={headerIconSize}
                  color={theme.colors.icon}
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  navigation.navigate("SessionSettings", {
                    sessionId: route.params?.sessionId,
                    sessionStartedAt: route.params?.sessionStartedAt,
                    sessionEndedAt: route.params?.sessionEndedAt,
                    sessionEnded: false,
                    sessionHost: route.params?.sessionHost,
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
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="SessionSettings"
        component={SessionSettingsScreen}
        options={({ navigation, route }) => ({
          title: "Session Drinks",
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
        name="AddSessionDrink"
        component={AddSessionDrinkScreen}
        options={({ navigation, route }) => ({
          title: "Add Drink",
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
          headerRight: () => (
            <Pressable
              onPress={() =>
                navigation.navigate("CreateSessionDrink", {
                  sessionId: route.params?.sessionId,
                  sessionHost: route.params?.sessionHost,
                })
              }
              style={[styles.headerButton, { marginRight: headerMargin }]}
            >
              <MaterialIcons
                name="add-circle-outline"
                size={headerIconSize}
                color={theme.colors.icon}
              />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="CreateSessionDrink"
        component={CreateSessionDrinkScreen}
        options={({ navigation, route }) => ({
          title: "Create Drink",
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
        name="EditSessionDrink"
        component={EditSessionDrinkScreen}
        options={({ navigation, route }) => ({
          title: "Edit Drink",
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

export default SessionStack;

