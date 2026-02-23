import React from "react";
import { useTranslation } from "react-i18next";
import textoMW from "../assets/textoMW.png";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#F09F52] text-center py-8 px-4">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <div className="bg-white px-4 py-2 rounded-lg shadow-md">
          <img
            src={textoMW}
            alt={t("footer.logoAlt")}
            className="h-34 sm:h-24 w-auto py-2"
          />
        </div>
      </div>

      {/* Descriptive text */}
      <p className="text-black max-w-5xl mx-auto mb-4 text-2xl">
        {t("footer.description")}
      </p>

      {/* Reserved rights */}
      <p className="text-gray-100 font-semibold text-lg">
        {t("footer.rights")}
      </p>
    </footer>
  );
};

export default Footer;