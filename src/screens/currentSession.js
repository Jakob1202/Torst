import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import { useAuthContext } from "../context/authContext";
import { doc, onSnapshot, collection, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import UserItemComponent from "../components/userItem";
import {
  calculateBAC,
  getBACDataPoints,
  isBACTrending,
} from "../utilities/BACutilities";
import { formatTime } from "../utilities/timeUtilities";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { theme } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const iconSize = width * 0.1;

const getRandomColor = (index, total) => {
  const hue = (index / total) * 240; 
  return `hsl(${hue}, 100%, 60%)`;
};

const CurrentSessionScreen = ({ route }) => {
  const { sessionId, sessionHost, sessionStartedAt } = route.params;
  
  const sessionStartTime = formatTime(sessionStartedAt);

  const navigation = useNavigation();

  const [sessionUsers, setSessionUsers] = useState([]);
  const [sessionBAC, setSessionBAC] = useState(0);

  const [averageBACDataPoints, setAverageBACDataPoints] = useState([]);
  const [usersBACDataPoints, setUsersBACDataPoints] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentTime, setCurrentTime] = useState("");

  const { user } = useAuthContext();

  useEffect(() => {
    const sessionDocRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const sessionData = docSnap.data();

        const sessionEndedAt = sessionData.endedAt;
        if (sessionEndedAt !== null && sessionHost !== user.id) {
          navigation.navigate("SessionFeed");
          Alert.alert("Session Ended", "Session has ended");
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId, navigation]);

  const fetchSessionData = useCallback(async () => {
    if (!user || !user.id || !sessionId) return;
  
    setLoading(true);
  
    try {
      const sessionDocRef = doc(db, "sessions", sessionId);
      const currentTime = Timestamp.now();
  
      const unsubscribeSessionDoc = onSnapshot(sessionDocRef, (sessionDocSnap) => {
        if (!sessionDocSnap.exists()) {
          setSessionUsers([]);
          setSessionBAC(0);
          setAverageBACDataPoints([]);
          setUsersBACDataPoints([]);
          setLoading(false);
          return;
        }
  
        const sessionData = sessionDocSnap.data();
        const sessionStartTime = sessionData.startedAt;
  
        const usersCollectionRef = collection(sessionDocRef, "users");
  
        const unsubscribeUsersCollection = onSnapshot(usersCollectionRef, (querySnapshot) => {
          const userListeners = [];
          const allBACDataPoints = new Map();
          const userDataMap = new Map();
          const usersBACPoints = new Map();
          let processedUsersCount = 0;
          const totalUsersCount = querySnapshot.size;
  
          querySnapshot.forEach((docSnap, index) => {
            if (docSnap.exists()) {
              const userData = {
                id: docSnap.id,
                ...docSnap.data(),
                BAC: 0,
                BACDataPoints: new Map(),
                BACTrending: false,
              };
  
              const drinksCollectionRef = collection(docSnap.ref, "drinks");
  
              const unsubscribeDrinksCollection = onSnapshot(drinksCollectionRef, (drinksSnapshot) => {
                const drinks = drinksSnapshot.docs.map((drinkDoc) => ({
                  id: drinkDoc.id,
                  ...drinkDoc.data(),
                }));
  
                const BAC = calculateBAC(userData, drinks, currentTime);
                const BACDataPoints = getBACDataPoints(userData, drinks, sessionStartTime, currentTime);
  
                BACDataPoints.forEach((value, timestamp) => {
                  const timestampString = timestamp.toISOString();
                  if (!allBACDataPoints.has(timestampString)) {
                    allBACDataPoints.set(timestampString, []);
                  }
                  allBACDataPoints.get(timestampString).push(value);
                });
  
                userData.BAC = BAC;
                userData.BACDataPoints = BACDataPoints;
  
                const userBACPoints = [];
                BACDataPoints.forEach((value, timestamp) => {
                  userBACPoints.push({ timestamp, value });
                });
                usersBACPoints.set(userData.id, userBACPoints);
  
                userData.BACTrending = isBACTrending(userData, drinks, currentTime);
  
                userDataMap.set(userData.id, userData);
  
                processedUsersCount++;
                if (processedUsersCount === totalUsersCount) {
                  const averageBACDataPoints = [];
                  allBACDataPoints.forEach((points, timestampString) => {
                    const timestamp = new Date(timestampString);
                    if (points.length > 0) {
                      const total = points.reduce((sum, value) => sum + value, 0);
                      const average = total / points.length;
                      averageBACDataPoints.push({ timestamp, average });
                    }
                  });
  
                  averageBACDataPoints.sort((a, b) => a.timestamp - b.timestamp);
  
                  setAverageBACDataPoints(averageBACDataPoints);
  
                  const userArray = Array.from(userDataMap.values());
                  const totalBAC = userArray.reduce((acc, user) => acc + user.BAC, 0);
                  const averageBAC = userArray.length > 0 ? totalBAC / userArray.length : 0;
  
                  setSessionBAC(averageBAC);
                  setSessionUsers(userArray.sort((a, b) => b.BAC - a.BAC));
  
                  const usersBACDataPointsArray = userArray.map((user, index) => ({
                    userId: user.id,
                    dataPoints: usersBACPoints.get(user.id),
                    color: getRandomColor(index, totalUsersCount),
                  }));
  
                  setUsersBACDataPoints(usersBACDataPointsArray);
                }
              });
  
              userListeners.push(unsubscribeDrinksCollection);
            }
          });
  
          return () => {
            userListeners.forEach((unsubscribe) => unsubscribe());
            unsubscribeUsersCollection();
          };
        });
  
        return () => {
          unsubscribeSessionDoc();
        };
  
      });
  
      return () => {
        unsubscribeSessionDoc();
      };
  
    } catch (error) {
      Alert.alert("Error fetching session data", error.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user]);
  

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessionData();
    setRefreshing(false);
  }, [fetchSessionData]);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      );
    };

    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const renderUserItem = ({ item: userItem, index }) => {
    const isSelected = selectedUsers.includes(userItem.id);
    const userColor = usersBACDataPoints.find(data => data.userId === userItem.id)?.color || "transparent";

    return (
      <Pressable
        onPress={() =>
          isSelected ? handleDeselectUser(userItem.id) : handleSelectUser(userItem.id)
        }
      >
        <UserItemComponent
          userRank={index + 1}
          username={userItem.username}
          userBAC={userItem.BAC}
          sessionBAC={sessionBAC}
          BACTrending={userItem.BACTrending}
          borderColor={isSelected ? userColor : "transparent"}
        />
      </Pressable>
    );
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prevSelectedUsers) => [...prevSelectedUsers, userId]);
  };

  const handleDeselectUser = (userId) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.filter((id) => id !== userId)
    );
  };

  const data = {
    datasets: [
      {
        data: averageBACDataPoints.length
          ? averageBACDataPoints.map((point) => point.average)
          : [0],
        color: () => `rgba(255, 215, 0, 1)`,
      },
      ...selectedUsers.map((userId) => {
        const userData = usersBACDataPoints.find((data) => data.userId === userId);
        return {
          data: userData ? userData.dataPoints.map((point) => point.value) : [],
          color: () => userData ? userData.color : "transparent",
        };
      }),
    ],
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.loading} />
        </View>
      ) : (
        <>
          <LineChart
            data={data}
            width={width * 0.9}
            height={height * 0.3}
            chartConfig={styles.chartConfig}
            style={styles.chart}
            bezier
          />

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{sessionStartTime}</Text>
            <Text style={styles.sessionBAC}>
              {sessionBAC.toFixed(2) + " ‰"}
            </Text>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>

          <FlatList
            data={sessionUsers}
            renderItem={renderUserItem}
            keyExtractor={(sessionUser) => sessionUser.id}
            contentContainerStyle={styles.flatListContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.loading}
                size={"large"}
              />
            }
            style={styles.flatList}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                navigation.navigate("AddSessionDrink", { sessionId })
              }
            >
              <MaterialIcons
                name="add"
                size={iconSize}
                color={theme.colors.button}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: width * 0.04,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    width,
    height,
  },
  chart: {
    marginTop: height * 0.025,
    marginVertical: height * 0.02,
    marginHorizontal: width * 0.01,
    borderRadius: width * 0.02,
    borderColor: theme.colors.secondary,
  },
  chartConfig: {
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    formatYLabel: (value) => `${value}%`,
    fillShadowGradient: theme.colors.background,
    fillShadowGradientOpacity: 0,
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
    propsForDots: {
      r: "0",
    },
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: height * 0.0001,
    paddingHorizontal: width * 0.02,
  },
  timeText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  sessionBAC: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  flatListContainer: {
    flexGrow: 1,
    marginVertical: height * 0.02,
    marginHorizontal: width * 0.01,
    alignItems: "center",
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

export default CurrentSessionScreen;
