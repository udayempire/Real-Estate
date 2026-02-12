import Image from "next/image";

export const AuthBanner = () => {
    return (
        <div className="bg-blue-500 h-full min-h-0 flex flex-col">

            {/* Top Text */}
            <div className="mt-14 p-4">
                <h1 className="font-bold text-5xl leading-[69px] tracking-[-0.02em] text-right text-white">
                    Insight. Control. Growth
                </h1>
                <p className="text-white text-right">
                    Secure access for RealBro administration and financial oversight
                </p>
            </div>

            {/* Bottom Image */}
            <div className="mt-auto">
                <Image
                    src="/authBannerIcon_1.svg"
                    alt="auth page building icon"
                    width={350}
                    height={500}
                />
            </div>
        </div>
    );
};
