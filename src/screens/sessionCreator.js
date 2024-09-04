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
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSessionContext } from "../context/sessionContext";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const SessionCreatorScreen = () => {
  const [sessionName, setSessionName] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const {
    createSession,
    joinSession,
    createSessionLoading,
    joinSessionLoading,
  } = useSessionContext();

  const handleCreateSession = async () => {
    if (sessionName.trim() === "") {
      Alert.alert("Create Session", "Name cannot be empty");
    }
    const response = await createSession(sessionName);
    Alert.alert("Create Session", response.message);
    if (response.success) {
      setSessionName("");

    }
  };

  const handleJoinSession = async () => {
    if (sessionKey.trim() === "") {
      Alert.alert("Join Session", "Key cannot be empty");
      return;
    }
    const response = await joinSession(sessionKey);
    Alert.alert("Join Session", response.message);
    if (response.success) {
      setSessionKey("");
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
          <Text style={styles.headerText}>Session Name</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "sessionName" && styles.inputContainerActive
            ]}
          >
            <MaterialCommunityIcons
              name="party-popper"
              size={24}
              style={styles.icon}
            />
            <TextInput
              placeholder="Enter session name"
              placeholderTextColor={theme.colors.placeholder}
              value={sessionName}
              autoCapitalize="none"
              onChangeText={setSessionName}
              onFocus={() => setFocusedField("sessionName")}
              onBlur={() => setFocusedField(null)}
              style={[styles.input, { height: height * 0.05 }]}
            />
          </View>
          <View style={styles.buttonContainer}>
            {createSessionLoading ? (
              <ActivityIndicator
                size="large"
                color={theme.colors.secondary}
                style={styles.loader}
              />
            ) : (
              <TouchableOpacity
                onPress={handleCreateSession}
                style={[styles.button, styles.createButton]}
                disabled={createSessionLoading}
              >
                <Text style={styles.buttonText}>Create Session</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.headerText}>Session Key</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === "sessionKey" && styles.inputContainerActive
            ]}
          >
            <AntDesign name="key" size={24} style={styles.icon} />
            <TextInput
              placeholder="Enter session key"
              placeholderTextColor={theme.colors.placeholder}
              value={sessionKey}
              autoCapitalize="none"
              onChangeText={setSessionKey}
              onFocus={() => setFocusedField("sessionKey")}
              onBlur={() => setFocusedField(null)}
              style={[styles.input, { height: height * 0.05 }]}
            />
          </View>
          <View style={styles.buttonContainer}>
            {joinSessionLoading ? (
              <ActivityIndicator
                size="large"
                color={theme.colors.secondary}
                style={styles.loader}
              />
            ) : (
              <TouchableOpacity
                onPress={handleJoinSession}
                style={[styles.button, styles.joinButton]}
                disabled={joinSessionLoading}
              >
                <Text style={styles.buttonText}>Join Session</Text>
              </TouchableOpacity>
            )}
          </View>
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
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.02,
    borderWidth: 2,
    borderColor: theme.colors.text,
  },
  inputContainerActive: {
    borderColor: theme.colors.primary,
  },
  input: {
    flex: 1,
    padding: width * 0.02,
    fontSize: width * 0.045,
    color: theme.colors.text,
    height: height * 0.05,
  },
  icon: {
    marginRight: width * 0.02,
    color: theme.colors.icon,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: height * 0.03,
  },
  button: {
    padding: width * 0.03,
    borderRadius: width * 0.02,
    alignItems: "center",
    width: width * 0.9,
    flexDirection: "row",
    justifyContent: "center",
  },
  createButton: {
    backgroundColor: theme.colors.secondary,
  },
  joinButton: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: theme.colors.button,
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
});

export default SessionCreatorScreen;

