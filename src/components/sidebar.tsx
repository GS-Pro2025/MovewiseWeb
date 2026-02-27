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
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
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
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-[10000] w-9 h-9 bg-[#0B2863] text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-[#0B2863]/90 transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={t("sidebar.toggleMenu")}
      >
        <i className={`fas ${isMobileOpen ? "fa-times" : "fa-bars"}`}></i>
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

  const collapsed = isCollapsed && !isMobileOpen;

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const handleLogout = () => {
    Cookies.remove("authToken");
    window.location.href = "/";
  };

  // ── Shared class builders ──────────────────────────────────────────────────
  const dropdownWrapClass = (index: number) =>
    `relative transition-all duration-700 ease-in-out ${
      activeDropdown === index && !isCollapsed ? "bg-[#6c63ff]" : ""
    }`;

  const chevronClass = (index: number) =>
    `fas text-base transition-all duration-700 ease-in-out transform ${
      collapsed ? "opacity-0 scale-75 w-0" : "opacity-100 scale-100 w-auto"
    } ${activeDropdown === index ? "fa-chevron-down rotate-180" : "fa-chevron-right rotate-0"} text-white`;

  const dropdownPanelClass = (index: number) =>
    `overflow-hidden transition-all duration-700 ease-in-out ${
      !collapsed && activeDropdown === index ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
    }`;

  const labelClass = `text-white text-sm transition-all duration-700 ease-in-out transform ${
    collapsed ? "opacity-0 scale-75 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
  }`;

  // ── Dropdown button shared template ───────────────────────────────────────
  const DropdownButton: FC<{
    index: number;
    icon: string;
    label: string;
  }> = ({ index, icon, label }) => (
    <button
      className="w-full flex items-center justify-between py-2 px-5 text-white transition-all duration-700 ease-in-out relative hover:bg-[#575b8a] hover:pl-8 group"
      onClick={() => toggleDropdown(index)}
      disabled={collapsed}
    >
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 leading-7 text-center inline-block rounded-sm text-base flex-shrink-0">
          <i className={`fas ${icon}`}></i>
        </span>
        <span className={labelClass}>{label}</span>
      </div>
      <i className={chevronClass(index)}></i>
      <span className="absolute left-0 top-0 w-1 h-full bg-[#6c63ff] transition-transform duration-700 ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top" />
    </button>
  );

  return (
    <div
      className={`
        fixed md:relative transition-all duration-300 ease-in-out shadow-lg bg-gradient-to-br from-[#0B2863] to-[#051537]
        ${collapsed ? "w-[68px]" : "w-52"}
        h-screen flex flex-col overflow-hidden
        ${isMobileOpen ? "left-0 z-[9998]" : "-left-full md:left-0"}
      `}
    >
      {/* ── Logo area ── */}
      <div className="px-3 py-3 flex flex-col items-center relative flex-shrink-0">
        <button
          className="md:hidden absolute right-3 top-3 w-7 h-7 text-white/70 hover:text-white transition-colors"
          onClick={closeMobileMenu}
          aria-label={t("sidebar.closeMobileMenu")}
        >
          <i className="fas fa-times"></i>
        </button>

        <div className="flex justify-center w-full mb-2">
          <img
            src={Logo}
            alt={t("sidebar.logoAlt")}
            className={`object-contain rounded-lg bg-white transition-all duration-700 ease-in-out transform ${
              collapsed ? "h-9 w-9 scale-90" : "h-16 w-16 scale-100"
            }`}
          />
        </div>

        <div
          className={`flex justify-center w-full transition-all duration-700 ease-in-out transform ${
            collapsed ? "opacity-0 scale-75 h-0 overflow-hidden" : "opacity-100 scale-100 h-auto"
          }`}
        >
          <img src={LogoText} alt={t("sidebar.logoTextAlt")} className="h-10 object-contain" />
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          className="hidden md:flex w-6 h-6 bg-[#F09F52] text-white rounded-full justify-center items-center cursor-pointer
                     transition-all duration-700 ease-in-out absolute -right-1 top-4/5 -translate-y-1/2 hover:scale-110
                     shadow-lg hover:shadow-xl text-xs z-10"
          onClick={toggleSidebar}
          aria-label={t("sidebar.toggleSidebar")}
        >
          <i className={`fas transition-transform duration-700 ease-in-out ${isCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`}></i>
        </button>
      </div>

      {/* ── Scrollable nav ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0">

        {/* User info */}
        <div
          className={`px-3 flex flex-col items-center transition-all duration-700 ease-in-out transform ${
            collapsed ? "opacity-0 scale-75 h-0 overflow-hidden mb-0" : "opacity-100 scale-100 h-auto mb-3"
          }`}
        >
          {user && (
            <>
              <Link
                to="/app/profile"
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white mb-2 shadow-lg hover:border-[#F09F52] block transition-all duration-300"
                onClick={closeMobileMenu}
              >
                <img
                  src={
                    user.photo?.trim()
                      ? user.photo
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.person.first_name} ${user.person.last_name}`)}&background=0B2863&color=fff&size=128`
                  }
                  alt={t("sidebar.userAvatarAlt")}
                  className="w-full h-full object-cover"
                />
              </Link>
              <Link to="/app/profile" className="text-center hover:text-[#F09F52] transition-colors block" onClick={closeMobileMenu}>
                <div className="text-white text-xs font-semibold">
                  {user.person.first_name} {user.person.last_name}
                </div>
                <div className="text-white text-xs opacity-70 truncate max-w-[160px] mt-0.5">
                  {user.person.email}
                </div>
              </Link>
            </>
          )}
        </div>

        {/* ── Nav list ── */}
        <ul className="list-none p-0 m-0 flex flex-col pb-2">

          <NavItem icon="fa-home"                text={t("sidebar.nav.dashboard")}       isCollapsed={collapsed} to="/app/dashboard"        onClick={closeMobileMenu} />
          <NavItem icon="fa-solid fa-box"        text={t("sidebar.nav.createDaily")}     isCollapsed={collapsed} to="/app/create-daily"     onClick={closeMobileMenu} />
          <NavItem icon="fa-solid fa-money-bill" text={t("sidebar.nav.payroll")}         isCollapsed={collapsed} to="/app/payroll"           onClick={closeMobileMenu} />
          <NavItem icon="fa-warehouse"           text={t("sidebar.nav.createWarehouse")} isCollapsed={collapsed} to="/app/create-warehouse"  onClick={closeMobileMenu} />
          {user?.is_superUser && (
            <NavItem icon="fa-file-invoice-dollar" text={t("sidebar.nav.statements")}   isCollapsed={collapsed} to="/app/statements"        onClick={closeMobileMenu} />
          )}
          {user?.is_superUser && (
            <NavItem icon="fa-chart-bar"         text={t("sidebar.nav.statistics")}      isCollapsed={collapsed} to="/app/statistics"       onClick={closeMobileMenu} />
          )}

          {/* ── Cost dropdown (index 1) ── */}
          <li className={dropdownWrapClass(1)}>
            <DropdownButton index={1} icon="fa-coins" label={t("sidebar.nav.cost")} />
            <div className={dropdownPanelClass(1)}>
              <ul className="list-none p-0 m-0 bg-[#0B2863]">
                <DropdownLink icon="fa-calculator"       text={t("sidebar.nav.summaryCosts")} to="/app/summary-cost"   onClick={closeMobileMenu} />
                <DropdownLink icon="fa-gas-pump"         text={t("sidebar.nav.resumeFuel")}   to="/app/resume-fuel"    onClick={closeMobileMenu} />
                <DropdownLink icon="fa-dollar-sign"      text={t("sidebar.nav.extraCost")}    to="/app/extra-cost"     onClick={closeMobileMenu} />
              </ul>
            </div>
          </li>

          {/* ── Finance dropdown (index 2) ── */}
          {user?.is_superUser && (
            <li className={dropdownWrapClass(2)}>
              <DropdownButton index={2} icon="fa-chart-pie" label={t("sidebar.nav.finance")} />
              <div className={dropdownPanelClass(2)}>
                <ul className="list-none p-0 m-0 bg-[#0B2863]">
                  <DropdownLink icon="fa-coins"               text={t("sidebar.nav.financials")}       to="/app/financials"       onClick={closeMobileMenu} />
                  <DropdownLink icon="fa-file-invoice-dollar" text={t("sidebar.nav.expenseBreakdown")} to="/app/expense-breakdown" onClick={closeMobileMenu} />
                  <DropdownLink icon="fa-hand-holding-usd"    text={t("sidebar.nav.operatorLoans")}    to="/app/operator-loans"   onClick={closeMobileMenu} />
                </ul>
              </div>
            </li>
          )}

          {/* ── Settings dropdown (index 0) ── */}
          <li className={dropdownWrapClass(0)}>
            <DropdownButton index={0} icon="fa-cogs" label={t("sidebar.nav.settings")} />
            <div className={dropdownPanelClass(0)}>
              {/* max-h-[600px] ensures all items are visible regardless of count */}
              <ul className="list-none p-0 m-0 bg-[#0B2863]">
                <DropdownLink icon="fa-user"      text={t("sidebar.nav.myProfile")}  to="/app/profile"    onClick={closeMobileMenu} />
                <DropdownLink icon="fa-building"  text={t("sidebar.nav.customers")}  to="/app/customers"  onClick={closeMobileMenu} />
                <DropdownLink icon="fa-briefcase" text={t("sidebar.nav.jobsTools")}  to="/app/jobs-tools" onClick={closeMobileMenu} />
                <DropdownLink icon="fa-truck"     text={t("sidebar.nav.trucks")}     to="/app/trucks"     onClick={closeMobileMenu} />
                <DropdownLink icon="fa-users"     text={t("sidebar.nav.operators")}  to="/app/operators"  onClick={closeMobileMenu} />
                {user?.is_superUser && (
                  <DropdownLink icon="fa-users-cog" text={t("sidebar.nav.admins")}    to="/app/admins"     onClick={closeMobileMenu} />
                )}
                {user?.is_superUser && (
                  <DropdownLink icon="fa-city"      text={t("sidebar.nav.myCompany")} to="/app/my-company" onClick={closeMobileMenu} />
                )}
              </ul>
            </div>
          </li>

        </ul>
      </div>

      {/* ── Language switcher ── */}
      <div
        className={`border-t border-white/10 px-3 py-2 flex items-center gap-2 transition-all duration-500 ${
          collapsed ? "justify-center flex-col gap-1" : "justify-start"
        }`}
      >
        {(["en", "es"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => i18n.changeLanguage(lang)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${
              i18n.language === lang
                ? "bg-white/20 text-white ring-1 ring-white/40"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
            aria-label={lang === "en" ? "English" : "Español"}
          >
            <img
              src={lang === "en" ? "https://flagcdn.com/us.svg" : "https://flagcdn.com/es.svg"}
              alt={lang}
              className="w-4 h-4 rounded-sm object-cover"
            />
            <span className={`transition-all duration-500 uppercase ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}>
              {lang}
            </span>
          </button>
        ))}
      </div>

      {/* ── Logout ── */}
      <div className="border-t border-white/10 flex-shrink-0">
        <button
          className="w-full flex items-center py-3 px-5 text-white transition-all duration-700 ease-in-out hover:bg-red-600 hover:pl-8 group"
          onClick={handleLogout}
        >
          <span className="w-7 h-7 leading-7 text-center inline-block mr-3 rounded-sm text-base flex-shrink-0">
            <i className="fas fa-sign-out-alt"></i>
          </span>
          <span className={`text-sm transition-all duration-700 ease-in-out transform ${
            collapsed ? "opacity-0 scale-75 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
          }`}>
            {t("sidebar.nav.logout")}
          </span>
        </button>
      </div>
    </div>
  );
};

// ─── NavItem ───────────────────────────────────────────────────────────────────
const NavItem: FC<NavItemProps> = ({ icon, text, isCollapsed, to, onClick }) => (
  <li>
    <Link
      to={to}
      className="group flex items-center py-2 px-5 text-white no-underline transition-all duration-700 ease-in-out relative hover:bg-[#60A3D9] hover:pl-8"
      onClick={onClick}
    >
      <span className="w-7 h-7 leading-7 text-center inline-block mr-3 rounded-sm text-base flex-shrink-0">
        <i className={`fas ${icon}`}></i>
      </span>
      <span className={`text-sm transition-all duration-700 ease-in-out transform ${
        isCollapsed ? "opacity-0 scale-75 w-0 overflow-hidden" : "opacity-100 scale-100 w-auto"
      }`}>
        {text}
      </span>
      <span className="absolute left-0 top-0 w-1 h-full bg-white transition-transform duration-700 ease-in-out origin-bottom scale-y-0 group-hover:scale-y-100 group-hover:origin-top" />
    </Link>
  </li>
);

// ─── DropdownLink ──────────────────────────────────────────────────────────────
const DropdownLink: FC<{ icon: string; text: string; to: string; onClick?: () => void }> = ({
  icon, text, to, onClick
}) => (
  <li>
    <Link
      to={to}
      className="flex items-center py-2 px-5 pl-12 no-underline transition-all duration-300 ease-in-out hover:bg-[#051537] hover:pl-14 !text-white"
      onClick={onClick}
    >
      <span className="w-6 h-6 leading-6 text-center inline-block mr-2.5 rounded-sm text-sm flex-shrink-0">
        <i className={`fas ${icon}`}></i>
      </span>
      <span className="text-sm">{text}</span>
    </Link>
  </li>
);

// ─── MainContent ───────────────────────────────────────────────────────────────
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