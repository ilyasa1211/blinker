import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "./Camera";

// When using the Tauri API npm package:

const MAX_THRESHOLD_BEFORE_CLOSE = 0.35; // eyes closed
const MIN_THRESHOLD_BEFORE_OPEN = 0.2; // eyes open
const TIMEOUT_SINCE_LAST_BLINK_MS = 0.5 * 1000; // 0.5 seconds

function showOverlay() {
  window.api?.showOverlay();
}

function hideOverlay() {
  window.api?.hideOverlay();
}

function App() {
  const timeoutIdRef = useRef<number | undefined | NodeJS.Timeout>(undefined);
  const [blinkCount, setBlinkCount] = useState<number>(0);
  const isEyesCloseRef = useRef<boolean>(false);

  const removeTimeout = useCallback(() => {
    clearTimeout(timeoutIdRef.current);
  }, []);

  const resetTimeout = useCallback((callback: () => void) => {
    clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(callback, TIMEOUT_SINCE_LAST_BLINK_MS);
  }, []);

  useEffect(() => {
    timeoutIdRef.current = setTimeout(showOverlay, TIMEOUT_SINCE_LAST_BLINK_MS);
  }, []);

  const incrementBlinkCounter = useCallback(() => {
    setBlinkCount((prev) => prev + 1);
  }, []);

  const handleEyesClose = useCallback(() => {
    hideOverlay();
    removeTimeout();

    if (isEyesCloseRef.current == false) {
      isEyesCloseRef.current = true;
      incrementBlinkCounter();
    }
  }, [removeTimeout, incrementBlinkCounter]);

  const handleEyesOpen = useCallback(() => {
    if (isEyesCloseRef.current == true) {
      isEyesCloseRef.current = false;
      resetTimeout(showOverlay);
    }
  }, [resetTimeout]);

  return (
    <>
      <Camera
        onEyesClose={handleEyesClose}
        onEyesOpen={handleEyesOpen}
        maxThresholdBeforeEyesClose={MAX_THRESHOLD_BEFORE_CLOSE}
        minThresholdBeforeEyesOpen={MIN_THRESHOLD_BEFORE_OPEN}
      />
      <p>Blink count: {blinkCount}</p>
    </>
  );
}

export default App;
