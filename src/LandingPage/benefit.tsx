import { useTranslation } from "react-i18next";
import ipad from "../assets/ipad.png";
import mobile from "../assets/iPhone1.png";
import mobileHorizontal from "../assets/HorizontaliPhone.png";

const Benefits = () => {
  const { t } = useTranslation();

  type MockupType = "dashboard" | "mobile" | "tablet";

  interface Benefit {
    id: number;
    titleKey: string;
    descriptionKey: string;
    imagePosition: "left" | "right";
    mockupType: MockupType;
  }

  const benefits: Benefit[] = [
    {
      id: 1,
      titleKey: "benefits.items.operations.title",
      descriptionKey: "benefits.items.operations.description",
      imagePosition: "right",
      mockupType: "tablet",
    },
    {
      id: 2,
      titleKey: "benefits.items.financial.title",
      descriptionKey: "benefits.items.financial.description",
      imagePosition: "left",
      mockupType: "mobile",
    },
    {
      id: 3,
      titleKey: "benefits.items.team.title",
      descriptionKey: "benefits.items.team.description",
      imagePosition: "right",
      mockupType: "dashboard",
    },
  ];

  const DashboardMockup = () => (
    <div className="relative">
      <img
        src={mobileHorizontal}
        alt="Dashboard horizontal"
        className="w-full min-w-2xl mx-auto drop-shadow-2xl"
      />
    </div>
  );

  const MobileMockup = () => (
    <div className="flex justify-center items-center space-x-8">
      <img
        src={mobile}
        alt="iPhone mockup"
        className="w-full min-w-2xl mx-auto drop-shadow-2xl"
      />
    </div>
  );

  const TabletMockup = () => (
    <div className="flex justify-center">
      <img
        src={ipad}
        alt="iPad mockup"
        className="w-full min-w-2xl mx-auto drop-shadow-2xl"
      />
    </div>
  );

  const renderMockup = (type: MockupType) => {
    switch (type) {
      case "dashboard":
        return <DashboardMockup />;
      case "mobile":
        return <MobileMockup />;
      case "tablet":
        return <TabletMockup />;
      default:
        return <DashboardMockup />;
    }
  };

  return (
    <section className="bg-[#F09F52] py-32">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Title */}
        <h2 className="text-5xl font-bold text-blue-900 text-center mb-32">
          {t("benefits.sectionTitle")}
        </h2>

        {/* Benefits List */}
        <div className="space-y-40">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className={`flex flex-col lg:flex-row items-center gap-20 ${
                benefit.imagePosition === "left" ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Text Content */}
              <div className="flex-1 space-y-8">
                <h3 className="text-4xl font-bold text-blue-900 leading-tight">
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-gray-700 text-xl leading-relaxed">
                  {t(benefit.descriptionKey)}
                </p>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
                  {t("benefits.startNow")}
                </button>
              </div>

              {/* Mockup */}
              <div className="flex-1 flex justify-center">
                <div className="transform hover:scale-105 transition-transform duration-300">
                  {renderMockup(benefit.mockupType)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;