import React from "react";
import Bell from '../../icons/alert.svg';
import { UserIcon } from '../../icons';

// Define the interface for the props
type HeaderProps = {
  onToggle: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggle }) => {
  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 lg:border-b">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            aria-controls="sidebar"
            onClick={onToggle}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span className="relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white"></span>
                <span className="relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[150] duration-200 ease-in-out dark:bg-white"></span>
                <span className="relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[300] duration-200 ease-in-out dark:bg-white"></span>
              </span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <li>
              <button className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white">
                <img src={Bell} alt="Bell" className="w-5 h-5" />
              </button>
            </li>
          </ul>

          <div className="flex items-center gap-3 2xsm:gap-7">
            <div className="relative">
              <button className="flex items-center gap-4 rounded-lg py-2 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base">
                <UserIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
