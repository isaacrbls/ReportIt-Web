import React from "react";

export default function LogoutConfirmationModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
      <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center w-[420px]">
        <div className="text-2xl font-bold text-center mb-8 text-black">
          Are you sure you<br />want to log out?
        </div>
        <div className="flex gap-8 w-full justify-center">
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-10 py-3 text-lg transition-colors"
            onClick={onConfirm}
          >
            Yes
          </button>
          <button
            className="border border-red-400 text-red-500 font-medium rounded-lg px-10 py-3 text-lg bg-white hover:bg-red-50 transition-colors"
            onClick={onCancel}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
