"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
}

const initialMessages: Message[] = [
  {
    id: 1,
    type: "bot",
    content: "🏛️ **Welcome to ClearRideAI Traffic Appeals Assistant!** Please select your penalty type below.",
    timestamp: new Date(),
  },
]

export function Appeals() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const resetConversation = () => {
    setMessages(initialMessages)
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
        botResponse = "🔄 **Fresh Start!** Chat has been reset. Ready to challenge your penalty?"
      } else {
        botResponse = `Thank you for your message: "${userInput}". The interactive appeal system is being updated. Please try the button selection system above or type "reset" to restart.`
      }

      const botMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: botResponse,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error processing message:", error)
      const errorMessage: Message = {
        id: messages.length + 2,
        type: "bot",
        content: "I'm sorry, there was an error processing your message. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 overflow-hidden">
        <div className="w-full h-full flex flex-col">
          <div className="grid w-full grid-cols-2 gap-4 mb-4">
            <Button 
              variant="outline"
              onClick={() => {
                const msg: Message = {
                  id: messages.length + 1,
                  type: "bot",
                  content: "🅿️ **Parking Penalty Selected!** Interactive appeal system is being updated. Please check back soon.",
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, msg])
              }}
            >
              🅿️ Parking Penalty
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const msg: Message = {
                  id: messages.length + 1,
                  type: "bot", 
                  content: "🏎️ **Speeding Fine Selected!** Interactive appeal system is being updated. Please check back soon.",
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, msg])
              }}
            >
              🏎️ Speeding Fine
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? "..." : "Send"}
            </Button>
            <Button
              onClick={resetConversation}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Appeals
