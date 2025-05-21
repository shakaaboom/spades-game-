
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Create the media query
    const media = window.matchMedia(query);
    
    // Function to update the state
    const listener = () => {
      setMatches(media.matches);
    };
    
    // Check on mount and add listener
    listener();
    media.addEventListener("change", listener);
    
    // Cleanup on unmount
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);
  
  return matches;
}
