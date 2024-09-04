import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDrinkContext } from "../context/drinkContext";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const UserDrinkItemComponent = ({
  drinkId,
  drinkName,
  drinkLitres,
  drinkABV,
  drinkType,
  sessionId,
}) => {
  const navigation = useNavigation();
  const { addSessionDrinkToCurrentSessions, addSessionDrinkToCurrentSession } =
    useDrinkContext();

  const drinksMap = {
    beer: require("../../assets/icons//beer.png"),
    wine: require("../../assets/icons/wine.png"),
    booze: require("../../assets/icons/booze_small.png"),
    drink: require("../../assets/icons/drink.png"),
  };
  const drinkImage = drinksMap[drinkType];

  const handleAddToCurrentSessions = async () => {
    const response = await addSessionDrinkToCurrentSessions(drinkId);
    Alert.alert("Add Drink to Sessions", response.message);
  };

  const handleAddToCurrentSession = async () => {
    const response = await addSessionDrinkToCurrentSession(drinkId, sessionId);
    Alert.alert("Add Drink to Session", response.message);
  };

  return (
    <TouchableOpacity
      onPress={() =>
        sessionId ? handleAddToCurrentSession() : handleAddToCurrentSessions()
      }
      onLongPress={() => {
        if (!sessionId) {
          navigation.navigate("EditUserDrink", {
            drinkId,
            drinkName,
            drinkLitres,
            drinkABV,
            drinkType,
          });
        }
      }}
    >
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Image source={drinkImage} style={styles.icon} color={"blue"} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.drinkName}>{drinkName}</Text>
          <View style={styles.row}>
            <Text style={styles.drinkLitres}>{drinkLitres} L</Text>
            <Text style={styles.drinkABV}>{drinkABV} %</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    padding: width * 0.02,
    borderRadius: 8,
    width: width * 0.95,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.05,
    width: height * 0.05,
  },
  icon: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  drinkName: {
    color: theme.colors.text,
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
  drinkLitres: {
    color: theme.colors.text,
    fontSize: width * 0.05,
  },
  drinkABV: {
    color: theme.colors.text,
    fontSize: width * 0.05,
  },
});

export default UserDrinkItemComponent;
