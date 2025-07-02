import React, { useEffect, useRef, useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

interface AppHeaderProps {
  hidden?: boolean;
  blurSidebarToggle?: boolean;
  modalBlur?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ hidden, blurSidebarToggle, modalBlur = false }) => {
  if (hidden) return null;

  const { isExpanded, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [logo, setLogo] = useState<string>("/images/logo/hawnd.png");

  useEffect(() => {
    const storedLogo = localStorage.getItem("appLogo");
    if (storedLogo) {
      setLogo(storedLogo);
    }
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className={`sticky top-0 flex w-full border-gray-200 z-99999 lg:border-b bg-white`}>
      {modalBlur && (
        <div className="absolute inset-0 w-full h-full z-50 pointer-events-none backdrop-blur-[32px] bg-white/60"></div>
      )}
      <div className={`flex flex-col items-center justify-between grow lg:flex-row lg:px-6 relative z-60`}>
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className={`items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 lg:flex lg:h-11 lg:w-11 lg:border${blurSidebarToggle ? ' backdrop-blur-sm bg-white/50 pointer-events-none' : ''}`}
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            disabled={blurSidebarToggle}
          >
            {isExpanded ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>
          <div className="ml-2 flex items-center">
            <img src={logo} alt="Logo" className="h-11 w-auto max-w-[160px] object-contain transition-all duration-200" />
          </div>
        </div>
        <div className="flex items-center justify-end w-full gap-4 px-5 py-4 lg:flex lg:shadow-none lg:px-0">
          <div className="flex items-center gap-2 2xsm:gap-3">
            {/* <NotificationDropdown /> */}
            {/*
            <form className="relative max-w-xs hidden lg:block ml-4">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500">
                <span> ⌘ </span>
                <span> K </span>
              </button>
            </form>
            */}
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;