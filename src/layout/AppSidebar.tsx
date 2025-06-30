import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDownIcon, HorizontaLDots, TableIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import modules from "../config/loadModules";
import {
  TaskIcon,
  GroupIcon,
  ListIcon,
  LockIcon,
  PlugInIcon,
  ChatIcon,
  BoxIcon,
  TimeIcon,
  FileIcon,
} from '../icons';
import { Users as LucideUsers, User as LucideUser, Plus as LucidePlus, FileText as LucideFileText } from 'lucide-react';

type NavItem = {
  icon?: React.ReactNode;
  name: string;
  path?: string;
  pro?: boolean;
  new?: boolean;
  subItems?: NavItem[];
  highlight?: boolean;
};

// Icon map for modules
const iconMap: Record<string, React.ReactNode> = {
  users: <LucideUsers size={20} />,
  roles: <GroupIcon />,
  permissions: <LockIcon />,
  role_permissions: <PlugInIcon />,
  user_roles: <ListIcon />,
  projects: <TableIcon />,
  project_members: <GroupIcon />,
  tasks: <TaskIcon />,
  comments: <ChatIcon />,
  attachments: <FileIcon />,
  time_logs: <TimeIcon />,
  // fallback
  default: <BoxIcon />,
};

// Dynamically generate navigation items
const jsonNavItems: NavItem[] = Object.entries(modules).map(([key, resource]) => ({
  icon: iconMap[key] || iconMap.default,
  name: resource.displayName,
  subItems: [
    { name: `List ${resource.displayName}`, path: `/${key}` },
    { name: `Create ${resource.displayName.slice(0, -1)}`, path: `/${key}/create` },
  ],
}));

// Find the users nav item in jsonNavItems and replace it with a custom one
const customUsersNav: NavItem = {
  icon: <LucideUsers size={20} />,
  name: 'Users',
  subItems: [
    {
      icon: <LucideUser size={18} />,
      name: 'User Directories',
      path: '/users',
    },
    {
      icon: <LucidePlus size={16} />,
      name: 'Create New Role',
      path: '/roles/create',
    },
    {
      icon: <LucidePlus size={16} className="opacity-70" />,
      name: 'Create New User',
      path: '/users/create',
    },
    {
      icon: <LucideFileText size={18} />,
      name: 'Audit Logs',
      path: '/audit-logs',
      highlight: true,
    },
  ],
};

const navItemsWithCustomUsers = jsonNavItems.map(item =>
  item.name === 'Users' ? customUsersNav : item
);

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  const handleSubmenuToggle = (submenuPath: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(submenuPath)
        ? prev.filter((path) => path !== submenuPath && !path.startsWith(submenuPath + "-"))
        : [...prev, submenuPath]
    );
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: string,
    parentPath: string[] = [],
    level: number = 0
  ) => (
    <ul className={`flex flex-col gap-4  ${level > 0 ? `ml-${level * 4} mt-2` : ""}`}>
      {items.map((nav, index) => {
        const submenuPath = [...parentPath, `${menuType}-${index}`].join("");
        const isSubmenuOpen = openSubmenus.includes(submenuPath);

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(submenuPath)}
                className={`menu-item group w-full text-left flex items-center ${
                  isSubmenuOpen ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center " : "lg:justify-start "
                }`}
              >
                <span
                  className={`menu-item-icon-size text-black-500  ${
                    isSubmenuOpen ? "menu-item-icon-active " : "menu-item-icon-inactive "
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text text-black ">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      isSubmenuOpen ? "rotate-180 text-brand-500 " : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group flex items-center ${
                    !isExpanded && !isHovered ? "lg:justify-center " : "lg:justify-start"
                  }`}
                >
                  <span className="menu-item-icon-size">{nav.icon}</span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text ">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isSubmenuOpen ? "block" : "hidden"
                }`}
              >
                {renderMenuItems(nav.subItems, menuType, [...parentPath, `${menuType}-${index}`], level + 1)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white h-screen transition-all text-black-100 duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                src="/images/logo/logo.png"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/Ebizneeds_uni_logo.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-black ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItemsWithCustomUsers, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;