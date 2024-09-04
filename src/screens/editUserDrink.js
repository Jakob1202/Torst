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
import { useNavigation } from "@react-navigation/native";
import { useDrinkContext } from "../context/drinkContext";
import Feather from "react-native-vector-icons/Feather";
import RNPickerSelect from "react-native-picker-select";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const inputIconSize = height * 0.03;
const inputFieldHeight = height * 0.05;

const EditUserDrinkScreen = ({ route }) => {
  const { drinkId, drinkName, drinkLitres, drinkABV, drinkType } = route.params;
  const navigation = useNavigation();

  const [newDrinkName, setNewDrinkName] = useState(drinkName);
  const [newDrinkLitres, setNewDrinkLitres] = useState(drinkLitres.toString());
  const [newDrinkABV, setNewDrinkABV] = useState(drinkABV.toString());
  const [newDrinkType, setNewDrinkType] = useState(drinkType);
  const [focusedField, setFocusedField] = useState(null);

  const {
    updateUserDrink,
    deleteUserDrink,
    updateDrinkLoading,
    deleteDrinkLoading,
  } = useDrinkContext();

  const drinkTypeOptions = [
    { label: "Beer", value: "beer" },
    { label: "Wine", value: "wine" },
    { label: "Booze", value: "booze" },
    { label: "Drink", value: "drink" },
  ];

  const handleUpdateUserDrink = async () => {
    if (
      newDrinkName.trim() === "" ||
      newDrinkLitres.trim() === "" ||
      newDrinkABV.trim() === "" ||
      newDrinkType === "" ||
      newDrinkType === null
    ) {
      Alert.alert(
        "Update User Drink",
        "Name, litres, and alcohol cannot be empty"
      );
      return;
    }
    const response = await updateUserDrink(
      drinkId,
      newDrinkName,
      newDrinkLitres,
      newDrinkABV,
      newDrinkType
    );

    Alert.alert("Update User Drink", response.message);

  };

  const handleDeleteUserDrink = async () => {
    const response = await deleteUserDrink(drinkId);

    if (response.success) {
      navigation.goBack()
    } else {
      Alert.alert("Deleting User Drink", response.message);
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
              focusedField === "newDrinkName" && styles.inputContainerActive,
            ]}
          >
            <Ionicons name="beer-outline" size={inputIconSize} style={styles.icon} />
            <TextInput
              placeholder="Enter drink name"
              placeholderTextColor={theme.colors.placeholder}
              value={newDrinkName}
              autoCapitalize="none"
              onChangeText={setNewDrinkName}
              onFocus={() => setFocusedField("newDrinkName")}
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
              styles.drinkTypePickerContainer
            }
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
                inputAndroid: [styles.pickerInput, { height: inputFieldHeight }],
                placeholder: styles.pickerPlaceholder,
              }}
              onFocus={() => setFocusedField("newDrinkType")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {updateDrinkLoading ? (
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        ) : (
          <TouchableOpacity
            onPress={handleUpdateUserDrink}
            style={styles.button}
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
            onPress={handleDeleteUserDrink}
            style={styles.deleteButton}
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
  headerText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.05,
    marginBottom: height * 0.01,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: width * 0.02,
    borderWidth: 2,
    borderColor: theme.colors.text,
    paddingHorizontal: width * 0.02,
  },
  inputContainerActive: {
    borderColor: theme.colors.secondary,
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
    color: "white",
    fontSize: width * 0.045,
    marginLeft: width * 0.02,
  },
  pickerPlaceholder: {
    color: "#B0B0B0",
    fontSize: width * 0.045,
    marginLeft: width * 0.02,
  },
  input: {
    flex: 1,
    padding: width * 0.02,
    fontSize: width * 0.045,
    color: "white",
  },
  icon: {
    marginRight: width * 0.02,
    color: "white",
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
    color: "white",
    fontSize: width * 0.045,
    fontWeight: "bold",
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
});

export default EditUserDrinkScreen;


