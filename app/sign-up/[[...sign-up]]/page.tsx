"use client";
import { SignUp } from "@clerk/nextjs";
import { useState } from "react";
import { Stethoscope } from "lucide-react";
export default function SignUpPage() {
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9f9f8] px-4">
      <div className="text-center mb-8">
        <Stethoscope size={56} className="text-teal-500" />
        <h1 className="text-2xl font-semibold text-gray-800 mt-3">FirstClinic AI</h1>
        <p className="text-gray-500 text-sm mt-1">Your personal health assistant</p>
      </div>

      {!ageConfirmed ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
          <h2 className="font-semibold text-gray-800 text-lg mb-2">Age Confirmation</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            FirstClinic AI is designed for users aged 16 and above. Please confirm
            your age before creating an account.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setAgeConfirmed(true)}
              className="w-full py-2.5 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition"
            >
              I confirm I am 16 or older
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
            >
              I am under 16
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            This service provides general health information only. Always consult a qualified doctor.
          </p>
        </div>
      ) : (
        <SignUp afterSignUpUrl="/chat" />
      )}
    </div>
  );
}