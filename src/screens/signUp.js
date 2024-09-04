import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthContext } from "../context/authContext";
import Feather from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import RNPickerSelect from "react-native-picker-select";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const inputHeight = height * 0.05;
const inputIconSize = width * 0.075;

const SignUpScreen = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [password, setPassword] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { signUp, loading } = useAuthContext();
  const navigation = useNavigation();

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  const handleSignUp = async () => {
    if (
      username.trim() === "" ||
      email.trim() === "" ||
      gender.trim() === "" ||
      gender.trim() === null ||
      weight.trim() === "" ||
      password.trim() === ""
    ) {
      Alert.alert(
        "Sign Up",
        "Username, email, gender, weight, and password cannot be empty"
      );
      return;
    }

    const response = await signUp(username, email, gender, weight, password);

    if (!response.success) {
      Alert.alert("Sign Up", response.message);
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
        <Text style={styles.header}>Sign Up</Text>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Username</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "username" && styles.inputContainerFocused,
            ]}
          >
            <FontAwesome name="user" size={inputIconSize} style={styles.icon} />
            <TextInput
              placeholder="Enter your username"
              placeholderTextColor="#B0B0B0"
              value={username}
              autoCapitalize="none"
              onChangeText={setUsername}
              onFocus={() => setFocusedField("username")}
              onBlur={() => setFocusedField(null)}
              style={styles.input}
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Email</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "email" && styles.inputContainerFocused,
            ]}
          >
            <Feather name="mail" size={inputIconSize} style={styles.icon} />
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#B0B0B0"
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={styles.input}
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Weight (kg)</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "weight" && styles.inputContainerFocused,
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
              value={weight}
              onChangeText={setWeight}
              onFocus={() => setFocusedField("weight")}
              onBlur={() => setFocusedField(null)}
              style={styles.input}
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Gender</Text>
          <View
            style={
              styles.pickerContainer
            }
          >
            <AntDesign
              name="question"
              size={inputIconSize}
              color={theme.colors.text}
            />
            <RNPickerSelect
              onValueChange={(value) => {
                setGender(value);
                setFocusedField("gender");
              }}
              items={genderOptions}
              placeholder={{ label: "Select gender", value: null }}
              style={{
                inputIOS: [styles.pickerInput, { height: inputHeight }],
                inputAndroid: [styles.pickerInput, { height: inputHeight }],
                placeholder: styles.pickerPlaceholder,
                iconContainer: styles.pickerIconContainer,
              }}
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Password</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "password" && styles.inputContainerFocused,
            ]}
          >
            <MaterialIcons
              name="lock"
              size={inputIconSize}
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#B0B0B0"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              style={styles.input}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
              disabled={loading}
            >
              <FontAwesome
                name={passwordVisible ? "eye-slash" : "eye"}
                size={inputIconSize}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        ) : (
          <TouchableOpacity
            onPress={handleSignUp}
            style={styles.button}
            disabled={loading}
            accessibilityLabel="Sign Up Button"
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text
              onPress={() => navigation.navigate("SignIn")}
              style={styles.link}
              accessibilityLabel="Sign In Link"
            >
              Sign In
            </Text>
          </Text>
        </View>
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
        ? height * 0.1
        : StatusBar.currentHeight + height * 0.03,
  },
  header: {
    fontSize: width * 0.1,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: height * 0.05,
    textAlign: "center",
  },
  inputSection: {
    marginBottom: height * 0.03,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.text,
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.02,
  },
  inputContainerFocused: {
    borderColor: theme.colors.secondary,
  },
  headerText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.05,
    marginBottom: height * 0.01,
  },
  input: {
    flex: 1,
    padding: width * 0.02,
    fontSize: width * 0.045,
    color: theme.colors.text,
    height: inputHeight,
  },
  icon: {
    marginRight: width * 0.02,
    color: theme.colors.icon,
  },
  eyeIcon: {
    marginLeft: width * 0.02,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    padding: width * 0.03,
    borderRadius: width * 0.02,
    alignItems: "center",
    marginTop: height * 0.03,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  footer: {
    marginTop: height * 0.03,
    alignItems: "center",
  },
  footerText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  link: {
    color: theme.colors.secondary,
    fontWeight: "bold",
    fontSize: width * 0.04,
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
    fontSize: width * 0.045,
    color: theme.colors.text,
    flex: 1,
  },
  pickerPlaceholder: {
    color: "#B0B0B0",
    fontSize: width * 0.045,
  },
  pickerIconContainer: {
    top: 15,
  },
});

export default SignUpScreen;
