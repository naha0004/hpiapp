// Simplified version to check basic syntax
"use client"

import React, { useState, useEffect, useRef } from "react"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
}

export function Appeals() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const resetConversation = () => {
    setMessages([])
    setInputValue("")
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = inputValue.trim()
    setInputValue("")
    setIsLoading(true)

    try {
      let botResponse = ""
      
      if (userInput.toLowerCase() === "reset") {
        resetConversation()
        botResponse = "Reset complete"
      } else {
        botResponse = "Got your message"
      }

      const botMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: botResponse,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <p>Appeals component</p>
    </div>
  )
}

export default Appeals
