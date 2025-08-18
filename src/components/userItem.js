import React from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const UserItemComponent = ({
  userRank,
  username,
  userBAC,
  sessionBAC,
  BACTrending,
  userTotalAlcoholGram,
  sessionTotalAlcoholGram,
  sortingOnBAC,
  borderColor = "transparent",
}) => {
  let userData;
  let userColor;
  let iconName;
  let units;
  if (sortingOnBAC) {
    userColor = userBAC >= sessionBAC ? theme.colors.green : theme.colors.red;
    iconName = BACTrending ? "trending-up" : "trending-down";
    userData = userBAC.toFixed(2) + " ‰";
    units = "";
  } else {
    userColor = userTotalAlcoholGram >= sessionTotalAlcoholGram ? theme.colors.green : theme.colors.red;
    iconName = "beer-outline";
    userData = userTotalAlcoholGram.toFixed(0) + " g";
    units = Math.floor(userTotalAlcoholGram / 13);
  }

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
    21: require("../../assets/trophies/twenty-first.png"),
    22: require("../../assets/trophies/twenty-second.png"),
    23: require("../../assets/trophies/twenty-third.png"),
    24: require("../../assets/trophies/twenty-fourth.png"),
    25: require("../../assets/trophies/twenty-fifth.png"),
    26: require("../../assets/trophies/twenty-sixth.png"),
    27: require("../../assets/trophies/twenty-seventh.png"),
    28: require("../../assets/trophies/twenty-eighth.png"),
    29: require("../../assets/trophies/twenty-ninth.png"),
    30: require("../../assets/trophies/thirtieth.png"),
  };

  const trophyImage = trophiesMap[userRank] || trophiesMap[30]; // TODO: Add more trophies
  const selectedColor = borderColor === "transparent" ? "transparent" : borderColor;

  return (
    <View style={[styles.container, { borderColor: selectedColor }]}>
      <View style={styles.row}>
        <View style={styles.rankContainer}>
          <Image source={trophyImage} style={styles.rankImage} />
          <Text style={styles.username}>
            {username}
          </Text>
        </View>
        
        <View style={styles.dataContainer}>
        {!sortingOnBAC ? (
            <Text style={[styles.userData, { color: "white" }]}>
              {units}
            </Text>
          ) : null}
          {sortingOnBAC ? (
            <MaterialCommunityIcons name={iconName} size={iconSize} color="white" />
          ) : (
            <Image style={styles.icon} source={require("../../assets/icons/beer_bottle.png")}/>
          )}
          <Text style={[styles.userData, { color: userColor }]}>
            {userData}
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
    borderRadius: 10,
    width: width * 0.95,
    height: height * 0.06,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.02,
    borderColor: "transparent",
    borderWidth: 3,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    resizeMode: "contain", 
    width: width * 0.075,
    height: width * 0.075,
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
    color: "white"
  },
  dataContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userData: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginLeft: width * 0.02,
  },
});

export default UserItemComponent;


