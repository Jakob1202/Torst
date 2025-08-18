import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert, Image } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../styles/theme";
import Feather from "@expo/vector-icons/Feather";
import Fontisto from '@expo/vector-icons/Fontisto';

const { width, height } = Dimensions.get('window');

const iconSize = Math.min(width, height) * 0.08;

const SessionItemComponent = ({
  sessionId,
  sessionName,
  sessionHost,
  sessionStartedAt,
  sessionEndedAt,
  sessionEnded,
  sessionSort,
  sessionBAC,
  sessionTotalAlcoholGrams,
  sessionTotalUsers,
  sessionTrending,
  sessionsAverageBAC,
}) => {
  let sessionData;
  let sessionColor;
  let iconName;
  let units;
  if (sessionSort === "bac") {
    sessionData = sessionBAC.toFixed(2) + " ‰";
    sessionColor = "#FFD700"
    iconName = sessionTrending ? "trending-up" : "trending-down";
  } else if (sessionSort === "grams") {
    sessionData = sessionTotalAlcoholGrams.toFixed(0) + " g";
    sessionColor = "#FF6F61"
    iconName = "beer-outline";
    units = Math.floor(sessionTotalAlcoholGrams / 13);
  } else if (sessionSort === "users") {
    sessionData = sessionTotalUsers;
    sessionColor = "#4FD1C5"
    iconName = "users";
  } else if (sessionSort === "date") {
    const date = new Date(sessionEndedAt.seconds * 1000);
    const day = date.toLocaleDateString();
    sessionData = day;
    sessionColor = "#BEE3F8";
    iconName = "calendar";
  }

  const navigation = useNavigation();

  const sessionSource = require("../../assets/icons/drinks.png");

  const handleCopySessionKey = async () => {
    if (!sessionEnded) {
      await Clipboard.setStringAsync(sessionId);
      Alert.alert(
        "Share Session",
        "Session Key has been copied to clipboard"
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          if (sessionEnded) {
            navigation.navigate("EndedSession", {
              sessionId: sessionId,
              sessionName: sessionName,
              sessionEndedAt: sessionEndedAt,
              sessionStartedAt: sessionStartedAt,
            });
          } else {
            navigation.navigate("CurrentSession", {
              sessionId: sessionId,
              sessionName: sessionName,
              sessionEndedAt: sessionEndedAt,
              sessionStartedAt: sessionStartedAt,
              sessionHost: sessionHost,
            });
          }
        }}
        onLongPress={handleCopySessionKey}
        style={styles.pressable}
      >
        <View style={styles.row}>
          <View style={styles.rankContainer}>
            <Image source={sessionSource} style={styles.sessionIcon} />
            <Text style={styles.sessionName}>{sessionName}</Text>
          </View>

          <View style={styles.dataContainer}>
            <Text style={[styles.sessionData, { color: 'white' }]}>{units}</Text>
            {sessionSort === "bac" && (
              <Feather name={iconName} size={iconSize} color="white" />
            )}
            {sessionSort === "grams" && (
              <Image style={styles.drinkIcon} source={require("../../assets/icons/beer_bottle.png")} />
            )}
            {sessionSort === "users" && (
              <Feather name={iconName} size={iconSize} color="white" />
            )}
            {sessionSort === "date" && (
              <Fontisto name={iconName} size={iconSize} color="white" />
            )}
            <Text style={[styles.sessionData, { color: sessionColor }]}>{sessionData}</Text>
          </View>
        </View>
      </TouchableOpacity>
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
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rankContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionName: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "white"
  },
  sessionData: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginLeft: width * 0.02,
  },
  dataContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pressable: {
    flex: 1,
  },
  sessionIcon: {
    width: width * 0.1,
    height: width * 0.1,
    resizeMode: 'contain',
    marginRight: width * 0.02,
    marginBottom: width * 0.02,
  },
  drinkIcon: {
    width: width * 0.075,
    height: width * 0.075,
    resizeMode: 'contain',
  },

});

export default SessionItemComponent;
