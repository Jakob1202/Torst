import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuthContext } from "../context/authContext";
import { useSessionContext } from "../context/sessionContext";
import SessionDrinkItemComponent from "../components/sessionDrinkItem";
import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { formatDateTime } from "../utilities/timeUtilities";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const SessionDrinksScreen = ({ route }) => {
  const { sessionId, sessionEnded, sessionHost } = route.params;

  const [sessionDrinks, setSessionDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userJoinedAt, setUserJoinedAt] = useState(null);
  const [userJoinedAtTime, setUserJoinedAtTime] = useState(null);
  const [userJoinedAtDate, setUserJoinedAtDate] = useState(null);

  const navigation = useNavigation();

  const { user } = useAuthContext();
  const { endSession, leaveSession, deleteSession, updateSessionLoading } =
    useSessionContext();
  useEffect(() => {
    const sessionDocRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const sessionData = docSnap.data();

        const sessionEndedAt = sessionData.endedAt;
        if (sessionEndedAt !== null && sessionHost !== user.id && !sessionEnded) {
          navigation.navigate("SessionFeed");
          Alert.alert("Session Ended", "Session has ended");
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, navigation]);

  const fetchDrinks = useCallback(() => {
    if (!sessionId || !user?.id) return;

    setLoading(true);
    try {
      const drinksRef = collection(
        doc(db, "sessions", sessionId),
        "users",
        user.id,
        "drinks"
      );

      if (!drinksRef) {
        setLoading(false);
        return;
      }

      const unsubscribe = onSnapshot(drinksRef, (snapshot) => {
        const newDrinks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSessionDrinks((prevDrinks) => {
          const prevDrinksMap = new Map(
            prevDrinks.map((drink) => [drink.id, drink])
          );
          const newDrinksMap = new Map(
            newDrinks.map((drink) => [drink.id, drink])
          );

          const combinedDrinks = [...newDrinksMap.values()];

          const filteredDrinks = combinedDrinks.filter((drink) =>
            prevDrinksMap.has(drink.id)
          );

          const updatedDrinks = combinedDrinks.map((drink) => ({
            ...prevDrinksMap.get(drink.id),
            ...drink,
          }));

          const sortedDrinks = [
            ...new Map(
              updatedDrinks.map((drink) => [drink.id, drink])
            ).values(),
          ].sort((a, b) => {
            const dateA = a.drankAt?.toDate() || 0;
            const dateB = b.drankAt?.toDate() || 0;
            return dateB - dateA;
          });

          return sortedDrinks;
        });

        const fetchUserJoinedAt = async () => {
          if (!sessionId || !user?.id) return;

          try {
            const userInSessionDocRef = doc(
              db,
              "sessions",
              sessionId,
              "users",
              user.id
            );
            const userInSessionDocSnap = await getDoc(userInSessionDocRef);
            const joinedAt = userInSessionDocSnap.data()?.joinedAt || null;
            setUserJoinedAt(joinedAt);

            if (joinedAt) {
              const { day, time } = formatDateTime(joinedAt);
              setUserJoinedAtDate(day);
              setUserJoinedAtTime(time);
            }
          } catch (error) {
            console.error("Error fetching user joinedAt timestamp: ", error);
            setUserJoinedAt(null);
          }
        };

        fetchUserJoinedAt();

        setLoading(false);
      });
    } catch (error) {
      setLoading(false);
    } finally {
      setLoading(false);
    }

    return () => unsubscribe();
  }, [sessionId, user?.id]);

  useEffect(() => {
    fetchDrinks();
  }, [fetchDrinks]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    fetchDrinks();
    setRefreshing(false);
  }, [fetchDrinks]);

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

  const renderDrinkItem = ({ item: drinkItem }) => (
    <SessionDrinkItemComponent
      drinkId={drinkItem.id}
      drinkName={drinkItem.name}
      drinkLitres={drinkItem.litres}
      drinkABV={drinkItem.alcohol}
      drinkType={drinkItem.type}
      drinkDate={drinkItem.drankAt}
      sessionEnded={sessionEnded}
      sessionId={sessionId}
    />
  );

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
        data={sessionDrinks}
        renderItem={renderDrinkItem}
        keyExtractor={(drinkItem) => drinkItem.id}
        numColumns={1}
        contentContainerStyle={styles.flatListContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={!sessionEnded ? handleRefresh : null}
            tintColor={theme.colors.loading}
            size={"large"}
          />
        }
      />
      <View style={styles.userJoinedAtContainer}>
        <Text style={styles.userJoinedAt}>
          {userJoinedAtDate} {userJoinedAtTime}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {updateSessionLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.secondary}
            style={styles.activityIndicator}
          />
        ) : sessionEnded ? (
          <TouchableOpacity
            onPress={handleDeleteSession}
            style={styles.button}
            disabled={updateSessionLoading}
          >
            <Text style={styles.buttonText}>Delete Session</Text>
          </TouchableOpacity>
        ) : sessionHost === user.id ? (
          <TouchableOpacity
            onPress={handleEndSession}
            style={styles.button}
            disabled={updateSessionLoading}
          >
            <Text style={styles.buttonText}>End Session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleLeaveSession}
            style={styles.button}
            disabled={updateSessionLoading}
          >
            <Text style={styles.buttonText}>Leave Session</Text>
          </TouchableOpacity>
        )}
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
    paddingBottom: height * 0.1,
  },
  userJoinedAtContainer: {
    padding: width * 0.05,
    alignItems: "center",
    backgroundColor: theme.colors.background,
    marginBottom: height * 0.075,
  },
  userJoinedAt: {
    fontSize: width * 0.04,
    color: theme.colors.text,
    fontWeight: "bold",
    marginVertical: 5,
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
});

export default SessionDrinksScreen;
