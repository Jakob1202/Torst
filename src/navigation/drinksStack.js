import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Pressable, Dimensions } from "react-native";
import DrinksScreen from "../screens/userDrinks";
import CreateUserDrinkScreen from "../screens/createUserDrink";
import EditUserDrinkScreen from "../screens/editUserDrink";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const Stack = createStackNavigator();

const { width } = Dimensions.get("window");
import { theme } from "../styles/theme";

const headerIconSize = width * 0.075;
const headerTitleSize = width * 0.05;
const headerMargin = width * 0.03;

const DrinksStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="DrinksScreen"
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.menu,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Stack.Screen
        name="drinks"
        component={DrinksScreen}
        options={({}) => ({
          title: "Tørst",
          headerTitleStyle: {
            fontSize: headerTitleSize,
          },
        })}
      />

      <Stack.Screen
        name="CreateUserDrink"
        component={CreateUserDrinkScreen}
        options={({ navigation }) => ({
          title: "Create Drink",
          headerTitleStyle: {
            fontSize: headerTitleSize,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ marginLeft: headerMargin }}
            >
              <MaterialIcons name="arrow-back" size={headerIconSize} color={theme.colors.icon}/>
            </Pressable>
          ),
        })}
      />

      <Stack.Screen
        name="EditUserDrink"
        component={EditUserDrinkScreen}
        options={({ navigation }) => ({
          title: "Edit Drink",
          headerTitleStyle: {
            fontSize: headerTitleSize,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ marginLeft: headerMargin }}
            >
              <MaterialIcons name="arrow-back"  size={headerIconSize} color={theme.colors.icon} />
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default DrinksStack;
