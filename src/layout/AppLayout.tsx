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
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader hidden={headerHidden} blurSidebarToggle={blurSidebarToggle} />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-3">
          <Outlet />
        </div>
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
