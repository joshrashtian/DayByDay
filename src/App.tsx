import "./App.css";
import { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { IoClose } from "react-icons/io5";
import { AnimatedPage } from "./components/layout/AnimatedPage";
import SideBar from "./components/global/sidebar";
import { HomeScreen } from "./screens/HomeScreen";
import { HomeStyleWindowScreen } from "./screens/HomeStyleWindowScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import TasksScreen from "./screens/TasksScreen";
import CalendarScreen from "./screens/CalendarScreen";
import HelpScreen from "./screens/HelpScreen";
import BlockScreen from "./screens/BlockScreen";
import AppsScreen from "./screens/AppsScreen";
import SpotifyScreen from "./screens/integrations/SpotifyScreen";
import ToolkitScreen from "./screens/ToolkitScreen";
import ToolkitWindowScreen from "./screens/ToolkitWindowScreen";
import PomodoroScreen from "./screens/PomodoroScreen";
import CognitionBar from "./ui/CognitionBar";
import { GlobalPomodoroDock } from "./components/global/GlobalPomodoroDock";
import { TaskDragGhost } from "./components/global/TaskDragGhost";
import { PomodoroTicker } from "./components/global/PomodoroTicker";
import { useAppZoom } from "./hooks/useAppZoom";
import { useMenuNavigation } from "./hooks/useMenuNavigation";
import { useCreateTaskAction } from "./hooks/useCreateTaskAction";
import { useProfile } from "./providers/ProfileProvider";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openProfile } = useProfile();
  useMenuNavigation();
  useAppZoom();
  useCreateTaskAction();
  const [sidebarOffset, setSidebarOffset] = useState(220);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const isStyleWindow = location.pathname === "/home/style";

  useEffect(() => {
    const onOpenSettings = () => setShowSettingsModal(true);
    window.addEventListener("rbd:open-settings", onOpenSettings);
    return () =>
      window.removeEventListener("rbd:open-settings", onOpenSettings);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/settings") return;
    setShowSettingsModal(true);
    navigate("/", { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!showSettingsModal) return;
    const onEscClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSettingsModal(false);
      }
    };

    window.addEventListener("keydown", onEscClose);
    return () => window.removeEventListener("keydown", onEscClose);
  }, [showSettingsModal]);

  if (isStyleWindow) {
    return (
      <div id="app-zoom-root" className="h-full w-full overflow-hidden">
        <HomeStyleWindowScreen />
      </div>
    );
  }

  return (
    <div id="app-zoom-root" className="h-full w-full overflow-hidden">
      <SideBar
        onWidthChange={setSidebarOffset}
        onOpenProfile={openProfile}
        onOpenSettings={() => setShowSettingsModal(true)}
      />
      <motion.div
        className="flex h-full min-h-0 flex-col overflow-hidden transition-[padding] duration-200"
        style={{ paddingLeft: sidebarOffset }}
      >
        <motion.div className="flex h-full min-h-0 flex-col overflow-hidden p-4 bg-zinc-50 dark:bg-zinc-950">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/spotify"
              element={
                <AnimatedPage>
                  <SpotifyScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <HomeScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/tasks/*"
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
            <Route
              path="/pomodoro"
              element={
                <AnimatedPage>
                  <PomodoroScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/apps"
              element={
                <AnimatedPage>
                  <AppsScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/toolkit"
              element={
                <AnimatedPage>
                  <ToolkitScreen />
                </AnimatedPage>
              }
            />
            <Route
              path="/toolkit/:panelId"
              element={
                <AnimatedPage>
                  <ToolkitWindowScreen />
                </AnimatedPage>
              }
            />
          </Routes>
          {showSettingsModal ? (
            <div
              className="fixed inset-0 z-70 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
              onClick={() => setShowSettingsModal(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Settings"
                className="relative flex h-[min(90vh,920px)] w-full max-w-[1180px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  aria-label="Close settings"
                >
                  <IoClose className="h-5 w-5" />
                </button>
                <div className="h-full w-full overflow-y-auto">
                  <SettingsScreen modal />
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
        <CognitionBar />
        <PomodoroTicker />
        <GlobalPomodoroDock />
        <TaskDragGhost />
      </motion.div>
    </div>
  );
}
