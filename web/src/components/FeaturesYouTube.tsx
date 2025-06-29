import { motion } from "framer-motion";

// @ts-ignore
import featYoutube from "../assets/images/feat_youtube.png";

export const FeaturesYouTube = () => {
    return (
        <section
            className="lg:mb-16 w-full flex flex-col justify-center items-center bg-[#650013]"
            id="youtube"
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
                        className="bg-[#650013]  fill-[#650013]"
                    ></path>
                </svg>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className=" 2xl:w-[1150px] xl:w-[1050px]  md:w-4/5 flex justify-center bg-[#650013] pt-12 lg:pt-24 pb-8 lg:pb-20 mx-auto flex-col">
                    <div className="w-3/4 lg:w-1/2 flex flex-col lg:mx-unset mx-auto">
                        <span className="block-subtitle">YouTube</span>
                        <h2 className="mt-10 mb-8 text-4xl lg:text-5xl block-big-title">
                            Upload on YouTube?
                        </h2>
                        <p className="mb-16 text-secondaryText leading-loose">
                            Beat the YouTube Notifications with Feedr! With our
                            update interval of 3 seconds, you can guarantee that
                            your fans will be notified instantly when you upload
                            a new video. No more waiting for YouTube to send out
                            notifications!
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
                            src={featYoutube.src}
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
                        className="bg-[#650013] fill-[#650013]"
                    ></path>
                </svg>
            </div>
        </section>
    );
};
