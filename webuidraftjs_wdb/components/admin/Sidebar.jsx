import Link from "next/link";
import Image from "next/image";
import { LogOut, LayoutDashboard, BarChart2, FileText, ShieldAlert } from "lucide-react";

export default function Sidebar({ onLogout }) {
  return (
    <aside className="flex flex-col w-64 bg-red-600 text-white min-h-screen justify-between fixed left-0 top-0 z-20">
      <div>
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 h-[120px] px-6 border-b border-red-500">
          <Image src="/logo-fix.png" alt="ReportIt Logo" width={120} height={120} />
        </div>
        {/* Menu */}
        <nav className="flex flex-col gap-2 mt-8 px-6">
          <Link href="/admin" className="py-2 px-3 rounded-md text-lg font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/analytics" className="py-2 px-3 rounded-md text-lg font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
            <BarChart2 className="w-5 h-5" /> Analytics
          </Link>
          <Link href="/admin/reports" className="py-2 px-3 rounded-md text-lg font-medium bg-white/10 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Manage Reports
          </Link>
        </nav>
      </div>
      {/* Logout */}
      <div className="mb-8 px-6">
        <button
          className="w-full py-2 px-3 rounded-md text-lg font-medium bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" /> Log out
        </button>
      </div>
    </aside>
  );
}
