import { useState } from "react";
import { motion } from "framer-motion";

const FAQData = [
    {
        question: "How often does Feedr check for new posts?",
        answer: "YouTube: 3 seconds, Twitch: 2 seconds",
    },
    {
        question: "Is Feedr free to use?",
        answer: "Yes, Feedr is free to use, and will be free forever with YouTube and Twitch support as they have free API platforms. However, other social media platforms that we wish to support in the future may are not so kind and may require a subscription; however this is not planned at the moment due to legal reasons.",
    },
    {
        question: "Which platforms does Feedr support?",
        answer: "Currently, Feedr supports YouTube and Twitch. We plan to add more platforms in the future based on user feedback.",
    },
    {
        question: "What platforms are planned for future support?",
        answer: "We can't guarantee any specific platforms at the moment, and are pending developer agreements and costs. Bluesky is one platform we are looking into, but nothing is confirmed yet",
    },
    {
        question: "Can I self-host Feedr?",
        answer: "Yes! Feedr is open-source and can be self-hosted. You can find the source code on our GitHub repository. Please note that self-hosting will require your own server and API keys.",
    },
    {
        question: "Where is Feedr hosted?",
        answer: "Feedr is hosted on cloud infrastructure to ensure reliability and scalability. However, we are hosted in the EU and comply with GDPR regulations.",
    },
    {
        question: "How can I provide feedback or report issues?",
        answer: "You can provide feedback or report issues by visiting our GitHub repository and opening an issue. Feedr's Discord support is handled through our sister project, socialstats.app. Email support is not available at this time.",
    },
];

export const FAQ = () => (
    <section className="relative -mt-8 sm:mt-0 pt-12 sm:pt-16 pb-16 bg-blueGray-50 overflow-hidden">
        <div className="absolute -top-10" id="FAQ" />
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <div className="relative z-10 container px-2 sm:px-8 lg:px-4 mx-auto w-11/12 sm:w-full">
                <div className="md:max-w-4xl mx-auto">
                    <p className="mb-7 block-subtitle text-center">
                        Have any questions?
                    </p>
                    <h2 className="mb-16 block-big-title text-center">
                        Frequently Asked Questions
                    </h2>
                    <div className="mb-11 flex flex-wrap -m-1">
                        {FAQData.map((item, index) => (
                            <div
                                className="w-full p-1"
                                key={`${item.question}-${index}`}
                            >
                                <FAQBox
                                    title={item.question}
                                    content={item.answer}
                                    key={`${item.question}-${item.answer}`}
                                    defaultOpen={index === 0}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    </section>
);

const FAQBox = ({ defaultOpen, title, content }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div
            className="pt-2 sm:pt-6 pb-2 px-3 sm:px-8  rounded-3xl bg-bgDark3 main-border-gray-darker mb-4 relative hover:bg-bgDark3Hover cursor-pointer transition"
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="flex flex-col p-2  justify-center items-start">
                <h3 className=" content-title pt-3 sm:pt-0 pr-8 sm:pr-0">
                    {title}
                </h3>
                <p
                    className={`text-secondaryText pt-4 transition-height duration-300 overflow-hidden ${isOpen ? "max-h-96" : "max-h-0"
                        }`}
                >
                    {content}
                </p>
            </div>
            <div className="absolute top-6 right-4 sm:top-8 sm:right-8">
                <svg
                    width="28px"
                    height="30px"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-all duration-500  ${isOpen ? "rotate-[180deg]" : "rotate-[90deg]"
                        }`}
                >
                    <path
                        d="M4.16732 12.5L10.0007 6.66667L15.834 12.5"
                        stroke="#4F46E5"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    ></path>
                </svg>
            </div>
        </div>
    );
};
