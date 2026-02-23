import { useState, FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import Logo from "../assets/logo.png";
import LogoText from "../assets/RecursoMovewise.png";
import { Outlet, Link } from "react-router-dom";
import { fetchUserProfile } from "../service/userService";
import type { UserProfile } from "../models/UserModels";
import { decodeJWTAsync } from "../service/tokenDecoder";
import backgroundImg from "../assets/patron_modo_claro.png";

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

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 3px; transition: background 0.2s; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
  .custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.3) rgba(255,255,255,0.1); }
`;

const Layout: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = scrollbarStyles;
    document.head.appendChild(styleElement);
    return () => { document.head.removeChild(styleElement); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  return (
    <div className="flex h-screen relative">
      <button
        className="md:hidden fixed top-4 left-4 z-[10000] w-10 h-10 bg-[#0458AB] text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-[#0458AB]/90 transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={t("sidebar.toggleMenu")}
      >
        <i className={`fas ${isMobileOpen ? "fa-times" : "fa-bars"} text-xl`}></i>
      </button>

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
  const { t, i18n } = useTranslation();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get("authToken");
      const decodedToken = await decodeJWTAsync(token ?? "");
      if (!decodedToken) { setUser(null); return; }
      const userId = decodedToken.person_id;
      if (!userId) { setUser(null); return; }
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
    Cookies.remove("authToken");
    window.location.href = "/";
  };

  // Dropdown indices: 0 = Settings, 1 = Cost, 2 = Finance
  const dropdownClass = (index: number) =>
    `relative transition-all duration-700 ease-in-out ${
      activeDropdown === index && !isCollapsed ? "bg-[#6c63ff]" : ""
    }`;

  const chevronClass = (index: number) =>
    `fas text-lg transition-all duration-700 ease-in-out transform ${
      isCollapsed && !isMobileOpen ? "opacity-0 scale-75 w-0" : "opacity-100 scale-100 w-auto"
    } ${activeDropdown === index ? "fa-chevron-down rotate-180" : "fa-chevron-right rotate-0"} text-white`;

  const dropdownPanelClass = (index: number) =>
    `overflow-hidden transition-all duration-700 ease-in-out ${
      (!isCollapsed || isMobileOpen) && activeDropdown === index
        ? "max-h-96 opacity-100"
        : "max-h-0 opacity-0"
    }`;

  const labelClass = `text-white text-lg transition-all duration-700 ease-in-out transform ${
    isCollapsed && !isMobileOpen ? "opacity-0 scale-75 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
  }`;

  return (
    <div
      className={`
        fixed md:relative transition-all duration-300 ease-in-out shadow-lg bg-gradient-to-br from-[#0458AB] to-[#051537]
        ${isCollapsed && !isMobileOpen ? "w-20" : "w-56"}
        h-screen flex flex-col overflow-hidden
        ${isMobileOpen ? "left-0 z-[9998]" : "-left-full md:left-0"}
      `}
    >
      {/* Logo */}
      <div className="px-3 py-4 mb-3 flex flex-col items-center transition-all duration-700 ease-in-out relative flex-shrink-0">
        <button
          className="md:hidden absolute right-3 top-3 w-8 h-8 text-white/70 hover:text-white transition-colors"
          onClick={closeMobileMenu}
          aria-label={t("sidebar.closeMobileMenu")}
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        <div className="flex justify-center w-full mb-3 transition-all duration-700 ease-in-out">
          <img
            src={Logo}
            alt={t("sidebar.logoAlt")}
            className={`object-contain rounded-lg bg-white transition-all duration-700 ease-in-out transform ${
              isCollapsed && !isMobileOpen ? "h-10 w-10 scale-90" : "h-20 w-20 scale-100"
            }`}
          />
        </div>

        <div
          className={`flex justify-center w-full transition-all duration-700 ease-in-out transform ${
            isCollapsed && !isMobileOpen
              ? "opacity-0 scale-75 h-0 overflow-hidden"
              : "opacity-100 scale-100 h-auto"
          }`}
        >
          <img src={LogoText} alt={t("sidebar.logoTextAlt")} className="h-15 object-contain transition-all duration-700 ease-in-out" />
        </div>

        <button
          className="hidden md:flex w-7 h-7 bg-[#FE9844] text-white rounded-full justify-center items-center cursor-pointer
                     transition-all duration-700 ease-in-out absolute -right-1 top-4/5 -translate-y-1/2 hover:scale-110 hover:bg-[#FE9844]/20
                     shadow-lg hover:shadow-xl text-sm z-[10]"
          onClick={toggleSidebar}
          aria-label={t("sidebar.toggleSidebar")}
        >
          <i className={`fas transition-transform duration-700 ease-in-out ${isCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`}></i>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">

        {/* User info */}
        <div
          className={`px-3 mb-4 flex flex-col items-center transition-all duration-700 ease-in-out transform ${
            isCollapsed && !isMobileOpen
              ? "opacity-0 scale-75 h-0 overflow-hidden mb-0"
              : "opacity-100 scale-100 h-auto mb-4"
          }`}
        >
          {user && (
            <>
              <Link
                to="/app/profile"
                className="w-12 h-12 rounded-full overflow-hidden border-2 border-white mb-3 transition-all duration-700 ease-in-out shadow-lg hover:border-[#FE9844] block"
              >
                <img
                  src={
                    user.photo && user.photo.trim() !== ""
                      ? user.photo
                      : "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(`${user.person.first_name} ${user.person.last_name}`) +
                        "&background=0458AB&color=fff&size=128"
                  }
                  alt={t("sidebar.userAvatarAlt")}
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                />
              </Link>
              <Link to="/app/profile" className="text-center transition-all duration-700 ease-in-out hover:text-[#FE9844] block">
                <div className="text-white text-sm font-semibold">
                  {user.person.first_name} {user.person.last_name}
                </div>
                <div className="text-white text-xs opacity-80 truncate max-w-[180px] mt-1">
                  {user.person.email}
                </div>
              </Link>
            </>
          )}
        </div>

        <ul className="mt-4 list-none p-0 m-0 flex flex-col pb-4">

          {/* Nav items */}
          <NavItem icon="fa-home"              text={t("sidebar.nav.dashboard")}      isCollapsed={isCollapsed && !isMobileOpen} to="/app/dashboard"       onClick={closeMobileMenu} />
          <NavItem icon="fa-solid fa-box"      text={t("sidebar.nav.createDaily")}    isCollapsed={isCollapsed && !isMobileOpen} to="/app/create-daily"    onClick={closeMobileMenu} />
          <NavItem icon="fa-solid fa-money-bill" text={t("sidebar.nav.payroll")}      isCollapsed={isCollapsed && !isMobileOpen} to="/app/payroll"          onClick={closeMobileMenu} />
          <NavItem icon="fa-warehouse"         text={t("sidebar.nav.createWarehouse")} isCollapsed={isCollapsed && !isMobileOpen} to="/app/create-warehouse" onClick={closeMobileMenu} />
          {user?.is_superUser && (
            <NavItem icon="fa-file-invoice-dollar" text={t("sidebar.nav.statements")} isCollapsed={isCollapsed && !isMobileOpen} to="/app/statements"      onClick={closeMobileMenu} />
          )}
          {user?.is_superUser && (
            <NavItem icon="fa-chart-bar"       text={t("sidebar.nav.statistics")}     isCollapsed={isCollapsed && !isMobileOpen} to="/app/statistics"      onClick={closeMobileMenu} />
          )}

          {/* ── Dropdown: Cost (index 1) ── */}
          <li className={dropdownClass(1)}>
            <button
              className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-700 ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg group"
              onClick={() => toggleDropdown(1)}
              disabled={isCollapsed && !isMobileOpen}
            >
              <div className="flex items-center">
                <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
                  <i className="fas fa-coins"></i>
                </span>
                <span className={labelClass}>{t("sidebar.nav.cost")}</span>
              </div>
              <i className={chevronClass(1)}></i>
              <span className="absolute left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-700 ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
            </button>
            <div className={dropdownPanelClass(1)}>
              <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
                <DropdownLink icon="fa-calculator"  text={t("sidebar.nav.summaryCosts")} to="/app/summary-cost"  onClick={closeMobileMenu} />
                <DropdownLink icon="fa-gas-pump"     text={t("sidebar.nav.resumeFuel")}   to="/app/resume-fuel"   onClick={closeMobileMenu} />
                <DropdownLink icon="fa-dollar-sign"  text={t("sidebar.nav.extraCost")}    to="/app/extra-cost"    onClick={closeMobileMenu} />
              </ul>
            </div>
          </li>

          {/* ── Dropdown: Finance (index 2) ── */}
          {user?.is_superUser && (
            <li className={dropdownClass(2)}>
              <button
                className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-700 ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg group"
                onClick={() => toggleDropdown(2)}
                disabled={isCollapsed && !isMobileOpen}
              >
                <div className="flex items-center">
                  <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
                    <i className="fas fa-chart-pie"></i>
                  </span>
                  <span className={labelClass}>{t("sidebar.nav.finance")}</span>
                </div>
                <i className={chevronClass(2)}></i>
                <span className="absolute left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-700 ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
              </button>
              <div className={dropdownPanelClass(2)}>
                <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
                  <DropdownLink icon="fa-coins"                text={t("sidebar.nav.financials")}       to="/app/financials"        onClick={closeMobileMenu} />
                  <DropdownLink icon="fa-file-invoice-dollar"  text={t("sidebar.nav.expenseBreakdown")} to="/app/expense-breakdown"  onClick={closeMobileMenu} />
                  <DropdownLink icon="fa-hand-holding-usd"     text={t("sidebar.nav.operatorLoans")}    to="/app/operator-loans"    onClick={closeMobileMenu} />
                </ul>
              </div>
            </li>
          )}

          {/* ── Dropdown: Settings (index 0) ── */}
          <li className={dropdownClass(0)}>
            <button
              className="w-full flex items-center justify-between py-3 px-6 text-white transition-all duration-700 ease-in-out relative hover:bg-[#575b8a] hover:pl-10 text-lg group"
              onClick={() => toggleDropdown(0)}
              disabled={isCollapsed && !isMobileOpen}
            >
              <div className="flex items-center">
                <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
                  <i className="fas fa-cogs"></i>
                </span>
                <span className={labelClass}>{t("sidebar.nav.settings")}</span>
              </div>
              <i className={chevronClass(0)}></i>
              <span className="absolute left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-700 ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
            </button>
            <div className={dropdownPanelClass(0)}>
              <ul className="list-none p-0 m-0 text-white bg-[#0458AB]">
                <DropdownLink icon="fa-user"      text={t("sidebar.nav.myProfile")}  to="/app/profile"    onClick={closeMobileMenu} />
                <DropdownLink icon="fa-building"  text={t("sidebar.nav.customers")}  to="/app/customers"  onClick={closeMobileMenu} />
                <DropdownLink icon="fa-briefcase" text={t("sidebar.nav.jobsTools")}  to="/app/jobs-tools" onClick={closeMobileMenu} />
                <DropdownLink icon="fa-truck" text={t("sidebar.nav.trucks")} to="/app/trucks"  onClick={closeMobileMenu} />
                <DropdownLink icon="fa-users"     text={t("sidebar.nav.operators")}  to="/app/operators"  onClick={closeMobileMenu} />
                {user?.is_superUser && (
                  <>
                    <DropdownLink icon="fa-city"       text={t("sidebar.nav.myCompany")} to="/app/my-company" onClick={closeMobileMenu} />
                    <DropdownLink icon="fa-users-cog"  text={t("sidebar.nav.admins")}    to="/app/admins"     onClick={closeMobileMenu} />
                  </>
                )}
              </ul>
            </div>
          </li>

        </ul>
      </div>

      {/* Language Switcher */}
      <div
        className={`border-t border-white/10 px-4 py-3 flex items-center gap-3 transition-all duration-500 ${
          isCollapsed && !isMobileOpen ? "justify-center flex-col gap-2" : "justify-start"
        }`}
      >
        <button
          onClick={() => i18n.changeLanguage("en")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
            i18n.language === "en"
              ? "bg-white/20 text-white ring-1 ring-white/40"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          aria-label="English"
        >
          <img src="https://flagcdn.com/us.svg" alt="English" className="w-5 h-5 rounded-sm object-cover" />
          <span className={`transition-all duration-500 ${isCollapsed && !isMobileOpen ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}>
            EN
          </span>
        </button>

        <button
          onClick={() => i18n.changeLanguage("es")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
            i18n.language === "es"
              ? "bg-white/20 text-white ring-1 ring-white/40"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
          aria-label="Español"
        >
          <img src="https://flagcdn.com/es.svg" alt="Español" className="w-5 h-5 rounded-sm object-cover" />
          <span className={`transition-all duration-500 ${isCollapsed && !isMobileOpen ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}>
            ES
          </span>
        </button>
      </div>

      {/* Logout */}
      <div className="border-t border-white/10">
        <button
          className="w-full flex items-center py-4 px-6 text-white transition-all duration-700 ease-in-out hover:bg-red-600 hover:pl-10 text-lg group"
          onClick={handleLogout}
        >
          <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
            <i className="fas fa-sign-out-alt text-white"></i>
          </span>
          <span className={`text-white text-lg transition-all duration-700 ease-in-out transform ${
            isCollapsed && !isMobileOpen ? "opacity-0 scale-75 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
          }`}>
            {t("sidebar.nav.logout")}
          </span>
        </button>
      </div>
    </div>
  );
};

const NavItem: FC<NavItemProps> = ({ icon, text, isCollapsed, to, onClick }) => (
  <li>
    <Link
      to={to}
      className="group flex items-center py-3 px-6 text-white no-underline transition-all duration-700 ease-in-out relative hover:bg-[#60A3D9] hover:pl-10 text-lg"
      onClick={onClick}
    >
      <span className="w-9 h-9 leading-9 text-center inline-block mr-4 rounded-sm text-lg">
        <i className={`fas ${icon} text-white`}></i>
      </span>
      <span className={`text-white text-lg transition-all duration-700 ease-in-out transform ${
        isCollapsed ? "opacity-0 scale-75 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
      }`}>
        {text}
      </span>
      <span className="absolute left-0 top-0 w-1 h-full bg-white transition-transform duration-700 ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top"></span>
    </Link>
  </li>
);

const DropdownLink: FC<{ icon: string; text: string; to: string; onClick?: () => void }> = ({ icon, text, to, onClick }) => (
  <li>
    <Link
      to={to}
      className="flex items-center py-3 px-6 pl-14 no-underline transition-all duration-300 ease-in-out hover:bg-[#051537] hover:pl-16 text-lg !text-white"
      onClick={onClick}
    >
      <span className="w-7 h-7 leading-7 text-center inline-block mr-3 rounded-sm text-lg">
        <i className={`fas ${icon} text-white`}></i>
      </span>
      <span>{text}</span>
    </Link>
  </li>
);

const MainContent: FC = () => (
  <div
    className="flex-1 overflow-auto h-full bg-cover bg-center bg-no-repeat relative"
    style={{ backgroundImage: `url(${backgroundImg})` }}
  >
    <div className="absolute inset-0 bg-white/10 pointer-events-none" />
    <div className="relative z-10 p-10 md:p-4">
      <Outlet />
    </div>
  </div>
);

export default Layout;