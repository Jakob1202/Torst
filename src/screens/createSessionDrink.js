import React, { useState, useEffect } from "react";
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
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { useDrinkContext } from "../context/drinkContext";
import { useAuthContext } from "../context/authContext";
import RNPickerSelect from "react-native-picker-select";
import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import Fontisto from "@expo/vector-icons/Fontisto";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const inputIconSize = height * 0.03;
const inputFieldHeight = height * 0.05;

const CreateSessionDrinkScreen = ({ route }) => {
  const { sessionId, sessionHost } = route.params;

  const [drinkName, setDrinkName] = useState("");
  const [drinkLitres, setDrinkLitres] = useState("");
  const [drinkABV, setDrinkABV] = useState("");
  const [drinkDate, setDrinkDate] = useState(new Date());
  const [drinkType, setDrinkType] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  const [focusedField, setFocusedField] = useState(null);

  const navigation = useNavigation();

  const { user } = useAuthContext();
  const { createSessionDrink, createUserDrink, createDrinkLoading } =
    useDrinkContext();

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
      setDrinkDate(
        (prevDate) =>
          new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            prevDate.getHours(),
            prevDate.getMinutes(),
            prevDate.getSeconds()
          )
      );
    }
  };

  const handleTimeConfirm = (event, time) => {
    if (time) {
      setDrinkDate(
        (prevDate) =>
          new Date(
            prevDate.getFullYear(),
            prevDate.getMonth(),
            prevDate.getDate(),
            time.getHours(),
            time.getMinutes(),
            time.getSeconds()
          )
      );
    }
  };

  const handleCreateSessionDrink = async () => {
    if (
      drinkName.trim() === "" ||
      drinkLitres.trim() === "" ||
      drinkABV.trim() === "" ||
      drinkType === "" ||
      drinkType === null ||
      drinkDate === "" ||
      drinkDate === null
    ) {
      Alert.alert(
        "Create Drink",
        "Name, litres, alcohol, type, and date cannot be empty"
      );
      return;
    }

    const response = await createSessionDrink(
      sessionId,
      drinkName,
      drinkLitres,
      drinkABV,
      drinkType,
      drinkDate
    );

    Alert.alert("Create Session Drink", response.message);

    if (response.success) {
      setDrinkName("");
      setDrinkLitres("");
      setDrinkABV("");
      setDrinkType("");

      if (isChecked) {
        setIsChecked(!isChecked);
      }
    } else {
      return;
    }

    if (isChecked) {
      const response = await createUserDrink(
        drinkName,
        drinkLitres,
        drinkABV,
        drinkType
      );

      if (!response.success) {
        Alert.alert("Create Session Drink", response.message);
        return;
      }
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
              focusedField === "drinkName" && styles.inputContainerActive,
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
              value={drinkName}
              autoCapitalize="none"
              onChangeText={setDrinkName}
              onFocus={() => setFocusedField("drinkName")}
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
                focusedField === "drinkLitres" && styles.inputContainerActive,
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
                value={drinkLitres}
                autoCapitalize="none"
                onChangeText={setDrinkLitres}
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
                focusedField === "drinkABV" && styles.inputContainerActive,
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
                value={drinkABV}
                autoCapitalize="none"
                onChangeText={setDrinkABV}
                keyboardType="numeric"
                onFocus={() => setFocusedField("drinkABV")}
                onBlur={() => setFocusedField(null)}
                style={[styles.input, { height: inputFieldHeight }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.drinkTypeContainer}>
            <Text style={styles.headerText}>Drink Type</Text>
            <View style={styles.drinkTypePickerContainer}>
              <AntDesign
                name="question"
                size={inputIconSize}
                style={styles.icon}
              />
              <RNPickerSelect
                onValueChange={(value) => {
                  setDrinkType(value);
                }}
                items={drinkTypeOptions}
                value={drinkType}
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

          <View style={styles.checkboxContainer}>
            <Text style={styles.checkboxHeaderText}>Save</Text>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setIsChecked(!isChecked)}
            >
              {isChecked ? (
                <Fontisto
                  name="checkbox-active"
                  size={width * 0.1}
                  color={theme.colors.secondary}
                />
              ) : (
                <Fontisto
                  name="checkbox-passive"
                  size={width * 0.1}
                  color={theme.colors.text}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Date and Time</Text>
          <View style={styles.dateTimeContainer}>
            <Fontisto name="date" size={inputIconSize} style={styles.icon} />

            <RNDateTimePicker
              value={drinkDate}
              mode="date"
              display="default"
              onChange={handleDateConfirm}
              style={styles.dateTimePicker}
            />

            <RNDateTimePicker
              value={drinkDate}
              mode="time"
              display="default"
              onChange={handleTimeConfirm}
              style={styles.dateTimePicker}
            />
          </View>
        </View>

        {createDrinkLoading ? (
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        ) : (
          <TouchableOpacity
            onPress={handleCreateSessionDrink}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Create Drink</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  drinkTypeContainer: {
    flex: 4,
    marginRight: width * 0.02,
  },
  drinkTypePickerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: width * 0.02,
    borderWidth: width * 0.005,
    borderColor: theme.colors.text,
    paddingHorizontal: width * 0.02,
  },
  checkboxContainer: {
    flex: 1,
    alignItems: "flex-end",
    marginTop: height * 0.002,
  },
  headerText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.05,
    marginBottom: height * 0.01,
  },
  checkboxHeaderText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.05,
    marginBottom: height * 0.01,
    marginTop: -height * 0.006,
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
  inputContainerActive: {
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
    color: theme.colors.icon,
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
  button: {
    padding: width * 0.03,
    borderRadius: width * 0.02,
    alignItems: "center",
    alignSelf: "center",
    width: width * 0.9,
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
});

export default CreateSessionDrinkScreen;
