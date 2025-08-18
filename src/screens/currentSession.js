import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
} from "react-native";
import SwitchSelector from "react-native-switch-selector";
import { LineChart } from "react-native-chart-kit";
import { PanResponder } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthContext } from "../context/authContext";
import { doc, onSnapshot, collection, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import UserItemComponent from "../components/userItem";
import {
  calculateTotalAlcoholGrams,
  calculateBAC,
  getBACDataPoints,
  getTotalAlcoholGramsPoints,
  isUserBACTrending,
} from "../utilities/BACutilities";
import { formatTime } from "../utilities/timeUtilities";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from '@expo/vector-icons/Feather';
import { theme } from "../styles/theme";
import { set } from "date-fns";

const { width, height } = Dimensions.get("window");

const iconSize = width * 0.1;

const getRandomColor = (index, total) => {
  const hue = (index * 360 / total) % 360;
  const saturation = 70 + (index % 2) * 20;
  const lightness = 50 + (index % 3) * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const CurrentSessionScreen = ({ route }) => {
  const { sessionId, sessionHost, sessionStartedAt } = route.params;
  const { user } = useAuthContext();

  const [sessionStartTime, setSessionStartTime] = useState(formatTime(sessionStartedAt));

  const navigation = useNavigation();

  const [sessionUsers, setSessionUsers] = useState([]);
  const [sessionBAC, setSessionBAC] = useState(0);
  const [sessionAverageTotalAlcoholGrams, setSessionAverageTotalAlcoholGrams] = useState(0);
  const [selectedSort, setSelectedSort] = useState("bac");
  const [tooltip, setTooltip] = useState(null);

  const [averageBACDataPoints, setAverageBACDataPoints] = useState([]);
  const [usersBACDataPoints, setUsersBACDataPoints] = useState([]);

  const [averageTotalAlcoholGramsPoints, setAverageTotalAlcoholGramsPoints] = useState([]);
  const [usersTotalAlcoholGramsPoints, setUsersTotalAlcoholGramsPoints] = useState([]);

  const [selectedUsers, setSelectedUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentTime, setCurrentTime] = useState("");

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const touchX = gestureState.moveX;

      const chartWidth = width * 1.04;
      const chartPadding = 0;
      const relativeX = touchX - chartPadding;
      const pointIndex = Math.round((relativeX / chartWidth) * (data.datasets[0].data.length - 1));

      const time = new Date(averageBACDataPoints[pointIndex]?.timestamp)
      const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (pointIndex >= 0 && pointIndex < data.datasets[0].data.length) {
        const sessionAverageBAC = averageBACDataPoints[pointIndex]?.average || 0;
        const sessionAverageTotalAlcoholGrams = averageTotalAlcoholGramsPoints[pointIndex]?.average || 0;
        const userBacValues = selectedUsers.map((userId) => {
          const userData = selectedSort === 'bac'
            ? usersBACDataPoints.find((data) => data.userId === userId)
            : usersTotalAlcoholGramsPoints.find((data) => data.userId === userId);


          return {
            username: sessionUsers.find((user) => user.id === userId)?.username || ` ${userId}`,
            value: userData ? userData.dataPoints[pointIndex]?.value || 0 : 0,
            color: userData ? userData.color : "transparent",
          };
        });

        const tooltipYPosition = gestureState.moveY - height * 0.2;

        setTooltip({
          x: touchX,
          y: tooltipYPosition,
          sessionAverageBAC,
          sessionAverageTotalAlcoholGrams,
          userBacValues,
          time: formattedTime,
        });
      }
    },
    onPanResponderRelease: () => {
      setTooltip(null);
    },
  });

  const sortedSessionUsers = useMemo(() => {
    return [...sessionUsers].sort((a, b) => {
      if (selectedSort === "bac") {
        return b.BAC - a.BAC;
      } else {
        return b.totalAlcoholGrams - a.totalAlcoholGrams;
      }
    });
  }, [sessionUsers, selectedSort]);

  useEffect(() => {
    const sessionDocRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(
      sessionDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const sessionData = docSnap.data();

          const sessionStartTime = sessionData.startedAt || Timestamp.now(); 

        if (!sessionData.startedAt) {
          updateDoc(sessionDocRef, { startedAt: sessionStartTime });
        }

        setSessionStartTime(formatTime(sessionStartTime));

          const sessionEndedAt = sessionData.endedAt;
          if (sessionEndedAt !== null && sessionHost !== user.id) {
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
  }, [sessionId, navigation, sessionHost]);

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
          setSessionAverageTotalAlcoholGrams(0);
          setAverageTotalAlcoholGramsPoints([]);
          setUsersTotalAlcoholGramsPoints([]);
          setLoading(false);
          return;
        }

        const sessionData = sessionDocSnap.data();
        const sessionStartTime = sessionData.startedAt;

        setSessionStartTime(formatTime(sessionStartTime));

        const usersCollectionRef = collection(sessionDocRef, "users");

        const unsubscribeUsersCollection = onSnapshot(usersCollectionRef, (querySnapshot) => {
          const userListeners = [];
          const userDataMap = new Map();

          const allBACDataPoints = new Map();
          const allTotalAlcoholGramsDataPoints = new Map();

          const usersBACPoints = new Map();
          const usersTotalAlcoholGramsPoints = new Map();

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
                totalAlcoholGrams: 0,
                totalAlcoholGramDataPoints: new Map()
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

                userData.BACTrending = isUserBACTrending(userData, drinks, currentTime);

                const totalAlcoholGrams = calculateTotalAlcoholGrams(drinks, currentTime);
                const totalAlcoholGramsDataPoints = getTotalAlcoholGramsPoints(drinks, sessionStartTime, currentTime);

                totalAlcoholGramsDataPoints.forEach((value, timestamp) => {
                  const timestampString = timestamp.toISOString();
                  if (!allTotalAlcoholGramsDataPoints.has(timestampString)) {
                    allTotalAlcoholGramsDataPoints.set(timestampString, []);
                  }
                  allTotalAlcoholGramsDataPoints.get(timestampString).push(value);
                });

                userData.totalAlcoholGrams = totalAlcoholGrams;
                userData.totalAlcoholGramDataPoints = totalAlcoholGramsDataPoints;

                const userTotalAlcoholGramsPoints = [];
                totalAlcoholGramsDataPoints.forEach((value, timestamp) => {
                  userTotalAlcoholGramsPoints.push({ timestamp, value });
                });
                usersTotalAlcoholGramsPoints.set(userData.id, userTotalAlcoholGramsPoints);

                userDataMap.set(userData.id, userData);
                const userArray = Array.from(userDataMap.values());

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

                  const totalBAC = userArray.reduce((acc, user) => acc + user.BAC, 0);
                  const averageBAC = userArray.length > 0 ? totalBAC / userArray.length : 0;

                  setSessionBAC(averageBAC);

                  const usersBACDataPointsArray = userArray.map((user, index) => ({
                    userId: user.id,
                    dataPoints: usersBACPoints.get(user.id),
                    color: getRandomColor(index, totalUsersCount),
                  }));

                  setUsersBACDataPoints(usersBACDataPointsArray);

                  const averageTotalAlcoholGramsPoints = [];
                  allTotalAlcoholGramsDataPoints.forEach((points, timestampString) => {
                    const timestamp = new Date(timestampString);
                    if (points.length > 0) {
                      const total = points.reduce((sum, value) => sum + value, 0);
                      const average = total / points.length;
                      averageTotalAlcoholGramsPoints.push({ timestamp, average });
                    }
                  });

                  averageTotalAlcoholGramsPoints.sort((a, b) => a.timestamp - b.timestamp);

                  setAverageTotalAlcoholGramsPoints(averageTotalAlcoholGramsPoints);

                  const totalToalAlcoholGrams = userArray.reduce((acc, user) => acc + user.totalAlcoholGrams, 0);
                  const averageTotalAlcoholGrams = userArray.length > 0 ? totalToalAlcoholGrams / userArray.length : 0;

                  setSessionAverageTotalAlcoholGrams(averageTotalAlcoholGrams);

                  const usersTotalAlcoholGramsPointsArray = userArray.map((user, index) => ({
                    userId: user.id,
                    dataPoints: usersTotalAlcoholGramsPoints.get(user.id),
                    color: getRandomColor(index, totalUsersCount),
                  }));

                  setUsersTotalAlcoholGramsPoints(usersTotalAlcoholGramsPointsArray);

                  setSessionUsers(userArray.sort((a, b) => b.BAC - a.BAC));
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
          userTotalAlcoholGram={userItem.totalAlcoholGrams}
          sessionTotalAlcoholGram={sessionAverageTotalAlcoholGrams}
          sortingOnBAC={selectedSort === "bac"}
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
        data: selectedSort === 'bac'
          ? averageBACDataPoints.length
            ? averageBACDataPoints.map((point) => point.average)
            : [0]
          : averageTotalAlcoholGramsPoints.length
            ? averageTotalAlcoholGramsPoints.map((point) => point.average)
            : [0],
        color: () => `rgba(255, 215, 0, 1)`,
      },
      ...selectedUsers.map((userId) => {
        const userData = selectedSort === 'bac'
          ? usersBACDataPoints.find((data) => data.userId === userId)
          : usersTotalAlcoholGramsPoints.find((data) => data.userId === userId);

        return {
          data: userData
            ? selectedSort === 'bac'
              ? userData.dataPoints.map((point) => point.value)
              : userData.dataPoints.map((point) => point.value)
            : [],
          color: () => userData ? userData.color : "transparent",
        };
      }),
    ],
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.loading} />
          </View>
        ) : (
          <>

            <View {...panResponder.panHandlers}>
              <LineChart
                data={data}
                width={width * 1.04}
                height={height * 0.3}
                chartConfig={styles.chartConfig}
                style={styles.chart}
                bezier={selectedSort === "bac"}
              />
            </View>

            {tooltip && (
              <View
                style={[
                  styles.tooltip,
                  {
                    left: tooltip.x - 50,
                    top: tooltip.y - 40,
                  },
                ]}
              >
                <View style={styles.tooltipRow}>
                  <Text style={[styles.tooltipText, { color: 'white', marginLeft: -width * 0.0025 }]}>
                    {tooltip.time}
                  </Text>

                  <Text style={[styles.tooltipText, { color: '#FFD700', textAlign: 'right' }]}>
                    {selectedSort === "bac"
                      ? `${tooltip.sessionAverageBAC.toFixed(2)} ‰`
                      : `${tooltip.sessionAverageTotalAlcoholGrams.toFixed(2)} g`}
                  </Text>
                </View>

                {tooltip.userBacValues.map((userBac, index) => (
                  <View key={index} style={styles.userBacContainer}>
                    <View
                      style={[
                        styles.tooltipCircle,
                        { backgroundColor: userBac.color },
                      ]}
                    />
                    <Text style={[styles.tooltipText, { color: "white" }]}>
                    {userBac.username}: {userBac.value.toFixed(2)} {selectedSort === "bac" ? "‰" : "g"}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{sessionStartTime}</Text>
              <Text style={styles.sessionAverage}>
                {selectedSort === "bac" ? sessionBAC.toFixed(2) + " ‰" : sessionAverageTotalAlcoholGrams.toFixed(0) + " g"}
              </Text>
              <Text style={styles.timeText}>{currentTime}</Text>
            </View>

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
                  navigation.navigate("AddSessionDrink", { sessionId, sessionHost })
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
              data={sortedSessionUsers}
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
          </>
        )}
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
    width,
    height,
  },
  chart: {
    marginTop: height * 0.025,
    marginBottom: -height * 0.04,
    marginLeft: -width * 0.01,
    borderColor: theme.colors.secondary,
    marginRight: width * 0.05,
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
    propsForLabels: {
      fontSize: height * 0.0125,
      fontWeight: "bold",
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: width * 0.025,
  },
  timeText: {
    color: theme.colors.text,
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  sessionAverage: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  flatListContainer: {
    alignItems: "center",
    marginTop: height * 0.015,
    paddingBottom: height * 0.1,
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
    width: width * 0.4,
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
  tooltip: {
    position: 'absolute',
    padding: width * 0.02,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: width * 0.02,
    zIndex: 999,
  },
  tooltipText: {
    fontSize: width * 0.04,
    color: 'white',
    marginLeft: width * 0.02,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 'auto',
  },
  userBacContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  tooltipCircle: {
    width: width * 0.04,
    height: width * 0.04,
    borderRadius: width * 0.02,
  },
});

export default CurrentSessionScreen;
