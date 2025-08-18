import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import SwitchSelector from "react-native-switch-selector";
import { useAuthContext } from "../context/authContext";
import { db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import SessionItemComponent from "../components/sessionItem";
import {
  calculateTotalAlcoholGrams,
  calculateBAC,
  getBACDataPoints,
  isSessionBACTrending,
} from "../utilities/BACutilities";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const iconSize = width * 0.1;

const SessionFeedScreen = () => {
  const { user } = useAuthContext();

  const [currentSessions, setCurrentSessions] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedSort, setSelectedSort] = useState("bac");

  const navigation = useNavigation();

  const sortedCurrentSessions = useMemo(() => {
    return currentSessions.sort((a, b) => {
      if (selectedSort === "bac") {
        return b.sessionBAC - a.sessionBAC;
      } else if (selectedSort === "grams") {
        return b.sessionTotalAlcoholGrams - a.sessionTotalAlcoholGrams;
      } else if (selectedSort === "users") {
        return b.users - a.users;
      } else {
        return 0;
      }
    });
  }, [currentSessions, selectedSort]);

  const fetchCurrentSessions = useCallback(async () => {
    setLoading(true);
    if (!user || !user.id) return;

    let sessionListeners = [];
    let sessionDataMap = new Map();

    const updateSessions = () => {
      const activeSessions = Array.from(sessionDataMap.values()).filter(
        (session) => !session.endedAt
      );

      setCurrentSessions(activeSessions);
      setRefreshing(false);
      setLoading(false);
    };

    try {
      const userDocRef = doc(db, "users", user.id);
      const unsubscribeUserDoc = onSnapshot(userDocRef, async (userDocSnap) => {
        const userData = userDocSnap.data();
        const sessionRefs = userData?.currentSessions || [];

        const newActiveSessionRefs = new Set(sessionRefs.map((ref) => ref.id));

        sessionListeners.forEach((unsubscribe) => unsubscribe());
        sessionListeners = [];
        sessionDataMap = new Map();

        const sessionPromises = sessionRefs.map(async (sessionRef) => {
          const unsubscribeSessionDoc = onSnapshot(
            sessionRef,
            async (sessionDocSnap) => {
              if (sessionDocSnap.exists()) {
                const sessionData = {
                  id: sessionDocSnap.id,
                  ...sessionDocSnap.data(),
                };

                const usersSubcollectionRef = collection(sessionRef, "users");
                const usersSnapshot = await getDocs(usersSubcollectionRef);

                const users = [];
                const userListeners = [];
                let sessionTotalAlcoholGrams = 0;
                const allBACDataPoints = new Map();

                const userPromises = usersSnapshot.docs.map(async (userDocSnap) => {
                  const userData = {
                    id: userDocSnap.id,
                    ...userDocSnap.data(),
                    drinks: [],
                    userBAC: 0,
                  };

                  const drinksCollectionRef = collection(
                    userDocSnap.ref,
                    "drinks"
                  );
                  const unsubscribeDrinksCollection = onSnapshot(
                    drinksCollectionRef,
                    (drinksSnapshot) => {
                      const drinks = drinksSnapshot.docs.map((drinkDoc) => ({
                        id: drinkDoc.id,
                        ...drinkDoc.data(),
                      }));

                      const userBAC = calculateBAC(
                        userData,
                        drinks,
                        Timestamp.now()
                      );

                      const totalAlcoholGrams = calculateTotalAlcoholGrams(
                        drinks,
                        Timestamp.now()
                      );

                      sessionTotalAlcoholGrams += totalAlcoholGrams;

                      const BACDataPoints = getBACDataPoints(
                        userData,
                        drinks,
                        sessionData.startedAt,
                        Timestamp.now()
                      );

                      BACDataPoints.forEach((value, timestamp) => {
                        const timestampString = timestamp.toISOString();
                        if (!allBACDataPoints.has(timestampString)) {
                          allBACDataPoints.set(timestampString, []);
                        }
                        allBACDataPoints.get(timestampString).push(value);
                      });

                      users.push({
                        ...userData,
                        drinks,
                        userBAC,
                      });

                      userListeners.push(unsubscribeDrinksCollection);

                      const sessionAverageBACDataPoints = [];
                      allBACDataPoints.forEach((points, timestampString) => {
                        const timestamp = new Date(timestampString);
                        if (points.length > 0) {
                          const total = points.reduce((sum, value) => sum + value, 0);
                          const average = total / points.length;
                          sessionAverageBACDataPoints.push({ timestamp, average });
                        }
                      });

                      sessionAverageBACDataPoints.sort((a, b) => a.timestamp - b.timestamp);
                      const sessionBAC = users.reduce((acc, user) => acc + user.userBAC, 0) / users.length;
                      const sessionIsTrending = isSessionBACTrending(sessionAverageBACDataPoints);

                      sessionDataMap.set(sessionData.id, {
                        ...sessionData,
                        sessionBAC,
                        sessionTotalAlcoholGrams,
                        sessionTotalUsers: usersSnapshot.size,
                        users,
                        sessionAverageBACDataPoints,
                        isTrending: sessionIsTrending,
                      });

                      updateSessions();
                    });
                }
                );

                await Promise.all(userPromises);

              } else {
                sessionDataMap.delete(sessionRef.id);
                updateSessions();
              }
            }
          );

          sessionListeners.push(unsubscribeSessionDoc);
        });

        await Promise.all(sessionPromises);

        const deletedSessions = Array.from(sessionDataMap.keys()).filter(
          (sessionId) => !newActiveSessionRefs.has(sessionId)
        );
        deletedSessions.forEach((sessionId) => {
          const session = sessionDataMap.get(sessionId);
          if (session && !session.endedAt) {
            session.endedAt = Timestamp.now();
            sessionDataMap.set(sessionId, session);
          }
          sessionDataMap.delete(sessionId);
        });

        updateSessions();
      });

      return () => {
        unsubscribeUserDoc();
        sessionListeners.forEach((unsubscribe) => unsubscribe());
      };
    } catch (error) {
      Alert.alert("Error fetching current sessions", error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [user, db]);


  useEffect(() => {
    fetchCurrentSessions();
  }, [fetchCurrentSessions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCurrentSessions();
    setRefreshing(false);
  }, [fetchCurrentSessions]);

  const renderSessionItem = ({ item: sessionItem }) => {
    return (
      <SessionItemComponent
        sessionId={sessionItem.id}
        sessionName={sessionItem.name}
        sessionHost={sessionItem.host}
        sessionStartedAt={sessionItem.startedAt}
        sessionEndedAt={sessionItem.endedAt}
        sessionEnded={false}
        sessionSort={selectedSort}
        sessionBAC={sessionItem.sessionBAC}
        sessionTotalAlcoholGrams={sessionItem.sessionTotalAlcoholGrams}
        sessionTotalUsers={sessionItem.sessionTotalUsers}
        sessionTrending={sessionItem.isTrending}
        sessionUsers={sessionItem.sessionTotalUsers}
      />
    );
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
        <View style={styles.filterContainer}>
          <SwitchSelector
            initial={0}
            textColor={theme.colors.text}
            selectedColor={theme.colors.text}
            buttonColor={theme.colors.secondary}
            borderColor={theme.colors.secondary}
            backgroundColor={theme.colors.background}
            hasPadding
            options={[
              { label: <Feather name="percent" size={iconSize * 0.7} color="white" />, value: "bac" },
              { label: <Feather name="droplet" size={iconSize * 0.7} color="white" />, value: "grams" },
              { label: <Octicons name="person" size={iconSize * 0.7} color="white" />, value: "users" },
            ]}
            onPress={(value) => setSelectedSort(value)}
            style={styles.switchSelector}
            textStyle={{
              fontSize: width * 0.04,
              fontWeight: "bold",
            }}
            selectedTextStyle={{
              fontSize: width * 0.04,
              fontWeight: "bold",
              color: theme.colors.text,
            }}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate("SessionCreator")
            }
          >
            <MaterialIcons
              name="add"
              size={iconSize}
              color={theme.colors.button}
            />
          </TouchableOpacity>

        </View>

        <FlatList
          data={sortedCurrentSessions}
          renderItem={renderSessionItem}
          keyExtractor={(sessionItem) => sessionItem.id}
          contentContainerStyle={styles.flatListContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.loading}
              size="large"
            />
          }
        />

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
  title: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: theme.colors.text,
    marginHorizontal: width * 0.025,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: width * 0.025,
    marginTop: height * 0.01,
  },
  switchContainer: {
    alignItems: "center",
  },
  switchSelector: {
    marginTop: height * 0.01,
    width: width * 0.5,
    height: height * 0.05,
  },
  flatListContainer: {
    alignItems: "center",
    marginTop: height * 0.01,
  },
  selectedSort: {
    fontSize: width * 0.05,
    color: "#FFD700",
    fontWeight: "bold",
  },
  icon: {
    width: width * 0.075,
    height: width * 0.075,
    resizeMode: "contain",
  },
  button: {
    backgroundColor: theme.colors.secondary,
    width: width * 0.15,
    height: width * 0.1,
    marginTop: height * 0.01,
    borderRadius: (width * 0.1) / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SessionFeedScreen;


