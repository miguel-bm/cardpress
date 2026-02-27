import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { SettingsProvider } from "./context/SettingsContext";
import { AlbumProvider } from "./context/AlbumContext";
import TopBar from "./components/TopBar";
import DesignPage from "./pages/DesignPage";
import PrintPage from "./pages/PrintPage";

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
          <Route path="/print" element={<PrintPage />} />
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
            <Toaster
              position="bottom-right"
              closeButton
              duration={2000}
              toastOptions={{
                style: {
                  background: "#FFFFFF",
                  border: "1px solid #E8E5E0",
                  color: "#1A1A1A",
                  fontFamily: "Inter, sans-serif",
                },
              }}
            />
          </div>
        </AlbumProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
