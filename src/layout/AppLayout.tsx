import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { HeaderVisibilityProvider, useHeaderVisibility } from "../context/HeaderVisibilityContext";
import { useState } from 'react';

declare global {
  interface Window {
    setBlurSidebarToggle?: (blur: boolean) => void;
  }
}

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { headerHidden } = useHeaderVisibility();
  const [blurSidebarToggle, setBlurSidebarToggle] = useState(false);

  // Provide a way for UserDropdown to set blurSidebarToggle
  window.setBlurSidebarToggle = setBlurSidebarToggle;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar overlays on mobile, static on desktop */}
      <div className="fixed inset-0 z-50 lg:static lg:z-auto">
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 bg-white
          ${isExpanded || isHovered ? "lg:ml-[260px]" : "lg:ml-[70px]"}
          ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader hidden={headerHidden} blurSidebarToggle={blurSidebarToggle} />
        <main className="flex-1 w-full p-2 sm:p-3 md:p-4 max-w-full overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <HeaderVisibilityProvider>
        <LayoutContent />
      </HeaderVisibilityProvider>
    </SidebarProvider>
  );
};

export default AppLayout;
