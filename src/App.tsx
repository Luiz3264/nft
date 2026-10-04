import { useEffect, useState } from "react";

import AppDesktop from "./AppDesktop";
import AppMobile from "./AppMobile";

export default function App() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile ? <AppMobile /> : <AppDesktop />;
}
