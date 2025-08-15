"use client";
import { useState, useRef } from "react";
import { RECAPTCHA_SITE_KEY } from "../../lib/recaptcha";
import ReCAPTCHA from "react-google-recaptcha";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);


  const recaptchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState("");

  const handleCaptcha = (token) => {
    setCaptchaToken(token);
    setCaptchaError("");
  };

  const [captchaError, setCaptchaError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setCaptchaError("");
    if (!captchaToken) {
      setCaptchaError("Please complete the CAPTCHA.");
      return;
    }
    setLoading(true);
    // Verify captcha on backend
    try {
      const res = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCaptchaError("CAPTCHA verification failed. Please try again.");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch (err) {
      setCaptchaError("CAPTCHA verification error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setVerified(true);
  };

  const handleNewPasswordSubmit = (e) => {
    e.preventDefault();
    setResetDone(true);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-[#F14B51] text-white p-12">
        <div className="flex flex-col items-start w-full max-w-md">
          <div className="flex items-center mb-8">
            <Image src="/placeholder-logo.svg" alt="ReportIt Logo" width={56} height={56} className="mr-2" />
            <span className="text-6xl font-extrabold leading-none">ReportIt</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Password Recovery</h2>
          <p className="text-lg font-medium mb-2">
            For security reasons, password resets for the ReportIt Admin platform require email verification. You will receive a verification code via email to complete the password reset process.
          </p>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex flex-1 flex-col justify-center items-center bg-white p-8">
  {!sent ? (
          <form onSubmit={handleEmailSubmit} className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Forgot your password?</h2>
              <p className="text-gray-400 mb-6">Enter your email address, and we'll send you a verification code to help you reset your password.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block font-bold mb-1">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#F14B51]"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
              <div className="text-red-500 font-semibold mb-2">{captchaError}</div>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-[#F14B51] py-2 text-lg font-medium text-white transition-colors hover:bg-[#e13a47] focus:outline-none focus:ring-2 focus:ring-[#F14B51] focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Send Verification code"}
            </button>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="font-semibold mb-1">Need immediate assistance?</div>
              <div>Contact your IT department or system administrator directly at:</div>
              <div className="mt-2 font-mono text-gray-500">admin-support@ReportIt.com</div>
            </div>
          </form>
        ) : !verified ? (
          <form onSubmit={handleCodeSubmit} className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Forgot your password?</h2>
              <p className="text-gray-400 mb-6">Enter your email address, and we'll send you a verification code to help you reset your password.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="block font-bold mb-1">Enter verification code</label>
                <input
                  id="code"
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#F14B51]"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-[#F14B51] py-2 text-lg font-medium text-white transition-colors hover:bg-[#e13a47] focus:outline-none focus:ring-2 focus:ring-[#F14B51] focus:ring-offset-2"
            >
              Verify
            </button>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="font-semibold mb-1">Need immediate assistance?</div>
              <div>Contact your IT department or system administrator directly at:</div>
              <div className="mt-2 font-mono text-gray-500">admin-support@ReportIt.com</div>
            </div>
          </form>
        ) : !resetDone ? (
          <form onSubmit={handleNewPasswordSubmit} className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Forgot your password?</h2>
              <p className="text-gray-400 mb-6">Enter your new password below to complete the reset process.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block font-bold mb-1">Enter new password</label>
                <input
                  id="new-password"
                  type="password"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#F14B51]"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-[#F14B51] py-2 text-lg font-medium text-white transition-colors hover:bg-[#e13a47] focus:outline-none focus:ring-2 focus:ring-[#F14B51] focus:ring-offset-2"
            >
              Reset Password
            </button>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="font-semibold mb-1">Need immediate assistance?</div>
              <div>Contact your IT department or system administrator directly at:</div>
              <div className="mt-2 font-mono text-gray-500">admin-support@ReportIt.com</div>
            </div>
          </form>
        ) : (
          <div className="w-full max-w-md space-y-8 text-center">
            <h2 className="text-2xl font-bold mb-1">Password Reset Successful</h2>
            <p className="text-gray-400 mb-6">Your password has been reset. You may now log in with your new password.</p>
            <a href="/" className="inline-block mt-4 rounded-md bg-[#F14B51] px-6 py-2 text-lg font-medium text-white transition-colors hover:bg-[#e13a47] focus:outline-none focus:ring-2 focus:ring-[#F14B51] focus:ring-offset-2">Back to Login</a>
          </div>
        )}
      </div>
    </div>
  );
}
