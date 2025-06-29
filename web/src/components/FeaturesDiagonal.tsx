import { motion } from "framer-motion";

// @ts-ignore
import featTwitch from "../assets/images/feat_twitch.png";

export const FeaturesDiagonal = () => {
    return (
        <section
            className="lg:mb-16 w-full flex flex-col justify-center items-center bg-[#6530b2]"
            id="twitch"
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
                        className="bg-[#6530b2]  fill-[#6530b2]"
                    ></path>
                </svg>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className=" 2xl:w-[1150px] xl:w-[1050px]  md:w-4/5 flex justify-center bg-[#6530b2] pt-12 lg:pt-24 pb-8 lg:pb-20 mx-auto flex-col">
                    <div className="w-3/4 lg:w-1/2 flex flex-col lg:mx-unset mx-auto">
                        <span className="block-subtitle">Twitch</span>
                        <h2 className="mt-10 mb-8 text-4xl lg:text-5xl block-big-title">
                            Stream on Twitch?
                        </h2>
                        <p className="mb-16 text-secondaryText leading-loose">
                            Feedr makes it easy to know when your stream goes
                            live! Go live, and with our update interval of 2
                            seconds, you can be sure that your fans will get
                            notifications instantly!
                        </p>
                        {/* <button
                            className="w-[210px] h-12 contained-button mr-10 "
                            onClick={() => setIsModalOpen(true)} // TODO: Add the invite link for the bot
                            aria-label="Get started"
                        >
                            Get Started
                        </button> */}
                    </div>
                    <div className="w-4/5 lg:w-1/2 lg:pl-16 flex justify-center mx-auto pt-16 lg:pt-0">
                        <img
                            src={featTwitch.src}
                            alt="Feature image"
                            className="rounded-xl  main-border-gray"
                        />
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
                        className="bg-[#6530b2] fill-[#6530b2]"
                    ></path>
                </svg>
            </div>
        </section>
    );
};
