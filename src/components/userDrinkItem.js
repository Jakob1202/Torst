import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useDrinkContext } from "../context/drinkContext";
import { Fontisto } from "@expo/vector-icons";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const inputIconSize = height * 0.03;

const UserDrinkItemComponent = ({
  drinkId,
  drinkName,
  drinkLitres,
  drinkABV,
  drinkType,
  sessionId,
}) => {
  const navigation = useNavigation();
  const { addSessionDrinkToCurrentSessions, addSessionDrinkToCurrentSession, addDrinkLoading } =
    useDrinkContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [drankAt, setDrankAt] = useState(new Date());

  const drinksMap = {
    beer_bottle: require("../../assets/icons//beer_bottle.png"),
    beer_glass: require("../../assets/icons/beer_glass.png"),
    beer_can: require("../../assets/icons/beer_can.png"),
    wine: require("../../assets/icons/wine.png"),
    booze: require("../../assets/icons/booze_small.png"),
    drink: require("../../assets/icons/drink.png"),
  };
  const drinkImage = drinksMap[drinkType];

  useEffect(() => {
    const interval = setInterval(() => {
      setDrankAt(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleDateConfirm = (event, date) => {
    if (date) {
      setDrankAt(prevDate => new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        prevDate.getHours(),
        prevDate.getMinutes(),
        prevDate.getSeconds()
      ));
    }
  };

  const handleTimeConfirm = (event, time) => {
    if (time) {
      setDrankAt(prevDate => new Date(
        prevDate.getFullYear(),
        prevDate.getMonth(),
        prevDate.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
      ));
    }
  };

  const handleAddToCurrentSessions = async () => {
    if (!drankAt) {
      Alert.alert("Invalid Input", "Please select a time for when you drank the drink.");
      return;
    }

    const response = await addSessionDrinkToCurrentSessions(drinkId, new Date(drankAt));
    if (response.success) {
      setModalVisible(false);
    } else {
      Alert.alert("Add Drink to Sessions", response.message);
    }
  };

  const handleAddToCurrentSession = async () => {
    if (!drankAt) {
      Alert.alert("Invalid Input", "Please select a time for when you drank the drink.");
      return;
    }

    const response = await addSessionDrinkToCurrentSession(drinkId, sessionId, new Date(drankAt));
    if (response.success) {
      setModalVisible(false);
    } else {
      Alert.alert("Add Drink to Session", response.message);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
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
            <Image source={drinkImage} style={styles.icon} />
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={styles.headerText}>Select Drink Time</Text>
              <View
                style={
                  styles.dateTimeContainer}
              >
                <Fontisto name="date" size={inputIconSize} style={styles.dateIcon} />

                <RNDateTimePicker
                  value={drankAt}
                  mode="date"
                  display="default"
                  onChange={handleDateConfirm}
                  style={styles.dateTimePicker}
                />

                <RNDateTimePicker
                  value={drankAt}
                  mode="time"
                  display="default"
                  onChange={handleTimeConfirm}
                  style={styles.dateTimePicker}
                />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              {addDrinkLoading ? (
                <ActivityIndicator size="large" color={theme.colors.secondary} />
              ) : (
                <TouchableOpacity
                  onPress={sessionId ? handleAddToCurrentSession : handleAddToCurrentSessions}
                  style={styles.submitButton}
                >
                  <Text style={styles.buttonText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    padding: width * 0.05,
    borderRadius: 10,
    width: width * 0.9,
    alignItems: "center",
  },
  inputSection: {
    marginBottom: height * 0.03,
    width: "100%",
  },
  headerText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.05,
    marginBottom: height * 0.01,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: width * 0.02,
    borderWidth: width * 0.005,
    borderColor: theme.colors.text,
    padding: width * 0.02,
  },
  dateTimePicker: {
    flex: 1,
    marginHorizontal: width * 0.02,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: width * 0.8,
  },
  cancelButton: {
    backgroundColor: theme.colors.remove,
    padding: height * 0.015,
    borderRadius: width * 0.02,
    alignItems: "center",
    width: width * 0.25,
  },
  submitButton: {
    backgroundColor: theme.colors.secondary,
    padding: height * 0.015,
    borderRadius: width * 0.02,
    alignItems: "center",
    width: width * 0.25,
  },

  buttonText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  dateIcon: {
    marginRight: width * 0.02,
    color: theme.colors.text,
  },

});

export default UserDrinkItemComponent;
