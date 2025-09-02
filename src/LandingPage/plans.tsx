import Box from "../assets/Caja.png";
import BoxStack from "../assets/CajasMonton.png";
import BoxPile from "../assets/cajasPila.png";

const PricingPlans = () => {
  const plans = [
    {
      id: "trial",
      name: "TRIAL PLAN",
      price: "$0.00",
      duration: "1 month",
      subtitle: "(FREE)",
      features: [
        "Full access for 30 days",
        "All features included",
        "Basic technical support",
        "No commitments",
      ],
      buttonText: "Start Free Trial",
    },
    {
      id: "monthly",
      name: "MONTHLY PLAN",
      price: "$19.99",
      duration: "1 month auto-renewal",
      subtitle: "per month",
      pricePerMonth: "$19.99",
      discount: "0%",
      savings: "$0.00",
      features: [
        "Full access to the platform",
        "Technical support included",
        "Automatic updates",
        "Cancel anytime",
      ],
      buttonText: "Start Subscription",
    },
    {
      id: "quarterly",
      name: "QUARTERLY PLAN",
      price: "$56.97",
      duration: "3 months",
      subtitle: "every 3 months",
      pricePerMonth: "$18.99",
      discount: "5%",
      savings: "$2.99 per quarter",
      features: [
        "Everything in Monthly Plan",
        "Guaranteed 5% discount",
        "Priority support",
        "Quarterly billing",
      ],
      buttonText: "Start Subscription",
    },
    {
      id: "semiannual",
      name: "SEMI-ANNUAL PLAN",
      price: "$107.95",
      duration: "6 months",
      subtitle: "every 6 months",
      pricePerMonth: "$17.99",
      discount: "10%",
      savings: "$11.99 per semester",
      features: [
        "Everything in Quarterly Plan",
        "Guaranteed 10% discount",
        "Premium technical support",
      ],
      buttonText: "Start Subscription",
    },
    {
      id: "annual",
      name: "ANNUAL PLAN",
      price: "$191.91",
      duration: "12 months",
      subtitle: "per year",
      badge: "BEST VALUE",
      pricePerMonth: "$15.99",
      discount: "20%",
      savings: "$47.97 per year",
      isPopular: true,
      features: [
        "Everything in Semi-Annual Plan",
        "Maximum 20% discount",
        "Dedicated 24/7 support",
        "Personalized consulting",
      ],
      buttonText: "Start Subscription",
    },
  ];

  return (
    <section className="relative bg-[#EEF4FF] py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">
            Plans & Subscriptions
          </h2>
          <p className="text-gray-600 text-lg">
            Choose the plan that fits your needs
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl shadow-lg border w-full h-full flex flex-col justify-between transition-all duration-300 hover:shadow-xl
                bg-white/30 backdrop-blur-lg border-white/20
                ${plan.isPopular ? "border-orange-400 scale-105" : ""}
              `}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-6 flex flex-col flex-grow">
                {/* Plan Name */}
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-orange-500">
                      {plan.price}
                    </span>
                    {plan.subtitle && (
                      <span className="text-gray-700 ml-1 text-sm">
                        {plan.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    Duration: {plan.duration}
                  </p>
                </div>

                {/* Price Details */}
                {plan.pricePerMonth && (
                  <div className="mb-6 text-sm text-gray-700">
                    <p>
                      Effective price per month:{" "}
                      <span className="font-semibold">
                        {plan.pricePerMonth}
                      </span>
                    </p>
                    <p>
                      Discount:{" "}
                      <span className="text-green-600 font-semibold">
                        {plan.discount}
                      </span>
                    </p>
                    <p>
                      Savings:{" "}
                      <span className="text-green-600 font-semibold">
                        {plan.savings}
                      </span>
                    </p>
                  </div>
                )}

                {/* Features */}
                <div className="mb-8 flex-grow">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Features:
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 mt-auto ${
                    plan.isPopular
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-orange-400 hover:bg-orange-500 text-white"
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Boxes */}
      <img
        src={Box}
        alt="decorative box"
        className="absolute bottom-10 left-10 w-100 h-auto opacity-70"
      />
      <img
        src={BoxStack}
        alt="decorative box stack"
        className="absolute top-20 right-20 w-100 h-auto opacity-70"
      />
      <img
        src={BoxPile}
        alt="decorative box pile"
        className="absolute bottom-0 right-1/4 w-100 h-auto opacity-60"
      />
    </section>
  );
};

export default PricingPlans;
