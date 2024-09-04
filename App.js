import React from "react";
import RootNavigation from "./src/navigation";
import { AuthContextProvider } from "./src/context/authContext";
import { SessionContextProvider } from "./src/context/sessionContext";
import { DrinkContextProvider } from "./src/context/drinkContext";

export default function App() {
  return (
    <AuthContextProvider>
      <SessionContextProvider>
        <DrinkContextProvider>
          <RootNavigation />
        </DrinkContextProvider>
      </SessionContextProvider>
    </AuthContextProvider>
  );
}
