import React from "react";
import UserStack from "./appStack";
import AuthStack from "./authStack";
import 'react-native-gesture-handler';
import { useAuthContext } from "../context/authContext";

export default function RootNavigation() {
  try {
    const { user } = useAuthContext();
    return user ? <UserStack /> : <AuthStack />;
  } catch (error) {
    console.error("Error in RootNavigation: ", error.message);
  }
}
