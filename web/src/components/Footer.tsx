// @ts-ignore
import FeedrLogo from "../assets/images/feedr.png";

const footerData = [
    {
        title: "Platforms",
        items: [
            { label: "YouTube", href: "#youtube" },
            { label: "Twitch", href: "#twitch" },
        ],
    },
    {
        title: "Important Links",
        items: [
            { label: "Bot Invite", href: "/invite/bot" },
            { label: "Server Invite", href: "/invite/server" },
            { label: "Stats", href: "/stats" },
            { label: "Terms of Service", href: "/tos" },
            { label: "Privacy Policy", href: "/privacy" },
        ],
    },
    {
        title: "Feedr",
        items: [
            { label: "Source", href: "https://github.com/GalvinPython/feedr" },
        ],
    },
];

export const Footer = () => {
    return (
        <footer aria-label="Site footer">
            <div className="pt-10  lg:pt-20 lg:pb-16 bg-bgDark1 radius-for-skewed ">
                <div className="container mx-auto px-4 w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
                    <div className="flex flex-wrap">
                        <div className="w-full lg:w-1/3 mb-16 lg:mb-0">
                            <div className="flex justify-center lg:justify-start items-center grow basis-0">
                                <div className="text-white mr-2 text-6xl">
                                    <img
                                        src={FeedrLogo.src}
                                        alt="Feedr Logo"
                                        className="w-10 h-10 rounded-full"
                                    />
                                </div>
                                <div className="text-white font-['Inter'] font-bold text-xl">
                                    Feedr
                                </div>
                            </div>
                            <p className="mb-10 mt-4 sm:w-[22rem] lg:w-[20rem] xl:w-[24rem] text-gray-400 leading-loose text-center lg:text-left mx-auto lg:mx-0">
                                None of the entities shown in the images
                                endorsed, are affiliated with, or know of Feedr.
                                I am just a fan of these channels.
                            </p>
                            {/* <div className="w-36 mx-auto lg:mx-0">
                                <a
                                    className="inline-block w-10  h-10 mr-2 p-2 pt-[0.55rem] outlined-button"
                                    href="#"
                                    aria-label="Facebook"
                                >
                                    <FacebookIcon />
                                </a>
                            </div> */}
                        </div>
                        <div className="w-full lg:w-2/3  lg:pl-16 hidden lg:flex flex-wrap justify-between">
                            {footerData.map((section, sectionIndex) => (
                                <div
                                    key={`section-${sectionIndex}`}
                                    className="w-full md:w-1/3 lg:w-auto mb-16 md:mb-0"
                                >
                                    <h3 className="mb-6 text-2xl font-bold text-primaryText">
                                        {section.title}
                                    </h3>
                                    <ul>
                                        {section.items.map(
                                            (item, itemIndex) => (
                                                <li
                                                    key={`${item.label}-${itemIndex}`}
                                                    className="mb-4"
                                                >
                                                    <a
                                                        className="text-gray-400 hover:text-gray-300"
                                                        href={item.href}
                                                        aria-label={item.label}
                                                    >
                                                        {item.label}
                                                    </a>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
