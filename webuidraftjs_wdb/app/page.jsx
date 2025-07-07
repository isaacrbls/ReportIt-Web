"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import Sidebar from "@/components/admin/Sidebar";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/admin";
    } catch (err) {
      setError("Invalid credentials. Please check your email and password.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-[#F14B51] text-white p-12">
        <div className="flex flex-col items-start w-full max-w-md">
          <div className="flex items-center mb-8">
            <div className="flex items-center justify-center w-500 h-500 mr-4">
              <Image src="/logo-fix.png" alt="ReportIt Logo" width={500} height={500} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Advance Incident<br />Analysis Platform</h2>
          <p className="text-lg font-medium mb-2">
            Powered by machine learning to help barangay prevent, and respond to incident more effectively.
          </p>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex flex-1 flex-col justify-center items-center bg-white p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome Back</h2>
            <p className="text-gray-400 mb-6">Sign in to access your admin dashboard and analytics</p>
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
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="font-bold">Password</label>
                <Link href="/forgot-password" className="text-[#F14B51] text-sm font-medium hover:underline">Forgot Password?</Link>
              </div>
              <input
                id="password"
                type="password"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#F14B51]"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-md bg-[#F14B51] py-2 text-lg font-medium text-white transition-colors hover:bg-[#e13a47] focus:outline-none focus:ring-2 focus:ring-[#F14B51] focus:ring-offset-2"
          >
            Login
          </button>
          <div className="text-xs text-gray-400 pt-2">Test account: test@example.com / test1234</div>
        </form>
      </div>
    </div>
  );
}
