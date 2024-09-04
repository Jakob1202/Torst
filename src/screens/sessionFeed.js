import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image
} from "react-native";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useAuthContext } from "../context/authContext";
import { db } from "../config/firebase";
import { useNavigation } from "@react-navigation/native";
import SessionItemComponent from "../components/sessionItem";
import { calculateBAC } from "../utilities/BACutilities";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const iconSize = width * 0.1;

const SessionFeedScreen = () => {
  const { user } = useAuthContext();

  const [currentSessions, setCurrentSessions] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();

  const fetchCurrentSessions = useCallback(async () => {
    if (!user || !user.id) return;

    let sessionListeners = [];
    let sessionDataMap = new Map();

    const updateSessions = () => {
      setCurrentSessions(
        Array.from(sessionDataMap.values()).filter(
          (session) => !session.endedAt
        )
      );
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

                usersSnapshot.forEach((userDocSnap) => {
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
                      users.push({ ...userData, drinks, userBAC });

                      const totalBAC = users.reduce(
                        (acc, user) => acc + user.userBAC,
                        0
                      );
                      const sessionBAC =
                        users.length > 0 ? totalBAC / users.length : 0;

                      sessionDataMap.set(sessionData.id, {
                        ...sessionData,
                        sessionBAC,
                      });
                      updateSessions();
                    }
                  );

                  userListeners.push(unsubscribeDrinksCollection);
                });

                return () => {
                  userListeners.forEach((unsubscribe) => unsubscribe());
                };
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
        sessionBAC={sessionItem.sessionBAC}
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
    <View style={styles.container}>
      <FlatList
        data={currentSessions}
        renderItem={renderSessionItem}
        keyExtractor={(sessionItem) => sessionItem.id}
        contentContainerStyle={styles.flatListContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.loading}
            size={"large"}
          />
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("SessionCreator")}
        >
          <MaterialIcons
            name="add"
            size={iconSize}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
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
  },
  icon: {
    width: width * 0.075,
    height: width * 0.075,
    resizeMode: "contain",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
    alignItems: "center",
  },
  button: {
    backgroundColor: theme.colors.secondary,
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: (width * 0.15) / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SessionFeedScreen;


