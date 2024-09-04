import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { useDrinkContext } from "../context/drinkContext";
import Feather from "react-native-vector-icons/Feather";
import RNPickerSelect from "react-native-picker-select";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");
import { theme } from "../styles/theme";

const inputIconSize = height * 0.03;
const inputFieldHeight = height * 0.05;

const CreateUserDrinkScreen = () => {
  const [drinkName, setDrinkName] = useState("");
  const [drinkLitres, setDrinkLitres] = useState("");
  const [drinkABV, setDrinkABV] = useState("");
  const [drinkType, setDrinkType] = useState("");

  const [focusedField, setFocusedField] = useState(null);

  const { createUserDrink, createDrinkLoading } = useDrinkContext();

  const drinkTypeOptions = [
    { label: "Beer", value: "beer" },
    { label: "Wine", value: "wine" },
    { label: "Booze", value: "booze" },
    { label: "Drink", value: "drink" },
  ];

  const handleAddUserDrink = async () => {
    if (
      drinkName.trim() === "" ||
      drinkLitres.trim() === "" ||
      drinkABV.trim() === "" ||
      drinkType === "" ||
      drinkType === null
    ) {
      Alert.alert(
        "Create Drink",
        "Name, litres, alcohol and type cannot be empty"
      );
      return;
    }
    const response = await createUserDrink(
      drinkName,
      drinkLitres,
      drinkABV,
      drinkType
    );
    Alert.alert("Create User Drink", response.message);

    if (response.success) {
      setDrinkName("");
      setDrinkLitres("");
      setDrinkABV("");
      setDrinkType("");
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
            <Ionicons name="beer-outline" size={inputIconSize} style={styles.icon} />
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

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Drink Type</Text>
          <View
            style={[
              styles.drinkTypePickerContainer,
              focusedField === "drinkType" && styles.inputContainerActive,
            ]}
          >
            <AntDesign
              name="question"
              size={inputIconSize}
              style={styles.icon}
            />
            <RNPickerSelect
              onValueChange={(value) => {
                setDrinkType(value);
                setFocusedField("drinkType");
              }}
              items={drinkTypeOptions}
              value={drinkType}
              placeholder={{ label: "Select drink type", value: null }}
              style={{
                inputIOS: [styles.pickerInput, { height: inputFieldHeight }],
                inputAndroid: [styles.pickerInput, { height: inputFieldHeight }],
                placeholder: styles.pickerPlaceholder,
              }}
              onFocus={() => setFocusedField("drinkType")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {createDrinkLoading ? (
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        ) : (
          <TouchableOpacity
            onPress={handleAddUserDrink}
            style={styles.button}
            disabled={createDrinkLoading}
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
  button: {
    backgroundColor: theme.colors.secondary,
    padding: width * 0.03,
    borderRadius: width * 0.02,
    alignItems: "center",
    width: width * 0.9,
    alignSelf: "center",
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
});

export default CreateUserDrinkScreen;

