import { useCallback, useRef, useState } from "react";
import { Camera } from "./Camera";

// When using the Tauri API npm package:

const THRESHOLD_EYES_CLOSE = 0.5; // eyes open
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
  const [isActive, setIsActive] = useState<boolean>(false);

  const removeTimeout = useCallback(() => {
    clearTimeout(timeoutIdRef.current);
  }, []);

  const resetTimeout = useCallback((callback: () => void) => {
    clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(callback, TIMEOUT_SINCE_LAST_BLINK_MS);
  }, []);

  const incrementBlinkCounter = useCallback(() => {
    setBlinkCount((prev) => prev + 1);
  }, []);

  const handleEyesClose = useCallback(() => {
    if (isEyesCloseRef.current == false) {
      isEyesCloseRef.current = true;
      incrementBlinkCounter();
    }

    if (!isActive) return;

    hideOverlay();
    removeTimeout();
  }, [removeTimeout, incrementBlinkCounter, isActive]);

  const handleEyesOpen = useCallback(() => {
    if (isEyesCloseRef.current == true) {
      isEyesCloseRef.current = false;

      if (!isActive) return;

      resetTimeout(showOverlay);
    }
  }, [resetTimeout, isActive]);

  const handleActivation = () => {
    if (isActive) {
      hideOverlay();
      removeTimeout();
    } else {
      resetTimeout(showOverlay);
    }

    setIsActive(!isActive);
  };

  return (
    <main>
      <Camera
        onEyesClose={handleEyesClose}
        onEyesOpen={handleEyesOpen}
        thresholdEyesClose={THRESHOLD_EYES_CLOSE}
        style={{
          backgroundColor: "dimgray",
        }}
      />
      <div
        style={{
          padding: "1rem",
          fontSize: "1.5rem",
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <p>Blink count: {blinkCount}</p>
      </div>
      <div onClick={handleActivation}>
        <input
          type="checkbox"
          name="Active"
          id="activate_checkbox"
          checked={isActive}
          style={{
            padding: "0.5rem",
          }}
        />
        <label
          htmlFor="activated_checkbox"
          style={{
            padding: "1rem",
            fontSize: "1.5rem",
          }}
        >
          Active
        </label>
      </div>
    </main>
  );
}

export default App;
