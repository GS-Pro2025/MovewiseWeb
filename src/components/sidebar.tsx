import { useState, FC, useEffect } from 'react';
import Cookies from 'js-cookie';
import Logo from "../assets/logo.png";
import LogoText from "../assets/RecursoMovewise.png";
import { Outlet, Link } from 'react-router-dom';
import { fetchUserProfile } from '../service/userService'; 
import type { UserProfile } from '../models/UserModels';  
import { decodeJWTAsync } from '../service/tokenDecoder';
import backgroundImg from '../assets/patron_modo_claro.png';

interface NavItemProps {
  icon: string;
  text: string;
  isCollapsed: boolean;
  to: string;
  onClick?: () => void;
}
interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
}

// Definir los estilos CSS como string
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    transition: background 0.2s;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
  
  /* Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
  }
`;

const Layout: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inyectar estilos en el head del documento
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = scrollbarStyles;
    document.head.appendChild(styleElement);

    // Cleanup: remover el estilo cuando el componente se desmonte
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Prevenir scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <div className="flex h-screen relative">
      {/* Botón hamburguesa para móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-[10000] w-10 h-10 bg-[#0458AB] text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-[#0458AB]/90 transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle mobile menu"
      >
        <i className={`fas ${isMobileOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
      </button>

      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[9997] transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        closeMobileMenu={() => setIsMobileOpen(false)}
      />
      <MainContent />
    </div>
  );
};

const Sidebar: FC<SidebarProps> = ({ isCollapsed, toggleSidebar, isMobileOpen, closeMobileMenu }) => {
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
    //  CAMBIO: Redirigir a la landing page principal en lugar de /login
    window.location.href = '/'; 
  };

  return (
    <div
      className={`
        fixed md:relative
        transition-all duration-300 ease-in-out shadow-lg bg-gradient-to-br from-[#0458AB] to-[#051537] 
        ${isCollapsed && !isMobileOpen ? 'w-20' : 'w-56'} 
        h-screen flex flex-col overflow-hidden
        ${isMobileOpen ? 'left-0 z-[9998]' : '-left-full md:left-0'}
      `}
    >
      {/* Logo */}
      <div className="px-3 py-4 mb-3 flex flex-col items-center transition-all duration-700 ease-in-out relative flex-shrink-0">
        {/* Botón cerrar para móvil */}
        <button
          className="md:hidden absolute right-3 top-3 w-8 h-8 text-white/70 hover:text-white transition-colors"
          onClick={closeMobileMenu}
          aria-label="Close mobile menu"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        {/* Logo centrado */}
        <div className="flex justify-center w-full mb-3 transition-all duration-700 ease-in-out">
          <img
            src={Logo}
            alt="Move Wise Logo"
            className={`object-contain rounded-lg bg-white transition-all duration-700 ease-in-out transform ${
              isCollapsed && !isMobileOpen ? 'h-10 w-10 scale-90' : 'h-20 w-20 scale-100'
            }`}
          />
        </div>
        
        {/* Imagen de texto centrada (solo cuando no está colapsado o en móvil) */}
        <div className={`flex justify-center w-full transition-all duration-700 ease-in-out transform ${
          isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 h-0 overflow-hidden' : 'opacity-100 scale-100 h-auto'
        }`}>
          <img
            src={LogoText}
            alt="Movingwise"
            className="h-15 object-contain transition-all duration-700 ease-in-out"
          />
        </div>
        
        {/* Botón toggle (solo en desktop) */}
        <button 
          className="hidden md:flex w-7 h-7 bg-[#FE9844] text-white rounded-full justify-center items-center cursor-pointer 
                     transition-all duration-700 ease-in-out absolute -right-1 top-4/5 -translate-y-1/2 hover:scale-110 hover:bg-[#FE9844]/20 
                     shadow-lg hover:shadow-xl text-sm z-[10]"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <i className={`fas transition-transform duration-700 ease-in-out ${
            isCollapsed ? 'fa-chevron-right rotate-0' : 'fa-chevron-left rotate-0'
          }`}></i>
        </button>
      </div>
      
      {/* Contenedor scrolleable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Nombre de usuario centrado */}
        <div className={`px-3 mb-4 flex flex-col items-center transition-all duration-700 ease-in-out transform ${
          isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 h-0 overflow-hidden mb-0' : 'opacity-100 scale-100 h-auto mb-4'
        }`}>
          {user && (
            <>
              {/* Foto de perfil centrada */}
              <Link to="/app/profile" className="w-12 h-12 rounded-full overflow-hidden border-2 border-white mb-3 transition-all duration-700 ease-in-out shadow-lg hover:border-[#FE9844] block">
                <img
                  src={
                    user.photo && user.photo.trim() !== ''
                      ? user.photo
                      : 'https://ui-avatars.com/api/?name=' +
                        encodeURIComponent(`${user.person.first_name} ${user.person.last_name}`) +
                        '&background=0458AB&color=fff&size=128'
                  }
                  alt="User Avatar"
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                />
              </Link>
              {/* Información del usuario centrada */}
              <Link to="/app/profile" className="text-center transition-all duration-700 ease-in-out hover:text-[#FE9844] block">
                <div className="text-white text-sm font-semibold transition-all duration-700 ease-in-out">
                  {user.person.first_name} {user.person.last_name}
                </div>
                <div className="text-white text-xs opacity-80 truncate max-w-[180px] mt-1 transition-all duration-700 ease-in-out">
                  {user.person.email}
                </div>
              </Link>
            </>
          )}
        </div>
        
        <ul className="mt-4 list-none p-0 m-0 flex flex-col pb-4">
          {/* CAMBIO: Actualizar todas las rutas con /app prefix */}
          <NavItem icon="fa-home" text="Dashboard" isCollapsed={isCollapsed && !isMobileOpen} to="/app/dashboard" onClick={closeMobileMenu} />
          <NavItem icon="fa-solid fa-box" text="Create daily" isCollapsed={isCollapsed && !isMobileOpen} to="/app/create-daily" onClick={closeMobileMenu} />
          <NavItem icon="fa-solid fa-money-bill" text="Payroll" isCollapsed={isCollapsed && !isMobileOpen} to="/app/payroll" onClick={closeMobileMenu} />
          <NavItem icon="fa-users" text="Operators" isCollapsed={isCollapsed && !isMobileOpen} to="/app/operators" onClick={closeMobileMenu} /> 
          
          {/* NUEVO: Agregar opción de Statements */}
          <NavItem icon="fa-file-invoice-dollar" text="Statements" isCollapsed={isCollapsed && !isMobileOpen} to="/app/statements" onClick={closeMobileMenu} />
          
          <NavItem icon="fa-chart-bar" text="Statistics" isCollapsed={isCollapsed && !isMobileOpen} to="/app/statistics" onClick={closeMobileMenu} />

          {/* Dropdown Cost */}
          <li className={`relative transition-all duration-700 ease-in-out ${activeDropdown === 1 && !isCollapsed ? 'bg-[#6c63ff]' : ''}`}>
            <button
              className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-700 
              ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg group"
              onClick={() => toggleDropdown(1)}
              disabled={isCollapsed && !isMobileOpen}
            >
              <div className="flex items-center">
                <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg transition-all duration-700 ease-in-out">
                  <i className="fas fa-coins"></i>
                </span>
                <span className={`text-white text-lg transition-all duration-700 ease-in-out transform ${
                  isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
                }`}>Cost</span>
              </div>
              <i className={`fas text-lg transition-all duration-700 ease-in-out transform ${
                isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 w-0' : 'opacity-100 scale-100 w-auto'
              } ${activeDropdown === 1 ? 'fa-chevron-down rotate-180' : 'fa-chevron-right rotate-0'} text-white`}></i>
              <span className="absolute left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-700 
                ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
            </button>
            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
              (!isCollapsed || isMobileOpen) && activeDropdown === 1 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
                {/*  Actualizar rutas del dropdown */}
                <DropdownLink icon="fa-calculator" text="Summary Costs" to="/app/summary-cost" onClick={closeMobileMenu} />
                <DropdownLink icon="fa-gas-pump" text="Resume Fuel" to="/app/resume-fuel" onClick={closeMobileMenu} />
                <DropdownLink icon="fa-dollar-sign" text="Extra Cost" to="/app/extra-cost" onClick={closeMobileMenu} />
              </ul>
            </div>
          </li>

          {/* Dropdown Warehouse */}
          <li className={`relative transition-all duration-700 ease-in-out ${activeDropdown === 2 && !isCollapsed ? 'bg-[#6c63ff]' : ''}`}>
            <button
              className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-700 
              ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg group"
              onClick={() => toggleDropdown(2)}
              disabled={isCollapsed && !isMobileOpen}
            >
              <div className="flex items-center">
                <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg transition-all duration-700 ease-in-out">
                  <i className="fas fa-warehouse"></i>
                </span>
                <span className={`text-white text-lg transition-all duration-700 ease-in-out transform ${
                  isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
                }`}>Warehouse</span>
              </div>
              <i className={`fas text-lg transition-all duration-700 ease-in-out transform ${
                isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 w-0' : 'opacity-100 scale-100 w-auto'
              } ${activeDropdown === 2 ? 'fa-chevron-down rotate-180' : 'fa-chevron-right rotate-0'} text-white`}></i>
              <span className="absolute left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-700 
                ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
            </button>
            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
              (!isCollapsed || isMobileOpen) && activeDropdown === 2 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
                {/* Actualizar rutas del dropdown */}
                <DropdownLink icon="fa-plus" text="Create Warehouse" to="/app/create-warehouse" onClick={closeMobileMenu} />
                <DropdownLink icon="fa-list" text="Warehouse List" to="/app/warehouse" onClick={closeMobileMenu} />
              </ul>
            </div>
          </li>

          {/* Dropdown Settings - CONDICIONADO A is_superUser */}
          <li className={`relative transition-all duration-700 ease-in-out ${activeDropdown === 0 && !isCollapsed ? 'bg-[#6c63ff]' : ''}`}>
            <button
              className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-700 
              ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg group"
              onClick={() => toggleDropdown(0)}
              disabled={isCollapsed && !isMobileOpen}
            >
              <div className="flex items-center">
                <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg transition-all duration-700 ease-in-out">
                  <i className="fas fa-cogs"></i>
                </span>
                <span className={`text-white text-lg transition-all duration-700 ease-in-out transform ${
                  isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
                }`}>Settings</span>
              </div>
              <i className={`fas text-lg transition-all duration-700 ease-in-out transform ${
                isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 w-0' : 'opacity-100 scale-100 w-auto'
              } ${activeDropdown === 0 ? 'fa-chevron-down rotate-180' : 'fa-chevron-right rotate-0'} text-white`}></i>
              <span className="absolute left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-700 
                ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
            </button>
            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
              (!isCollapsed || isMobileOpen) && activeDropdown === 0 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
                <DropdownLink icon="fa-user" text="My Profile" to="/app/profile" onClick={closeMobileMenu} />
                <DropdownLink icon="fa-building" text="Customers" to="/app/customers" onClick={closeMobileMenu} />
                <DropdownLink icon="fa-briefcase" text="Jobs & Tools" to="/app/jobs-tools" onClick={closeMobileMenu} />
                
                {/* Solo mostrar "Admins" si es superUser */}
                {user && user.is_superUser ? (
                  <DropdownLink icon="fa-users-cog" text="Admins" to="/app/admins" onClick={closeMobileMenu} />
                ) : null}
              </ul>
            </div>
          </li>
        </ul>
      </div>
      
      {/* Botón de Logout (fuera del scroll) */}
      <div className="mt-auto border-t border-white/10">
        <button
          className="w-full flex items-center py-4 px-6 text-white transition-all duration-700 ease-in-out 
          hover:bg-red-600 hover:pl-10 text-lg group"
          onClick={handleLogout}
        >
          <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg transition-all duration-700 ease-in-out">
            <i className="fas fa-sign-out-alt text-white"></i>
          </span>
          <span className={`text-white text-lg transition-all duration-700 ease-in-out transform ${
            isCollapsed && !isMobileOpen ? 'opacity-0 scale-75 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
          }`}>Logout</span>
        </button>
      </div>
    </div>
  );
};

const NavItem: FC<NavItemProps> = ({ icon, text, isCollapsed, to, onClick }) => {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-center py-3 px-6 text-white no-underline transition-all duration-700 
        ease-in-out relative hover:bg-[#60A3D9] hover:pl-10 text-lg"
        onClick={onClick}
      >
        <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg transition-all duration-700 ease-in-out">
          <i className={`fas ${icon} text-white`}></i>
        </span>
        <span className={`text-white text-lg transition-all duration-700 ease-in-out transform ${
          isCollapsed ? 'opacity-0 scale-75 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'
        }`}>{text}</span>
        <span className="absolute left-0 top-0 w-1 h-full bg-white transition-transform duration-700 
          ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
      </Link>
    </li>
  );
};

// Nuevo componente para links en dropdown con icono
const DropdownLink: FC<{ icon: string; text: string; to: string; onClick?: () => void }> = ({ icon, text, to, onClick }) => (
  <li>
    <Link
      to={to}
      className="flex items-center py-3 px-6 pl-14 no-underline transition-all duration-300 
      ease-in-out hover:bg-[#051537] hover:pl-16 text-lg !text-white"
      onClick={onClick}
    >
      <span className="w-7 h-7 leading-7 text-center inline-block mr-3 rounded-sm text-lg">
        <i className={`fas ${icon} text-white`}></i>
      </span>
      <span>{text}</span>
    </Link>
  </li>
);

const MainContent: FC = () => {
  return (
    <div 
      className="flex-1 overflow-auto h-full bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${backgroundImg})`
      }}
    >
      {/* Overlay opcional para mejorar legibilidad */}
      <div className="absolute inset-0 bg-white/10 pointer-events-none" />
      
      {/* Añadir padding top en móvil para el botón hamburguesa */}
      <div className="relative z-10 p-10 md:p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;