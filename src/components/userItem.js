import React from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const UserItemComponent = ({
  userRank,
  username,
  userBAC,
  sessionBAC,
  BACTrending,
  borderColor = "transparent", 
}) => {
  const userBACColor = userBAC >= sessionBAC ? theme.colors.green : theme.colors.red;
  const iconName = BACTrending ? "trending-up" : "trending-down";
  const iconSize = Math.min(width, height) * 0.08;

  const trophiesMap = {
    1: require("../../assets/trophies/first.png"),
    2: require("../../assets/trophies/second.png"),
    3: require("../../assets/trophies/third.png"),
    4: require("../../assets/trophies/fourth.png"),
    5: require("../../assets/trophies/fifth.png"),
    6: require("../../assets/trophies/sixth.png"),
    7: require("../../assets/trophies/seventh.png"),
    8: require("../../assets/trophies/eighth.png"),
    9: require("../../assets/trophies/ninth.png"),
    10: require("../../assets/trophies/tenth.png"),
    11: require("../../assets/trophies/eleventh.png"),
    12: require("../../assets/trophies/twelfth.png"),
    13: require("../../assets/trophies/thirteenth.png"),
    14: require("../../assets/trophies/fourteenth.png"),
    15: require("../../assets/trophies/fifteenth.png"),
    16: require("../../assets/trophies/sixteenth.png"),
    17: require("../../assets/trophies/seventeenth.png"),
    18: require("../../assets/trophies/eighteenth.png"),
    19: require("../../assets/trophies/nineteenth.png"),
    20: require("../../assets/trophies/twentieth.png"),
  };

  const trophyImage = trophiesMap[userRank] || trophiesMap[20]; // TODO: Add more trophies
  const usernameTextColor = borderColor === "transparent" ? "white" : borderColor;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.rankContainer}>
          <Image source={trophyImage} style={styles.rankImage} />
          <Text style={[styles.username, { color: usernameTextColor }]}>
            {username}
          </Text>
        </View>
        <View style={styles.bacContainer}>
          <Feather name={iconName} size={iconSize} color="white" />
          <Text style={[styles.userBAC, { color: userBACColor }]}>
            {userBAC.toFixed(2)} ‰
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    padding: width * 0.02,
    borderRadius: 8,
    width: width * 0.9,
    height: height * 0.06,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.02,
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  rankContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankImage: {
    width: width * 0.1,
    height: width * 0.1,
    resizeMode: "contain",
    marginRight: width * 0.02,
  },
  username: {
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
  bacContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userBAC: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginLeft: width * 0.02,
  },
});

export default UserItemComponent;


