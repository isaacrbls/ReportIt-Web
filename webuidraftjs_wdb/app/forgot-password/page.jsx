"use client";
import { useState, useRef } from "react";
import { auth } from "../../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { RECAPTCHA_SITE_KEY } from "../../lib/recaptcha";
import ReCAPTCHA from "react-google-recaptcha";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCaptcha = (token) => {
    setCaptchaToken(token);
    setCaptchaError("");
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setCaptchaError("");
    setError("");
    console.log("Submit clicked with email:", email);
    if (!captchaToken) {
      setCaptchaError("Please complete the CAPTCHA.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-[#F14B51] text-white p-12">
        <div className="flex flex-col items-start w-full max-w-md">
          <div className="flex items-center mb-8">
            <div className="flex items-center justify-center w-500 h-500 mr-4">
              <Image src="/logo-fix.png" alt="ReportIt Logo" width={500} height={500} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Password Recovery
          </h2>
          <p className="text-lg font-medium mb-2">
            For security reasons, password resets for the ReportIt Admin platform
            require email verification. You will receive a reset link via email to
            complete the password reset process.
          </p>
        </div>
      </div>

      {}
      <div className="flex flex-1 flex-col justify-center items-center bg-white p-8">
        {!sent ? (
          
          <form
            onSubmit={handleEmailSubmit}
            className="w-full max-w-md space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold mb-1">Forgot your password?</h2>
              <p className="text-gray-400 mb-6">
                Enter your email address, and we&apos;ll send you a secure reset
                link.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block font-bold mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#F14B51]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptcha}
              />
            </div>
            {captchaError && (
              <div className="text-red-500 font-semibold mb-2">
                {captchaError}
              </div>
            )}
            {error && (
              <div className="text-red-500 font-semibold mb-2">{error}</div>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-[#F14B51] py-2 text-lg font-medium text-white transition-colors hover:bg-[#e13a47] focus:outline-none focus:ring-2 focus:ring-[#F14B51] focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="font-semibold mb-1">Need immediate assistance?</div>
              <div>Contact your IT department or system administrator directly at:</div>
              <div className="mt-2 font-mono text-gray-500">
                innovatex2025@gmail.com
              </div>
            </div>
          </form>
        ) : !resetDone ? (
          
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-2xl font-bold mb-1">Check your inbox</h2>
            <p className="text-gray-400 mb-6">
              We&apos;ve sent a password reset link to <b>{email}</b>. <br />
              Please follow the link to reset your password.
            </p>
            <a
              href="/"
              className="inline-block mt-4 rounded-md bg-[#F14B51] px-6 py-2 text-lg font-medium text-white transition-colors hover:bg-[#e13a47] focus:outline-none focus:ring-2 focus:ring-[#F14B51] focus:ring-offset-2"
            >
              Back to Login
            </a>
          </div>
        ) : (
          
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-2xl font-bold mb-1">Password Reset Successful</h2>
            <p className="text-gray-400 mb-6">
              Your password has been reset. You may now log in with your new
              password.
            </p>
            <a
              href="/"
              className="inline-block mt-4 rounded-md bg-[#F14B51] px-6 py-2 text-lg font-medium text-white transition-colors hover:bg-[#e13a47] focus:outline-none focus:ring-2 focus:ring-[#F14B51] focus:ring-offset-2"
            >
              Back to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
