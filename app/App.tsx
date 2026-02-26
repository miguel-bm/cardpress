import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { SettingsProvider } from "./context/SettingsContext";
import { AlbumProvider } from "./context/AlbumContext";
import TopBar from "./components/TopBar";
import DesignPage from "./pages/DesignPage";
import BatchPage from "./pages/BatchPage";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<DesignPage />} />
          <Route path="/batch" element={<BatchPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AlbumProvider>
          <div className="min-h-screen bg-bg">
            <TopBar />
            <AnimatedRoutes />
          </div>
        </AlbumProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
