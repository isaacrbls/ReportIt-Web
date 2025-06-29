import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

export default function AddReportDialog({ open, onClose }) {
  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
  // Placeholder handlers for photo/video

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0 bg-transparent border-none shadow-none flex items-center justify-center min-h-screen overflow-y-auto">
        <div className="bg-white rounded-2xl border p-10 shadow-sm w-[500px] flex flex-col items-stretch max-w-full max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-red-500 text-2xl font-bold mb-4">Detail of report</DialogTitle>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Type of incident</label>
            <input
              className="w-full border rounded-lg px-4 py-2 focus:outline-none"
              value={incidentType}
              onChange={e => setIncidentType(e.target.value)}
              placeholder="Enter type of incident"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded-lg px-4 py-2 focus:outline-none min-h-[80px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the incident"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Add photo or video</label>
            <div className="flex gap-4 justify-center">
              <button className="flex flex-col items-center justify-center border rounded-lg px-12 py-8 text-red-500 border-red-200 bg-red-50 hover:bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v1.5M3 7.5h18M3 7.5v10.125A2.625 2.625 0 0 0 5.625 20.25h12.75A2.625 2.625 0 0 0 21 17.625V7.5M7.5 11.25l2.25 2.25 3-3.75 4.5 6" />
                </svg>
                <span className="font-medium text-base">Photo</span>
              </button>
              <button className="flex flex-col items-center justify-center border rounded-lg px-12 py-8 text-red-500 border-red-200 bg-red-50 hover:bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V6.75A2.25 2.25 0 0 0 13.5 4.5h-3A2.25 2.25 0 0 0 8.25 6.75V9m7.5 0v6m0-6h1.5A2.25 2.25 0 0 1 19.5 11.25v1.5A2.25 2.25 0 0 1 18 15h-1.5m-7.5-6v6m0-6H6.75A2.25 2.25 0 0 0 4.5 11.25v1.5A2.25 2.25 0 0 0 6 15h1.5" />
                </svg>
                <span className="font-medium text-base">Video</span>
              </button>
            </div>
          </div>
          <div className="mb-6 flex justify-center">
            {/* Placeholder for map */}
            <div className="w-[400px] h-[220px] bg-[#F8E3DE] rounded-lg flex items-center justify-center overflow-hidden">
              <img src="/placeholder-map.png" alt="Map" className="object-cover w-full h-full" />
            </div>
          </div>
          <div className="flex justify-between gap-4">
            <button className="border border-red-400 text-red-500 px-8 py-2 rounded-md" onClick={onClose}>Back</button>
            <button className="bg-red-500 text-white px-8 py-2 rounded-md">Submit</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
