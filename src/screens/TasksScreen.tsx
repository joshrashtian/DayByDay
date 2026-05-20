import { Navigate, Route, Routes } from "react-router-dom";
import { TasksMainPage } from "../components/tasks/TasksMainPage";
import { TasksCategoriesPage } from "../components/tasks/TasksCategoriesPage";
import { TasksCategoryDetailPage } from "../components/tasks/TasksCategoryDetailPage";

export default function TasksScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Routes>
        <Route index element={<TasksMainPage />} />
        <Route path="categories" element={<TasksCategoriesPage />} />
        <Route path="categories/:categorySlug" element={<TasksCategoryDetailPage />} />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </div>
  );
}
