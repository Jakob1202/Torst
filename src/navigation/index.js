import React from "react";
import UserStack from "./appStack";
import AuthStack from "./authStack";
import { useAuthContext } from "../context/authContext";

export default function RootNavigation() {
  const { user } = useAuthContext();
  return user ? <UserStack /> : <AuthStack />;
}
