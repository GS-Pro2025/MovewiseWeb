import React from "react";
import Onda from "../assets/Rectanglebajo.svg";
import { Users, BarChart3, Wifi } from "lucide-react";

const Features: React.FC = () => {
  const features = [
    {
      icon: <Users size={40} className="text-white" />,
      title: "Easy Staff Assignment",
      description: "Assign staff and coordinate every move without complications.",
    },
    {
      icon: <BarChart3 size={40} className="text-white" />,
      title: "Reports & Total Control",
      description: "Generate clear reports of income, expenses and profits.",
    },
    {
      icon: <Wifi size={40} className="text-white" />,
      title: "Real-time Visibility",
      description: "Moving status and worker check-in/out tracking.",
    },
  ];

  return (
    <section className="relative py-20">
      {/* Background wave */}
      <div className="absolute top-0 left-0 w-full">
        <img src={Onda} alt="Decorative wave" className="w-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 lg:px-12 text-center">
        {/* Title */}
        <h2 className="text-5xl font-extrabold text-[#F09F52] mt-20">
          Features
        </h2>
        <p className="text-[#F09F52] text-2xl max-w-3xl mx-auto mb-20">
          The{" "}
          <span className="text-orange-500 font-semibold">all-in-one</span>{" "}
          tool for your moving company to work without chaos or confusion.
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
                {feature.title}
              </h3>
              <p className="text-gray-600 text-xl">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;