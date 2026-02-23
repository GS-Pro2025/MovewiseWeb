import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Box from "../assets/Caja.png";
import BoxStack from "../assets/CajasMonton.png";
import BoxPile from "../assets/cajasPila.png";

const PricingPlans = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const plans = [
    {
      number_id: 1,
      id: "trial",
      price: "$0.00",
      isPopular: false,
    },
    {
      number_id: 2,
      id: "monthly",
      price: "$19.99",
      pricePerMonth: "$19.99",
      discount: "0%",
      savings: "$0.00",
    },
    {
      number_id: 3,
      id: "quarterly",
      price: "$56.97",
      pricePerMonth: "$18.99",
      discount: "5%",
      savings: "$2.99",
    },
    {
      number_id: 4,
      id: "semiannual",
      price: "$107.95",
      pricePerMonth: "$17.99",
      discount: "10%",
      savings: "$11.99",
    },
    {
      number_id: 5,
      id: "annual",
      price: "$191.91",
      pricePerMonth: "$15.99",
      discount: "20%",
      savings: "$47.97",
      isPopular: true,
    },
  ];

  const handlePlanSelect = (planIndex: number) => {
    const selectedPlan = plans[planIndex];
    const selectedPlanNumber = planIndex + 1;

    window.localStorage.setItem("selectedPlanId", String(selectedPlanNumber));
    window.localStorage.setItem(
      "selectedPlanName",
      t(`plans.${selectedPlan.id}.name`)
    );
    window.localStorage.setItem("selectedPlanPrice", selectedPlan.price);

    console.log("Plan seleccionado:", selectedPlanNumber);
    navigate("/login?mode=register");
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">
            {t("plans.title")}
          </h2>
          <p className="text-gray-600 text-lg">{t("plans.subtitle")}</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-12">
          {plans.map((plan, idx) => {
            const features = t(`plans.${plan.id}.features`, {
              returnObjects: true,
            }) as string[];
            const badge = t(`plans.${plan.id}.badge`, { defaultValue: "" });

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl shadow-lg border w-full h-full flex flex-col justify-between transition-all duration-300 hover:shadow-xl
                  bg-white/30 backdrop-blur-lg border-white/20
                  ${plan.isPopular ? "border-orange-400 scale-105" : ""}
                `}
              >
                {/* Popular Badge */}
                {badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                      {badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  {/* Plan Name */}
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    {t(`plans.${plan.id}.name`)}
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-orange-500">
                        {plan.price}
                      </span>
                      <span className="text-gray-700 ml-1 text-sm">
                        {t(`plans.${plan.id}.subtitle`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {t("plans.duration")}: {t(`plans.${plan.id}.duration`)}
                    </p>
                  </div>

                  {/* Price Details */}
                  {plan.pricePerMonth && (
                    <div className="mb-6 text-sm text-gray-700">
                      <p>
                        {t("plans.effectivePrice")}:{" "}
                        <span className="font-semibold">
                          {plan.pricePerMonth}
                        </span>
                      </p>
                      <p>
                        {t("plans.discount")}:{" "}
                        <span className="text-green-600 font-semibold">
                          {plan.discount}
                        </span>
                      </p>
                      <p>
                        {t("plans.savings")}:{" "}
                        <span className="text-green-600 font-semibold">
                          {plan.savings}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <div className="mb-8 flex-grow">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      {t("plans.featuresTitle")}:
                    </h4>
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
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
                    onClick={() => handlePlanSelect(idx)}
                  >
                    {t(`plans.${plan.id}.buttonText`)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative Boxes */}
      <img
        src={Box}
        alt={t("plans.boxAlt")}
        className="absolute bottom-10 left-10 w-100 h-auto"
      />
      <img
        src={BoxStack}
        alt={t("plans.boxStackAlt")}
        className="absolute top-20 right-20 w-100 h-auto"
      />
      <img
        src={BoxPile}
        alt={t("plans.boxPileAlt")}
        className="absolute bottom-0 right-1/4 w-100 h-auto"
      />
    </section>
  );
};

export default PricingPlans;