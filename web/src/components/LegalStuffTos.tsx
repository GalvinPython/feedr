import { motion } from "framer-motion";

export const LegalStuffTos = () => {
    return (
        <section
            className="lg:mb-16 w-full flex flex-col justify-center items-center bg-bgDark1"
            id="tos"
        >
            <div className="shape-divider-bottom-1665696614">
                <svg
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="bg-bgDark2  fill-bgDark2"
                >
                    <path
                        d="M1200 120L0 16.48 0 0 1200 0 1200 120z"
                        className="bg-bgDark1  fill-bgDark1"
                    ></path>
                </svg>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className=" 2xl:w-[1150px] xl:w-[1050px]  md:w-4/5 flex justify-center bg-bgDark1 pt-12 lg:pt-24 pb-8 lg:pb-20 mx-auto flex-col">
                    <div className="w-3/4 lg:w-1/2 flex flex-col lg:mx-unset mx-auto">
                        <span className="block-subtitle">Terms of Service</span>
                        <h2 className="mt-10 mb-8 text-4xl lg:text-5xl block-big-title">
                            Terms of Service
                        </h2>
                        <p className="text-secondaryText leading-loose">
                            When using this app you agree to the following:
                        </p>
                        <ul className="mb-16 text-secondaryText leading-loose list-disc list-inside">
                            <li>
                                You will not intentionally cause errors with the
                                bot, including DDoS attacks.
                            </li>
                            <li>
                                You will not misuse any bugs you find and you
                                will report them instead.
                            </li>
                            <li>
                                Any servers you use them in comply with the
                                Discord Terms of Service.
                            </li>
                        </ul>
                        <i className="text-secondaryText leading-loose">
                            Last updated 15th August 2024
                        </i>
                        <button
                            className="w-[210px] h-12 contained-button mr-10 "
                            onClick={() => window.open("/invite/bot", "_blank")}
                            aria-label="Get started"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </motion.div>
            <div className="shape-divider-top-1665696661 w-full">
                <svg
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="bg-bgDark2 fill-bgDark2"
                >
                    <path
                        d="M1200 120L0 16.48 0 0 1200 0 1200 120z"
                        className="bg-bgDark1 fill-bgDark1"
                    ></path>
                </svg>
            </div>
        </section>
    );
};
