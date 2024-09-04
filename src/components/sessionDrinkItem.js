import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { formatDateTime } from "../utilities/timeUtilities";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const SessionDrinkItemComponent = ({
  drinkId,
  drinkName,
  drinkLitres,
  drinkABV,
  drinkType,
  drinkDate,
  sessionEnded,
  sessionId,
}) => {
  const navigation = useNavigation();

  const drinksMap = {
    beer: require("../../assets/icons//beer.png"),
    wine: require("../../assets/icons/wine.png"),
    booze: require("../../assets/icons/booze_small.png"),
    drink: require("../../assets/icons/drink.png"),
  };
  const drinkImage = drinksMap[drinkType];

  const { day: drinkDay, time: drinkTime } = formatDateTime(drinkDate);

  return (
    <TouchableOpacity
      onLongPress={() => {
        if (!sessionEnded) {
          navigation.navigate("EditSessionDrink", {
            drinkId: drinkId,
            drinkName: drinkName,
            drinkABV: drinkABV,
            drinkLitres: drinkLitres,
            drinkType: drinkType,
            drinkDay: drinkDay,
            drinkTime: drinkTime,
            sessionId: sessionId,
          });
        }
      }}
    >
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Image source={drinkImage} style={styles.icon} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.topRow}>
            <Text style={styles.drinkName}>{drinkName}</Text>
            <Text style={styles.drinkDay}>{drinkDay}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.drinkLitres}>{drinkLitres} L</Text>
            <Text style={styles.drinkABV}>{drinkABV} %</Text>
            <Text style={styles.drinkTime}>{drinkTime}</Text>
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
    paddingLeft: width * 0.02,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  drinkName: {
    color: theme.colors.text,
    fontSize: width * 0.05,
    fontWeight: "bold",
    flex: 1,
  },
  drinkDay: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.05,
    textAlign: "right",
    flex: 1,
  },
  drinkLitres: {
    color: theme.colors.text,
    fontSize: width * 0.05,
    flex: 1,
    textAlign: "left",
  },
  drinkABV: {
    color: theme.colors.text,
    fontSize: width * 0.05,
    flex: 1,
  },
  drinkTime: {
    color: theme.colors.text,
    fontSize: width * 0.05,
    flex: 1,
    textAlign: "right",
  },
});

export default SessionDrinkItemComponent;
