import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from "react-native";
import { useAuthContext } from "../context/authContext";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { useSessionContext } from "../context/sessionContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import Fontisto from "@expo/vector-icons/Fontisto";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const inputIconSize = height * 0.03;

const SessionSettingsScreen = ({ route }) => {
  const { sessionId, sessionName, sessionEnded, sessionStartedAt, sessionHost } = route.params;

  const [loading, setLoading] = useState(false);

  const [newSessionName, setNewSessionName] = useState(sessionName);
  const [newStartedAtDate, setNewStartedAtDate] = useState(() => {
    const timestampToDate = (timestamp) => {
      return new Date(timestamp.seconds * 1000);
    };
    return timestampToDate(sessionStartedAt);
  });

  const [focusedField, setFocusedField] = useState(null);

  const navigation = useNavigation();

  const { user } = useAuthContext();
  const { endSession, leaveSession, deleteSession, updateSession, editSessionLoading, updateSessionLoading } =
    useSessionContext();

  useEffect(() => {
    if (!user || !user.id || !sessionId) return;

    setLoading(true);

    try {
      const sessionDocRef = doc(db, "sessions", sessionId);
      const usersCollectionRef = collection(sessionDocRef, "users");

      const unsubscribeUsersCollection = onSnapshot(usersCollectionRef, (querySnapshot) => {
        const userDoc = querySnapshot.docs.find((docSnap) => docSnap.id === user.id);
      });

      return () => {
        unsubscribeUsersCollection();
      };
    } catch (error) {
      Alert.alert("Error Fetching Session Data", error.message);
    } finally {
      setLoading(false);
    }
  }, [db, sessionId, user]);

  const handleUpdateSession = async () => {
    const response = await updateSession(sessionId, newSessionName, newStartedAtDate);
    if(!response.success) {
    Alert.alert("Update Session", response.message);
    }
  }

  const handleStartedAtDateConfirm = (event, date) => {
    if (date) {
      setNewStartedAtDate(prevDate => new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        prevDate.getHours(),
        prevDate.getMinutes(),
        prevDate.getSeconds()
      ));
    }
  };

  const handleStartedAtTimeConfirm = (event, time) => {
    if (time) {
      setNewStartedAtDate(prevDate => new Date(
        prevDate.getFullYear(),
        prevDate.getMonth(),
        prevDate.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
      ));
    }
  };

  const handleEndSession = async () => {
    const response = await endSession(sessionId);

    if (!response.success) {
      Alert.alert("End Session", response.message);
    } else {
      navigation.navigate("SessionFeed", { refresh: true });
    }
  };

  const handleLeaveSession = async () => {
    const response = await leaveSession(sessionId);

    if (!response.success) {
      Alert.alert("Leave Session", response.message);
    } else {
      navigation.navigate("SessionFeed");
    }
  };

  const handleDeleteSession = async () => {
    const response = await deleteSession(sessionId);

    if (!response.success) {
      Alert.alert("Delete Session", response.message);
    } else {
      navigation.navigate("Profile");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.loading} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {
          !sessionEnded ? (
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >

              {sessionHost === user.id ? (
                <View style={styles.inputSection}>
                  <Text style={styles.headerText}>Session Name</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "newName" && styles.inputContainerFocused,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="party-popper"
                      size={inputIconSize}
                      style={styles.icon}
                    />
                    <TextInput
                      placeholder="Enter session name"
                      placeholderTextColor={theme.colors.placeholder}
                      value={newSessionName}
                      autoCapitalize="none"
                      onChangeText={setNewSessionName}
                      onFocus={() => setFocusedField("sessionName")}
                      onBlur={() => setFocusedField(null)}
                      style={[styles.input, { height: height * 0.05 }]}
                    />
                  </View>
                </View>
              ) : null}

              {sessionHost === user.id ? (
                <View style={styles.inputSection}>
                  <Text style={styles.headerText}>Session Start Time</Text>
                  <View style={styles.dateTimeContainer}>
                    <Fontisto
                      name="date"
                      size={inputIconSize}
                      style={styles.icon}
                    />

                    <RNDateTimePicker
                      value={newStartedAtDate}
                      mode="date"
                      display="default"
                      onChange={handleStartedAtDateConfirm}
                      style={styles.dateTimePicker}
                    />

                    <RNDateTimePicker
                      value={newStartedAtDate}
                      mode="time"
                      display="default"
                      onChange={handleStartedAtTimeConfirm}
                      style={styles.dateTimePicker}
                    />
                  </View>
                </View>
              ) : null}

              {updateSessionLoading ? (
                <ActivityIndicator size="large" color={theme.colors.secondary} />
              ) : sessionHost === user.id ? (
                <TouchableOpacity
                  onPress={handleUpdateSession}
                  style={[styles.button, styles.updateButton]}
                  disabled={updateSessionLoading}
                >
                  <Text style={styles.buttonText}>Update Session</Text>
                </TouchableOpacity>
              ) : null}

            </ScrollView>
          ) : null
        }

        <View style={styles.deleteButtonContainer}>
          {editSessionLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.colors.red}
              style={styles.activityIndicator}
            />
          ) : sessionEnded ? (
            <TouchableOpacity
              onPress={handleDeleteSession}
              style={styles.deleteButton}
              disabled={editSessionLoading}
            >
              <Text style={styles.buttonText}>Delete Session</Text>
            </TouchableOpacity>
          ) : sessionHost === user.id ? (
            <TouchableOpacity
              onPress={handleEndSession}
              style={styles.deleteButton}
              disabled={editSessionLoading}
            >
              <Text style={styles.buttonText}>End Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleLeaveSession}
              style={styles.button}
              disabled={editSessionLoading}
            >
              <Text style={styles.buttonText}>Leave Session</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  flatListContainer: {
    alignItems: "center",
    marginTop: height * 0.02,
    paddingBottom: height * 0.1,
  },
  buttonContainer: {
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
    width: width * 0.9,
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: width * 0.045,
    fontWeight: "bold",
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
  updateButton: {
    backgroundColor: theme.colors.secondary,
  },
  button: {
    backgroundColor: theme.colors.remove,
    padding: width * 0.03,
    borderRadius: width * 0.02,
    alignItems: "center",
    width: width * 0.9,
    alignSelf: "center",
  },
  buttonText: {
    color: theme.colors.button,
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
});

export default SessionSettingsScreen;
