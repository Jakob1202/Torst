import React, { useState, useEffect} from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Platform,
  Alert,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from "react-native";
import { useDrinkContext } from "../context/drinkContext";
import { useAuthContext } from "../context/authContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import Ionicons from "@expo/vector-icons/Ionicons";
import Fontisto from "@expo/vector-icons/Fontisto";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import moment from "moment";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const inputIconSize = height * 0.03;
const inputFieldHeight = height * 0.05;

const EditSessionDrinkScreen = ({ route, navigation }) => {
  const {
    sessionId,
    sessionHost,
    drinkId,
    drinkName,
    drinkLitres,
    drinkABV,
    drinkType,
    drinkDay,
    drinkTime,
  } = route.params;

  const drinkDate = moment(`${drinkDay} ${drinkTime}`, "DD/MM/YYYY HH:mm:ss").toDate();

  const [newDrinkName, setNewDrinkName] = useState(drinkName);
  const [newDrinkLitres, setNewDrinkLitres] = useState(drinkLitres.toString());
  const [newDrinkABV, setNewDrinkABV] = useState(drinkABV.toString());
  const [newDrinkType, setNewDrinkType] = useState(drinkType);
  const [newDrinkDate, setNewDrinkDate] = useState(drinkDate);

  const [focusedField, setFocusedField] = useState(null);

  const { user } = useAuthContext();
  const {
    updateSessionDrink,
    deleteSessionDrink,
    updateDrinkLoading,
    deleteDrinkLoading,
  } = useDrinkContext();

  useEffect(() => {
    const sessionDocRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const sessionData = docSnap.data();

        const sessionEndedAt = sessionData.endedAt;
        if (sessionEndedAt !== null && sessionHost !== user.id) {
          navigation.navigate("SessionFeed");
          Alert.alert("Session Ended", "Session has ended");
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, navigation]);

  const drinkTypeOptions = [
    { label: "Beer", value: "beer" },
    { label: "Wine", value: "wine" },
    { label: "Booze", value: "booze" },
    { label: "Drink", value: "drink" },
  ];

  const handleDateConfirm = (event, date) => {
    if (date) {
      setNewDrinkDate(prevDate => new Date(
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
      setNewDrinkDate(prevDate => new Date(
        prevDate.getFullYear(),
        prevDate.getMonth(),
        prevDate.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
      ));
    }
  };

  const handleUpdateSessionDrink = async () => {
    if (
      newDrinkName.trim() === "" ||
      newDrinkLitres.trim() === "" ||
      newDrinkABV.trim() === "" ||
      newDrinkType === "" ||
      newDrinkType === null ||
      newDrinkDate === "" ||
      newDrinkDate === null
    ) {
      Alert.alert(
        "Update Session Drink",
        "Name, litres, and alcohol cannot be empty"
      );
      return;
    }
    const response = await updateSessionDrink(
      sessionId,
      drinkId,
      newDrinkName,
      newDrinkLitres,
      newDrinkABV,
      newDrinkType,
      newDrinkDate
    );

    Alert.alert("Update Session Drink", response.message);

  };

  const handleDeleteSessionDrink = async () => {
    const response = await deleteSessionDrink(sessionId, drinkId);
    if (response.success) {
      navigation.navigate("SessionSettings", {
        sessionId: sessionId,
      });
    } else {
      Alert.alert("Deleting Session Drink", response.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Drink Name</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "newName" && styles.inputContainerFocused,
            ]}
          >
            <Ionicons
              name="beer-outline"
              size={inputIconSize}
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter drink name"
              placeholderTextColor={theme.colors.placeholder}
              value={newDrinkName}
              autoCapitalize="none"
              onChangeText={setNewDrinkName}
              onFocus={() => setFocusedField("newName")}
              onBlur={() => setFocusedField(null)}
              style={[styles.input, { height: inputFieldHeight }]}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.leftInputField}>
            <Text style={styles.headerText}>Size in L</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === "drinkLitres" && styles.inputContainerFocused,
              ]}
            >
              <Feather
                name="droplet"
                size={inputIconSize}
                style={styles.icon}
              />
              <TextInput
                placeholder="Enter size in litres"
                placeholderTextColor={theme.colors.placeholder}
                value={newDrinkLitres}
                autoCapitalize="none"
                onChangeText={setNewDrinkLitres}
                keyboardType="numeric"
                onFocus={() => setFocusedField("drinkLitres")}
                onBlur={() => setFocusedField(null)}
                style={[styles.input, { height: inputFieldHeight }]}
              />
            </View>
          </View>

          <View style={styles.rightInputField}>
            <Text style={styles.headerText}>Alcohol in %</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === "drinkABV" && styles.inputContainerFocused,
              ]}
            >
              <Feather
                name="percent"
                size={inputIconSize}
                style={styles.icon}
              />
              <TextInput
                placeholder="Enter alcohol percentage"
                placeholderTextColor={theme.colors.placeholder}
                value={newDrinkABV}
                autoCapitalize="none"
                onChangeText={setNewDrinkABV}
                keyboardType="numeric"
                onFocus={() => setFocusedField("drinkABV")}
                onBlur={() => setFocusedField(null)}
                style={[styles.input, { height: inputFieldHeight }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Drink Type</Text>
          <View
            style={
              styles.drinkTypePickerContainer}
          >
            <AntDesign
              name="question"
              size={inputIconSize}
              style={styles.icon}
            />

            <RNPickerSelect
              onValueChange={(value) => {
                setNewDrinkType(value);

              }}
              items={drinkTypeOptions}
              value={newDrinkType}
              placeholder={{ label: "Select drink type", value: null }}
              style={{
                inputIOS: [styles.pickerInput, { height: inputFieldHeight }],
                inputAndroid: [
                  styles.pickerInput,
                  { height: inputFieldHeight },
                ],
                placeholder: styles.pickerPlaceholder,
              }}

            />

          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Date and Time</Text>
          <View
            style={
              styles.dateTimeContainer}
          >
            <Fontisto name="date" size={inputIconSize} style={styles.icon} />

            <RNDateTimePicker
              value={newDrinkDate}
              mode="date"
              display="default"
              onChange={handleDateConfirm}
              style={styles.dateTimePicker}
            />

            <RNDateTimePicker
              value={newDrinkDate}
              mode="time"
              display="default"
              onChange={handleTimeConfirm}
              style={styles.dateTimePicker}
            />
          </View>
        </View>

        {updateDrinkLoading ? (
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        ) : (
          <TouchableOpacity
            onPress={handleUpdateSessionDrink}
            style={[styles.button, styles.updateButton]}
            disabled={updateDrinkLoading}
          >
            <Text style={styles.buttonText}>Save Drink</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.deleteButtonContainer}>
        {deleteDrinkLoading ? (
          <ActivityIndicator size="large" color={theme.colors.remove} />
        ) : (
          <TouchableOpacity
            onPress={handleDeleteSessionDrink}
            style={[styles.button, styles.deleteButton]}
            disabled={deleteDrinkLoading}
          >
            <Text style={styles.buttonText}>Delete Drink</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.03,
    paddingTop:
      Platform.OS === "ios"
        ? height * 0.02
        : StatusBar.currentHeight + height * 0.02,
  },
  inputSection: {
    marginBottom: height * 0.03,
  },
  dateTimeSection: {
    marginBottom: height * 0.04,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.03,
  },
  leftInputField: {
    flex: 1,
    marginRight: width * 0.02,
  },
  rightInputField: {
    flex: 1,
    marginLeft: width * 0.02,
  },
  headerText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.05,
    marginBottom: height * 0.01,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: width * 0.02,
    borderWidth: width * 0.005,
    borderColor: theme.colors.text,
    paddingHorizontal: width * 0.02,
  },
  inputContainerFocused: {
    borderColor: theme.colors.secondary,
  },
  input: {
    flex: 1,
    paddingVertical: width * 0.02,
    paddingHorizontal: width * 0.02,
    fontSize: width * 0.045,
    color: theme.colors.text,
  },
  icon: {
    marginRight: width * 0.02,
    color: theme.colors.text,
  },
  drinkTypePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: width * 0.02,
    borderWidth: width * 0.005,
    borderColor: theme.colors.text,
    paddingHorizontal: width * 0.02,
  },
  pickerInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: width * 0.045,
    marginLeft: width * 0.02,
  },
  pickerPlaceholder: {
    color: theme.colors.placeholder,
    fontSize: width * 0.045,
    marginLeft: width * 0.02,
  },
  dateTimeContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: width * 0.02,
    borderWidth: width * 0.005,
    borderColor: theme.colors.text,
    paddingHorizontal: width * 0.02,
  },
  dateTimePicker: {
    backgroundColor: theme.colors.background,
    color: "white",
  },
  deleteButton: {
    backgroundColor: theme.colors.remove,
    padding: width * 0.03,
    borderRadius: width * 0.02,
    alignItems: "center",
    width: width * 0.9,
    alignSelf: "center",
  },
  deleteButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.03,
    alignItems: "center",
  },
  button: {
    padding: width * 0.03,
    borderRadius: width * 0.02,
    alignItems: "center",
    width: width * 0.9,
    alignSelf: "center",
  },
  updateButton: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
});

export default EditSessionDrinkScreen;




