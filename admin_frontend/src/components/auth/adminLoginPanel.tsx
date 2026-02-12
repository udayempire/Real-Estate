import Image from "next/image";

export function AdminLoginPanel({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden">
            <div className="flex shrink-0 items-center justify-center py-10">
                <Image src={"/realBroLogo.svg"} alt="real bro logo" width={140} height={100} />
            </div>
            <div className="min-h-0 overflow-auto px-6">
                {children}
            </div>
            <div className="flex shrink-0 justify-end">
                <Image src={"/authPageBuildingIcon.svg"} alt="auth page building icon" width={200} height={500} />
            </div>
        </div>
    );
}