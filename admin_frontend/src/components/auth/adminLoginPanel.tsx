import { SigninCard } from "./signinCard";
import { VerificationCard } from "./verificationCard";
import { CreatePasswordCard } from "./createPasswordCard";
import { AuthForgotPassword } from "./authForgotPassword";
import Image from "next/image";
export const AdminLoginPanel = () => {
    return (
        <div className=" grid grid-rows-[auto_1fr_auto] min-h-screen">
            <div className="flex h-60 my-5 justify-center items-center">
                <Image src={"/realBroLogo.svg"} alt="real bro logo" width={140} height={100} />
            </div>
            <div className="">
                {/* <SigninCard /> */}
                {/* <AuthForgotPassword /> */}
                {/* <VerificationCard /> */}
                <CreatePasswordCard />
            </div>
            <div className="flex justify-end">
                <Image src={"/authPageBuildingIcon.svg"} alt="auth page building icon" width={200} height={500} />
            </div>
        </div>
    );
};