import { AnimatePresence, motion } from "framer-motion";

// ---------------------------------------------------------------------------
// BatchProgress — progress bar for batch PDF generation
// ---------------------------------------------------------------------------

interface BatchProgressProps {
  message: string;
  isActive: boolean;
}

export default function BatchProgress({ message, isActive }: BatchProgressProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
        >
          {/* Indeterminate animated bar */}
          <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "66%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ willChange: "width" }}
            />
          </div>

          {/* Status text */}
          {message && (
            <p className="text-sm text-text-muted text-center">{message}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
