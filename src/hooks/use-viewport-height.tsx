
import { useEffect } from "react";

export const useViewportHeight = () => {
  useEffect(() => {
    // Function to set the viewport height variable
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Set the height initially
    setVH();

    // Add event listener for window resize
    window.addEventListener("resize", setVH);
    
    // Handle orientation change specifically for mobile
    window.addEventListener("orientationchange", () => {
      // Small delay to ensure the browser has updated the viewport dimensions
      setTimeout(setVH, 100);
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);
};

// Create a component version for easier use
export const ViewportHeightFix = () => {
  useViewportHeight();
  return null;
};
