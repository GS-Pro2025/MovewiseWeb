import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import textoMW from "../assets/textoMWb.png";
import textoMWScroll from "../assets/textoMW.png";
import { useTranslation } from "react-i18next";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const languages = [
    {
      code: "en",
      label: "English",
      flag: "https://flagcdn.com/us.svg",
    },
    {
      code: "es",
      label: "Español",
      flag: "https://flagcdn.com/es.svg",
    },
  ];

  const currentLang = languages.find(
    (lang) => lang.code === i18n.language
  );

  const changeLanguage = (code: string) => {
    void i18n.changeLanguage(code);
    setLangOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#ffffff]/80 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">

          {/* Logo */}
          <a href="#home" onClick={() => scrollToSection("home")}>
            <img
              src={isScrolled ? textoMWScroll : textoMW}
              alt="MOVING WISE"
              className="h-12 sm:h-16 w-auto py-2 transition-all duration-300 hover:scale-110 cursor-pointer"
            />
          </a>

          {/* Links desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              onClick={() => scrollToSection("features")}
              className={`cursor-pointer transition-all duration-300 hover:text-[#FFE67B] ${
                isScrolled ? "text-[#0B2863]" : "text-white"
              }`}
            >
              {t("nav.features")}
            </a>

            <a
              href="#benefits"
              onClick={() => scrollToSection("benefits")}
              className={`cursor-pointer transition-all duration-300 hover:text-[#FFE67B] ${
                isScrolled ? "text-[#0B2863]" : "text-white"
              }`}
            >
              {t("nav.benefits")}
            </a>

            <a
              href="#plans"
              onClick={() => scrollToSection("plans")}
              className={`cursor-pointer transition-all duration-300 hover:text-[#FFE67B] ${
                isScrolled ? "text-[#0B2863]" : "text-white"
              }`}
            >
              {t("nav.plans")}
            </a>

            <a
              href="#contact"
              onClick={() => scrollToSection("contact")}
              className="cursor-pointer text-[#0B2863] bg-[#FFE67B] px-6 py-2 rounded-full font-semibold hover:bg-[#FFE67BCC]"
            >
              {t("nav.contact")}
            </a>
          </div>

          {/* Login/Register */}
          <div className="hidden md:flex ml-auto">
            <RouterLink
              to="/login"
              className="bg-[#FFE67B] text-[#0B2863] px-6 py-2 rounded-full font-semibold hover:bg-[#FFE67BCC] transition inline-block"
            >
              {t("nav.loginRegister")}
            </RouterLink>
          </div>

          {/* Language Desktop */}
          <div className="hidden md:flex items-center ml-4 relative">
            <label
              className={`mr-2 text-sm ${
                isScrolled ? "text-[#0B2863]" : "text-white"
              }`}
            >
              {t("nav.language")}
            </label>

            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm bg-white/90 text-[#0B2863] border border-white/60 hover:shadow-md transition"
              >
                <img
                  src={currentLang?.flag}
                  alt={currentLang?.label}
                  className="w-4 h-4 rounded-sm object-cover"
                />
                {currentLang?.code.toUpperCase()}
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition ${
                        i18n.language === lang.code
                          ? "bg-gray-100 font-medium"
                          : ""
                      }`}
                    >
                      <img
                        src={lang.flag}
                        alt={lang.label}
                        className="w-4 h-4 rounded-sm object-cover"
                      />
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botón menú móvil */}
          <div className="md:hidden ml-auto">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="focus:outline-none"
            >
              <svg
                className="w-8 h-8 text-blue-950"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-md shadow-lg">
          <div className="flex flex-col items-center space-y-4 py-4">

            <a href="#features" onClick={() => scrollToSection("features")}>
              {t("nav.features")}
            </a>

            <a href="#benefits" onClick={() => scrollToSection("benefits")}>
              {t("nav.benefits")}
            </a>

            <a href="#plans" onClick={() => scrollToSection("plans")}>
              {t("nav.plans")}
            </a>

            <a
              href="#contact"
              onClick={() => scrollToSection("contact")}
              className="bg-[#FFE67B] px-6 py-2 rounded-full font-semibold"
            >
              {t("nav.contact")}
            </a>

            <RouterLink
              to="/login"
              onClick={() => setIsOpen(false)}
              className="bg-blue-950 text-white px-6 py-2 rounded-full font-semibold"
            >
              {t("nav.loginRegister")}
            </RouterLink>

            {/* Language Mobile */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm bg-white text-blue-950 border border-blue-950/20"
              >
                <img
                  src={currentLang?.flag}
                  alt={currentLang?.label}
                  className="w-4 h-4 rounded-sm object-cover"
                />
                {currentLang?.code.toUpperCase()}
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      <img
                        src={lang.flag}
                        alt={lang.label}
                        className="w-4 h-4 rounded-sm object-cover"
                      />
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
