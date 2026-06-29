import { SignIn } from "@clerk/nextjs";
import { Stethoscope } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9f9f8]">
      <div className="text-center mb-8">
        <Stethoscope size={56} className="text-teal-500 mx-auto" />
        <h1 className="text-2xl font-semibold text-gray-800 mt-3">FirstClinic AI</h1>
        <p className="text-gray-500 text-sm mt-1">Your personal health assistant</p>
      </div>
      <SignIn afterSignInUrl="/chat" />
    </div>
  );
}