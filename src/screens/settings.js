import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { useAuthContext } from "../context/authContext";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const inputIconSize = height * 0.03;
const inputFieldHeight = height * 0.05;

const SettingsScreen = () => {
  const { user, signOut_, updateUser, resetPassword, loading } =
    useAuthContext();

  const [newUsername, setNewUserName] = useState(user.username || "");
  const [newGender, setNewGender] = useState(user.gender || "");
  const [newWeight, setNewWeight] = useState(
    user.weight ? user.weight.toString() : ""
  );

  const [focusedField, setFocusedField] = useState(null);

  const handleSignOut = async () => {
    await signOut_();
  };

  const handleResetPassword = async () => {
    const response = await resetPassword();
    Alert.alert("Reset User", response.message);
  };

  const handleUpdateUser = async () => {
    if (
      newUsername.trim() === "" ||
      newGender === "" ||
      newGender === null ||
      newWeight.trim() === ""
    ) {
      Alert.alert(
        "Updating User",
        "Username, gender, and weight cannot be empty"
      );
      return;
    }

    const response = await updateUser(newUsername, newGender, newWeight);
    setFocusedField(null);
    Alert.alert("Update User", response.message);

  };

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.inputSection}>
            <Text style={styles.headerText}>Username</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === "username" && styles.inputContainerActive,
              ]}
            >
              <FontAwesome
                name="user"
                size={inputIconSize}
                style={styles.icon}
              />
              <TextInput
                placeholder="Enter your username"
                placeholderTextColor="#B0B0B0"
                value={newUsername}
                autoCapitalize="none"
                onChangeText={setNewUserName}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                style={[styles.input, { height: inputFieldHeight }]}
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.headerText}>Gender</Text>
            <View
              style={
                styles.pickerContainer}
            >
              <AntDesign
                name="question"
                size={inputIconSize}
                color="white"
                style={styles.icon}
              />
              <RNPickerSelect
                onValueChange={(value) => {
                  setNewGender(value);

                }}
                items={genderOptions}
                value={newGender}
                placeholder={{ label: "Select gender", value: null }}
                style={{
                  inputIOS: [styles.pickerInput, { height: inputFieldHeight }],
                  inputAndroid: [
                    styles.pickerInput,
                    { height: inputFieldHeight },
                  ],
                  placeholder: styles.pickerPlaceholder,
                  iconContainer: styles.pickerIconContainer,
                }}
                onFocus={() => setFocusedField("gender")}
                onBlur={() => setFocusedField(null)}
                disabled={loading}
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.headerText}>Weight (kg)</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === "weight" && styles.inputContainerActive,
              ]}
            >
              <FontAwesome6
                name="weight-scale"
                size={inputIconSize}
                style={styles.icon}
              />
              <TextInput
                placeholder="Enter your weight"
                placeholderTextColor="#B0B0B0"
                keyboardType="numeric"
                value={newWeight}
                onChangeText={setNewWeight}
                onFocus={() => setFocusedField("weight")}
                onBlur={() => setFocusedField(null)}
                style={[styles.input, { height: inputFieldHeight }]}
              />
            </View>
          </View>

          <View style={styles.resetPasswordContainer}>
            <TouchableOpacity onPress={handleResetPassword}>
              <Text style={styles.resetPasswordText}>Reset Password?</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.secondary} />
          ) : (
            <TouchableOpacity
              onPress={handleUpdateUser}
              style={[styles.button, styles.updateButton]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.signOutButtonContainer}>
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.button, styles.logOutButton]}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
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
  formContainer: {
    flex: 1,
    marginBottom: height * 0.1,
  },
  inputSection: {
    marginBottom: height * 0.03,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: width * 0.05,
    marginBottom: height * 0.01,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.text,
    borderRadius: width * 0.02,
    borderWidth: width * 0.005,
    paddingHorizontal: width * 0.02,
  },
  inputContainerActive: {
    borderColor: theme.colors.primary,
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
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.text,
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.02,
  },
  pickerInput: {
    flex: 1,
    fontSize: width * 0.045,
    color: "white",
  },
  pickerPlaceholder: {
    color: theme.colors.placeholder,
    fontSize: width * 0.045,
  },
  pickerIconContainer: {
    top: 15,
  },
  button: {
    padding: width * 0.03,
    borderRadius: width * 0.02,
    marginTop: height * 0.02,
    alignItems: "center",
    width: width * 0.9,
    alignSelf: "center",
  },
  updateButton: {
    backgroundColor: theme.colors.secondary,
  },
  logOutButton: {
    backgroundColor: theme.colors.remove,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  signOutButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.03,
    alignItems: "center",
  },
  resetPasswordContainer: {
    alignItems: "flex-end",
  },
  resetPasswordText: {
    color: theme.colors.secondary,
    marginTop: -height * 0.02,
    fontSize: width * 0.04,
    fontWeight: "bold",
  },
});

export default SettingsScreen;
