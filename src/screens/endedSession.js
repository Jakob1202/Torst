import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { doc, collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import UserItemComponent from "../components/userItem";
import { LineChart } from "react-native-chart-kit";
import { formatTime } from "../utilities/timeUtilities";
import { useAuthContext } from "../context/authContext";
import { calculateBAC, getBACDataPoints, isBACTrending } from "../utilities/BACutilities";

const { width, height } = Dimensions.get("window");
import { theme } from "../styles/theme";

const getRandomColor = (index, total) => {
  const hue = (index / total) * 240; 
  return `hsl(${hue}, 100%, 60%)`;
};

const EndedSessionScreen = ({ route }) => {
  const { sessionId, sessionStartedAt, sessionEndedAt } = route.params;
  const { user } = useAuthContext();

  const sessionStartTime = formatTime(sessionStartedAt);
  const sessionEndTime = formatTime(sessionEndedAt);

  const [sessionUsers, setSessionUsers] = useState([]);
  const [sessionBAC, setSessionBAC] = useState(0);
  const [averageBACDataPoints, setAverageBACDataPoints] = useState([]);
  const [usersBACDataPoints, setUsersBACDataPoints] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
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
          const sessionEndTime = sessionData.endedAt; 

          const usersCollectionRef = collection(sessionDocRef, "users");

          const unsubscribeUsersCollection = onSnapshot(usersCollectionRef, (querySnapshot) => {
            const userListeners = [];
            const allBACDataPoints = new Map();
            const userDataMap = new Map();
            const usersBACPoints = new Map();
            let processedUsersCount = 0;
            const totalUsersCount = querySnapshot.size;

            querySnapshot.forEach((docSnap) => {
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
                  const BACDataPoints = getBACDataPoints(userData, drinks, sessionStartTime, sessionEndTime);

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

                  userData.BACTrending = isBACTrending(userData, drinks, sessionEndTime);

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
    };

    fetchSessionData();
  }, [sessionId, user]);

  

  const handleSelectUser = (userId) => {
    setSelectedUsers((prevSelectedUsers) => [...prevSelectedUsers, userId]);
  };

  const handleDeselectUser = (userId) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.filter((id) => id !== userId)
    );
  };

  const renderUserItem = ({ item: userItem, index }) => {
    const isSelected = selectedUsers.includes(userItem.id);
    const userColor = getRandomColor(index, sessionUsers.length);

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

  const data = {
    datasets: [
      {
        data: averageBACDataPoints.length
          ? averageBACDataPoints.map((point) => point.average)
          : [0],
        color: () => `rgba(255, 215, 0, 1)`,
        strokeWidth: 3,
        label: "Average BAC",
      },
      ...selectedUsers.map((userId) => {
        const userData = usersBACDataPoints.find((data) => data.userId === userId);
        return {
          data: userData ? userData.dataPoints.map((point) => point.value) : [],
          color: () => getRandomColor(selectedUsers.indexOf(userId), selectedUsers.length),
          strokeWidth: 3,
          label: sessionUsers.find(user => user.id === userId)?.username || "Unknown",
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
          />

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{sessionStartTime}</Text>
            <Text style={styles.sessionBAC}>
              {sessionBAC.toFixed(2) + " ‰"}{" "}
            </Text>
            <Text style={styles.timeText}>{sessionEndTime}</Text>
          </View>

          <FlatList
            data={sessionUsers}
            renderItem={renderUserItem}
            keyExtractor={(sessionUser) => sessionUser.id}
            contentContainerStyle={styles.flatListContainer}
          />
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
  flatListContainer: {
    flexGrow: 1,
    marginVertical: height * 0.02,
    marginHorizontal: width * 0.01,
    alignItems: "center",
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: height * 0.03,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    width,
    height,
  },
});

export default EndedSessionScreen;
