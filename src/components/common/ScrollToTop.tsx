import { useEffect } from "react";
import { useLocation } from "react-router";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return (
    <button className="scroll-to-top fixed bottom-4 right-4 z-50 p-2 rounded-full bg-blue-600 text-white shadow-lg sm:bottom-8 sm:right-8">
      Scroll to Top
    </button>
  );
}
