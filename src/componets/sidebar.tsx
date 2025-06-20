import { useState, FC, useEffect } from 'react';
import Cookies from 'js-cookie';
import Logo from "../assets/logo.png";
import { Outlet, Link } from 'react-router-dom';
import { fetchUserProfile } from '../service/userService'; 
import type { UserProfile } from '../models/UserModels';  
import { decodeJWTAsync } from '../service/tokenDecoder';

interface NavItemProps {
  icon: string;
  text: string;
  isCollapsed: boolean;
  to: string;
}
interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

interface MainContentProps {
  isCollapsed: boolean;
}

const Layout: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <MainContent isCollapsed={isCollapsed} />
    </div>
  );
};

const Sidebar: FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  
  
    useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('authToken');
      const decodedToken = await decodeJWTAsync(token ?? '');
      if (!decodedToken) {
        setUser(null);
        return;
      }
      // Accede a user_id del token decodificado
      const userId = (decodedToken).person_id;
      if (!userId) {
        setUser(null);
        return;
      }
      fetchUserProfile(Number(userId))
        .then(setUser)
        .catch(() => setUser(null));
    };
    fetchUser();
  }, []);

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const handleLogout = () => {
    Cookies.remove('authToken'); 
    window.location.href = '/login'; 
  };

  return (
    <div
      className={`relative transition-all duration-500 ease-in-out shadow-lg bg-gradient-to-br from-[#0458AB] to-[#051537] 
      ${isCollapsed ? 'w-20' : 'w-56'} h-auto`}
  >
    {/* Logo */}
    <div className="px-3 py-3 mb-2 flex items-center transition-all duration-300 ease-in-out relative">
      <div className="brand flex items-center text-white">
        {!isCollapsed ? (
          <img
            src={Logo}
            alt="Move Wise Logo"
            className="h-10 mr-2 object-contain" // un poco más pequeño
          />
        ) : (
          <img
            src={Logo}
            alt="Move Wise Icon"
            className="h-6 mx-auto object-contain"
          />
        )}
        {!isCollapsed && (
          <span className="text-base font-semibold whitespace-nowrap">Movingwise</span>
        )}
      </div>
      <button
        className="w-6 h-6 bg-[#6c63ff] text-white rounded-full flex justify-center items-center cursor-pointer 
        transition-transform duration-300 ease-in-out absolute -right-3 hover:scale-110 text-base"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
      </button>
    </div>
    {/* Nombre de usuario */}
    {!isCollapsed && user && (
      <div className="px-3 mb-2 flex items-center gap-2 flex-wrap">
        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white">
          <img
            src={
              user.photo && user.photo.trim() !== ''
                ? user.photo
                : 'https://ui-avatars.com/api/?name=' +
                  encodeURIComponent(`${user.person.first_name} ${user.person.last_name}`) +
                  '&background=0458AB&color=fff&size=128'
            }
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-xs font-medium truncate">
            {user.person.first_name} {user.person.last_name}
          </span>
          <span className="text-white text-[10px] truncate opacity-70">
            {user.person.email}
          </span>
        </div>
      </div>
    )}
    <ul className="mt-4 list-none p-0 m-0">
      {/* NavItems */}
      <NavItem icon="fa-home" text="Home" isCollapsed={isCollapsed} to="/home" />
      <NavItem icon="fa-solid fa-box" text="Create daily" isCollapsed={isCollapsed} to="/create-daily" />

      {/* Nuevo Dropdown Cost */}
      <li className={`relative ${activeDropdown === 1 && !isCollapsed ? 'bg-[#6c63ff]' : ''}`}>
        <button
          className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-300 
          ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg"
          onClick={() => toggleDropdown(1)}
          disabled={isCollapsed}
        >
          <div className="flex items-center">
            <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
              <i className="fas fa-coins"></i>
            </span>
            {!isCollapsed && <span className="text-white text-lg">Cost</span>}
          </div>
          {!isCollapsed && (
            <i
              className={`fas text-lg transition-transform duration-300 ease-in-out 
              ${activeDropdown === 1 ? 'fa-chevron-down' : 'fa-chevron-right'} text-white`}
            ></i>
          )}
          <span className="relative left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-300 
            ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
        </button>
        {!isCollapsed && activeDropdown === 1 && (
          <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
            <DropdownLink icon="fa-calculator" text="Summary Costs" to="/summary-cost" />
            <DropdownLink icon="fa-gas-pump" text="Resume Fuel" to="/resume-fuel" />
            <DropdownLink icon="fa-dollar-sign" text="Extra Cost" to="/extra-cost" />
            <DropdownLink icon="fa-chart-line" text="Financials" to="/financialsView" />
          </ul>
        )}
      </li>

      <NavItem icon="fa-solid fa-money-bill" text="Payroll" isCollapsed={isCollapsed} to="/payroll" />

      {/* Nuevo Dropdown Warehouse */}
      <li className={`relative ${activeDropdown === 2 && !isCollapsed ? 'bg-[#6c63ff]' : ''}`}>
        <button
          className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-300 
          ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg"
          onClick={() => toggleDropdown(2)}
          disabled={isCollapsed}
        >
          <div className="flex items-center">
            <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
              <i className="fas fa-warehouse"></i>
            </span>
            {!isCollapsed && <span className="text-white text-lg">Warehouse</span>}
          </div>
          {!isCollapsed && (
            <i
              className={`fas text-lg transition-transform duration-300 ease-in-out 
              ${activeDropdown === 2 ? 'fa-chevron-down' : 'fa-chevron-right'} text-white`}
            ></i>
          )}
          <span className="relative left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-300 
            ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
        </button>
        {!isCollapsed && activeDropdown === 2 && (
          <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
            <DropdownLink icon="fa-plus" text="Create Warehouse" to="/create-warehouse" />
            <DropdownLink icon="fa-list" text="Warehouse List" to="/warehouse" />
          </ul>
        )}
      </li>

      {/* Dropdown Settings */}
      <li className={`relative ${activeDropdown === 0 && !isCollapsed ? 'bg-[#6c63ff]' : ''}`}>
        <button
          className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-300 
          ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg"
          onClick={() => toggleDropdown(0)}
          disabled={isCollapsed}
        >
          <div className="flex items-center">
            <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
              <i className="fas fa-cogs"></i>
            </span>
            {!isCollapsed && <span className="text-white text-lg">Settings</span>}
          </div>
          {!isCollapsed && (
            <i
              className={`fas text-lg transition-transform duration-300 ease-in-out 
              ${activeDropdown === 0 ? 'fa-chevron-down' : 'fa-chevron-right'} text-white`}
            ></i>
          )}
          <span className="relative left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-300 
            ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
        </button>
        {!isCollapsed && activeDropdown === 0 && (
          <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
            <DropdownLink icon="fa-building" text="Customers" to="/customers" />
            <DropdownLink icon="fa-user-cog" text="Create Admin" to="/create-admin" />
            <DropdownLink icon="fa-cog" text="General" to="/settings/general" />
            <DropdownLink icon="fa-user-shield" text="Privacy" to="/settings/privacy" />
            <DropdownLink icon="fa-bell" text="Notifications" to="/settings/notifications" />
          </ul>
        )}
      </li>
      {/* Botón de Logout */}
      <li>
        <div className="relative bottom-2 w-full">
          <button
            className="w-full flex items-center py-3 px-6 text-white transition-all duration-300 ease-in-out 
            hover:bg-red-600 hover:pl-10 text-lg"
            onClick={handleLogout}
          >
            <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
              <i className="fas fa-sign-out-alt text-white"></i>
            </span>
            {!isCollapsed && <span className="text-white text-lg">Logout</span>}
          </button>
        </div>
      </li>
    </ul>
  </div>
  );
};

const NavItem: FC<NavItemProps> = ({ icon, text, isCollapsed, to }) => {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-center py-3 px-6 text-white no-underline transition-all duration-300 
        ease-in-out relative hover:bg-[#60A3D9] hover:pl-10 text-lg"
      >
        <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
          <i className={`fas ${icon} text-white`}></i>
        </span>
        {!isCollapsed && <span className="text-white text-lg">{text}</span>}
        <span className="absolute left-0 top-0 w-1 h-full bg-white transition-transform duration-300 
          ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
      </Link>
    </li>
  );
};

// Nuevo componente para links en dropdown con icono
const DropdownLink: FC<{ icon: string; text: string; to: string }> = ({ icon, text, to }) => (
  <li>
    <Link
      to={to}
      className="flex items-center py-3 px-6 pl-14 no-underline transition-all duration-300 
      ease-in-out hover:bg-[#051537] hover:pl-16 text-lg !text-white"
    >
      <span className="w-7 h-7 leading-7 text-center inline-block mr-3 rounded-sm text-lg">
        <i className={`fas ${icon} text-white`}></i>
      </span>
      <span>{text}</span>
    </Link>
  </li>
);

const MainContent: FC<MainContentProps> = ({ isCollapsed }) => {
  return (
    <div
      className={`flex-1 overflow-auto transition-all duration-500 ease-in-out bg-[#f3f4f6] h-full
      ${isCollapsed ? 'ml-14' : 'ml-2'}`}
    >
      <div className="p-10">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
