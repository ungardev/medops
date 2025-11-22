// src/App.tsx
import "./index.css";
import InstitutionalLayout from "./components/Layout/InstitutionalLayout";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <InstitutionalLayout />
    </div>
  );
}
