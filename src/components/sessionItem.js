import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert, Image } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get('window');

const SessionItemComponent = ({
  sessionId,
  sessionName,
  sessionStartedAt,
  sessionEndedAt,
  sessionHost,
  sessionEnded,
  sessionBAC,
}) => {
  const navigation = useNavigation();

  const drinksSource = require("../../assets/icons/drinks.png");

  const handleCopySessionKey = async () => {
    await Clipboard.setStringAsync(sessionId);
    Alert.alert(
      "Share Session",
      "Session Key has been copied to clipboard"
    );
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
          <Image source={drinksSource} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.sessionName}>{sessionName}</Text>
          </View>
          <Text style={styles.sessionBAC}>{sessionBAC.toFixed(2)} ‰</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
    padding: width * 0.02,
    borderRadius: 8,
    width: width * 0.95,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: width * 0.1,
    height: width * 0.1,
    resizeMode: 'contain',
    marginRight: width * 0.02,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionName: {
    color: theme.colors.text,
    fontSize: width * 0.05,
    fontWeight: 'bold',
  },
  sessionBAC: {
    color: "#FFD700",
    fontSize: width * 0.05,
    fontWeight: 'bold',
  },
  pressable: {
    flex: 1,
  },
});

export default SessionItemComponent;
