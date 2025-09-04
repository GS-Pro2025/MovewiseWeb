import ipad from "../assets/ipad.png";
import mobile from "../assets/iPhone1.png";
import mobileHorizontal from "../assets/HorizontaliPhone.png";

const Benefits = () => {
  type MockupType = "dashboard" | "mobile" | "tablet";

  interface Benefit {
    id: number;
    title: string;
    description: string;
    buttonText: string;
    imagePosition: "left" | "right";
    mockupType: MockupType;
  }

  const benefits: Benefit[] = [
    {
      id: 1,
      title: "Full Operations Control",
      description: "Manage your team, routes, and tasks from a single app.",
      buttonText: "Start now",
      imagePosition: "right",
      mockupType: "tablet",
    },
    {
      id: 2,
      title: "Clear Financial Control",
      description:
        "Record payments, manage payroll, and get automatic reports on income, expenses, and profits.",
      buttonText: "Start now",
      imagePosition: "left",
      mockupType: "mobile",
    },
    {
      id: 3,
      title: "Always Organized Team",
      description:
        "Each worker has their own account to register shifts, check-ins, and check-outs, ensuring traceability and order.",
      buttonText: "Start now",
      imagePosition: "right",
      mockupType: "dashboard",
    },
  ];

  const DashboardMockup = () => (
    <div className="shadow-2xl">
      <div className="relative">
        <img
          src={mobileHorizontal}
          alt="Dashboard horizontal"
          className="w-full max-w-lg mx-auto"
        />
      </div>
    </div>
  );

  const MobileMockup = () => (
    <div className="bg-white px-30 shadow-2xl">
      <div className="flex justify-center items-center space-x-8">
        <img
          src={mobile}
          alt="iPhone mockup"
          className="w-full max-w-lg mx-auto"
        />
      </div>
    </div>
  );

  const TabletMockup = () => (
    <div className="shadow-2xl">
      <div className="flex justify-center">
        <img
          src={ipad}
          alt="iPad mockup"
          className="w-full max-w-lg mx-auto"
        />
      </div>
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
    <section className="bg-orange-100 py-32">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Title */}
        <h2 className="text-5xl font-bold text-blue-900 text-center mb-32">
          Benefits the MovingWise
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
                  {benefit.title}
                </h3>
                <p className="text-gray-700 text-xl leading-relaxed">
                  {benefit.description}
                </p>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
                  {benefit.buttonText}
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
