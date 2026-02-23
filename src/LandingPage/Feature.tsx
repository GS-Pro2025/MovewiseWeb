import React from "react";
import { useTranslation } from "react-i18next";
import Onda from "../assets/Rectanglebajo.svg";
import { Users, BarChart3, Wifi } from "lucide-react";

const Features: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Users size={40} className="text-white" />,
      titleKey: "features.items.staff.title",
      descriptionKey: "features.items.staff.description",
    },
    {
      icon: <BarChart3 size={40} className="text-white" />,
      titleKey: "features.items.reports.title",
      descriptionKey: "features.items.reports.description",
    },
    {
      icon: <Wifi size={40} className="text-white" />,
      titleKey: "features.items.realtime.title",
      descriptionKey: "features.items.realtime.description",
    },
  ];

  return (
    <section className="relative py-20">
      {/* Background wave */}
      <div className="absolute top-0 left-0 w-full">
        <img src={Onda} alt={t("features.waveAlt")} className="w-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 lg:px-12 text-center">
        {/* Title */}
        <h2 className="text-5xl font-extrabold text-[#F09F52] mt-20">
          {t("features.title")}
        </h2>
        <p className="text-[#F09F52] text-2xl max-w-3xl mx-auto mb-20">
          {t("features.subtitle").split("all-in-one").length > 1 ? (
            <>
              {t("features.subtitle").split(
                t("features.subtitle").includes("all-in-one")
                  ? "all-in-one"
                  : "todo-en-uno"
              )[0]}
              <span className="text-orange-500 font-semibold">
                {t("features.subtitle").includes("all-in-one")
                  ? "all-in-one"
                  : "todo-en-uno"}
              </span>
              {t("features.subtitle").split(
                t("features.subtitle").includes("all-in-one")
                  ? "all-in-one"
                  : "todo-en-uno"
              )[1]}
            </>
          ) : (
            t("features.subtitle")
          )}
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mt-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white shadow-lg rounded-xs p-10 hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="flex items-center justify-center w-30 h-30 mx-auto mb-6 rounded-full bg-[#F09F52]">
                {feature.icon}
              </div>
              <h3 className="text-4xl font-bold text-blue-950 mb-3">
                {t(feature.titleKey)}
              </h3>
              <p className="text-gray-600 text-xl">{t(feature.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;