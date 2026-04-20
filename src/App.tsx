import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { AnimatedPage } from "./components/layout/AnimatedPage";
import SideBar from "./components/global/sidebar";
import { HomeScreen } from "./screens/HomeScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import TasksScreen from "./screens/TasksScreen";
import CalendarScreen from "./screens/CalendarScreen";
import HelpScreen from "./screens/HelpScreen";
import BlockScreen from "./screens/BlockScreen";

export default function App() {
  const location = useLocation();

  return (
    <>
      <SideBar />
      <div className="ml-16 min-h-screen">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <HomeScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/tasks"
              element={
                <AnimatedPage>
                  <TasksScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/calendar"
              element={
                <AnimatedPage>
                  <CalendarScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/settings"
              element={
                <AnimatedPage>
                  <SettingsScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/help"
              element={
                <AnimatedPage>
                  <HelpScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/blocks"
              element={
                <AnimatedPage>
                  <BlockScreen />
                </AnimatedPage>
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
    </>
  );
}
