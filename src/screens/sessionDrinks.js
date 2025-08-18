import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
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
  const navigation = useNavigation();

  const { user } = useAuthContext();
  const { endSession, leaveSession, deleteSession, editSessionLoading } =
    useSessionContext();

  useEffect(() => {
    const sessionDocRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(
      sessionDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const sessionData = docSnap.data();

          const sessionEndedAt = sessionData.endedAt;
          if (sessionEndedAt !== null && sessionHost !== user.id && !sessionEnded) {
            navigation.navigate("SessionFeed");
            Alert.alert("Session Ended", "Session has ended");
          }
        }
      },
      (error) => {
        console.error("Error fetching session data: ", error);
      }
    );

    return () => unsubscribe();
  }, [sessionId, sessionHost, navigation, sessionEnded]);


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
      sessionHost={sessionHost}
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
});

export default SessionDrinksScreen;
