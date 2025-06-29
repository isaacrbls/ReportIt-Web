"use client"

import React, { useState, createContext, useContext } from "react"

const DialogContext = createContext()

function Dialog({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange : setInternalOpen

  return (
    <DialogContext.Provider value={{ isOpen, setOpen }}>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          {children}
        </div>
      ) : null}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ children }) {
  const { setOpen } = useContext(DialogContext)
  return React.cloneElement(children, {
    onClick: () => setOpen(true),
  })
}

function DialogContent({ children }) {
  const { setOpen } = useContext(DialogContext)
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        onClick={() => setOpen(false)}
      >
        ×
      </button>
      {children}
    </div>
  )
}

function DialogHeader({ children }) {
  return <div className="mb-4">{children}</div>
}
function DialogTitle({ children }) {
  return <h3 className="text-lg font-bold">{children}</h3>
}
function DialogDescription({ children }) {
  return <p className="text-gray-500">{children}</p>
}
function DialogFooter({ children }) {
  return <div className="mt-4">{children}</div>
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
