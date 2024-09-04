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
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const inputHeight = height * 0.05;
const inputIconSize = width * 0.075;

const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const { signIn, resetPassword, loading } = useAuthContext();
  const navigation = useNavigation();

  const handleSignIn = async () => {
    if (email.trim() === "" || password.trim() === "") {
      Alert.alert("Sign In", "Email and password cannot be empty");
      return;
    }

    const response = await signIn(email, password);
    if (!response.success) {
      Alert.alert("Sign In", response.message);

    }
  };

  const handleResetPassword = async () => {
    if (email.trim() === "") {
      Alert.alert("Reset User", "Email cannot be empty");
      return;
    }
    const response = await resetPassword(email);
    Alert.alert("Reset User", response.message);
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
        <Text style={styles.header}>Sign In</Text>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Email</Text>
          <View
            style={[
              styles.inputContainer,
              focusedInput === "email" && styles.inputContainerFocused,
            ]}
          >
            <Feather name="mail" size={inputIconSize} style={styles.icon} />
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#B0B0B0"
              value={email}
              autoCapitalize="none"
              onChangeText={setEmail}
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Password</Text>
          <View
            style={[
              styles.inputContainer,
              focusedInput === "password" && styles.inputContainerFocused,
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
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <FontAwesome
                name={passwordVisible ? "eye-slash" : "eye"}
                size={inputIconSize}
                color="white"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        ) : (
          <TouchableOpacity
            onPress={handleSignIn}
            style={styles.button}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
            <Text
              onPress={() => navigation.navigate("SignUp")}
              style={styles.link}
            >
              Sign Up
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
    color: "white",
    height: inputHeight,
  },
  icon: {
    marginRight: width * 0.02,
    color: "white",
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
    color: "white",
    fontSize: width * 0.04,
    fontWeight: "bold",
  },
  forgotPasswordContainer: {
    marginTop: height * 0.01,
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    color: theme.colors.secondary,
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  footer: {
    marginTop: height * 0.03,
    alignItems: "center",
  },
  footerText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    color: theme.colors.secondary,
    fontWeight: "bold",
    fontSize: width * 0.04,
  },

});

export default SignInScreen;
