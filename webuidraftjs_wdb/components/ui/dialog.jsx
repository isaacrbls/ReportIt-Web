"use client"

import React, { useState, createContext, useContext } from "react"
import { cn } from "@/lib/utils"

const DialogContext = createContext()

function Dialog({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange : setInternalOpen

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setOpen(false)
    }
  }

  return (
    <DialogContext.Provider value={{ isOpen, setOpen }}>
      {isOpen ? (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-black/50"
            onClick={handleBackdropClick}
          />
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              {children}
            </div>
          </div>
        </>
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

function DialogContent({ children, className, onEscapeKeyDown, ...props }) {
  const { setOpen } = useContext(DialogContext)

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (onEscapeKeyDown) {
        onEscapeKeyDown()
      } else {
        setOpen(false)
      }
    }
  }

  React.useEffect(() => {
    const handler = handleKeyDown
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onEscapeKeyDown, setOpen])

  return (
    <div 
      className={cn("bg-white rounded-lg shadow-lg p-6 relative", className)}
      {...props}
    >
      {!className?.includes('bg-transparent') && !className?.includes('bg-black') && !className?.includes('p-0') && (
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      )}
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
