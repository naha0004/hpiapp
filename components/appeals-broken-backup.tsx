"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { api, handleApiError } from "@/lib/api"
import { UKTrafficLawAssistant } from "@/lib/uk-traffic-law-assistant"
import { detectTicketType, validateTicketNumber, validateTicketNumberForType, getAppealGuidance, TICKET_TYPES } from "@/lib/ticket-types"
import { Button } from "@/components/ui/button"

interface Message {
  id: number
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface AppealData {
  ticketNumber?: string
  ticketType?: string
  category?: 'civil' | 'criminal' | 'private'
  vehicleRegistration?: string
  fineAmount?: number
  issueDate?: string
  dueDate?: string
  location?: string
  reason?: string
  description?: string
  evidence?: string[]
}

const initialMessages: Message[] = [
  {
    id: 1,
    type: "bot",
    content: "🏛️ **Welcome to ClearRideAI Traffic Appeals Assistant!**\n\nI'm your expert AI companion for challenging ALL types of UK traffic penalties and fines. I've helped thousands of drivers successfully appeal their penalties using advanced legal analysis and comprehensive UK traffic law expertise.\n\n🎯 **What Type of Ticket Are You Appealing?**\n\nPlease select your penalty type by clicking one of the buttons below:",
    timestamp: new Date(),
  },
]

export function Appeals() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [appealData, setAppealData] = useState<Partial<AppealData>>({})
  const [appealStep, setAppealStep] = useState<"ticket_type_selection" | "ticket" | "vehicle_registration" | "amount" | "issue_date" | "due_date" | "location" | "reason" | "description" | "complete">("ticket_type_selection")
  const [isCreatingAppeal, setIsCreatingAppeal] = useState(false)
  
  const resetConversation = () => {
    setMessages(initialMessages)
    setInputValue("")
    setIsCreatingAppeal(false)
    setAppealStep("ticket_type_selection")
    setAppealData({})
  }

  const handleTicketTypeSelection = (ticketTypeId: string) => {
    const selectedType = TICKET_TYPES[ticketTypeId]
    if (selectedType) {
      setAppealData(prev => ({ 
        ...prev, 
        ticketType: selectedType.id,
        category: selectedType.category
      }))
      setIsCreatingAppeal(true)
      setAppealStep("ticket")
      
      const botMessage: Message = {
        id: messages.length + 1,
        type: "bot",
        content: `✅ **${selectedType.name} Selected!**\n\n🎫 **Appeal Type:** ${selectedType.name}\n📋 **Category:** ${selectedType.category}\n🏛️ **Appeals Route:** ${selectedType.authority}\n\n📝 **Enter Your Ticket Number**\n\n${selectedType.description}\n\n🔍 **Expected Format:** ${selectedType.patterns[0].source}\n📝 **Example:** ${selectedType.examples[0]}\n\n**Please enter your ${selectedType.name.toLowerCase()} number:**`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
    }
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
      
      if (userInput.toLowerCase() === "reset" || userInput.toLowerCase() === "restart") {
        resetConversation()
        botResponse = "🔄 **Fresh Start - Let's Win This Appeal!**\n\n✅ **Chat has been reset** - all previous information cleared\n\n🚀 **Ready to challenge your penalty?** Please select your penalty type using the buttons above."
      } else if (!isCreatingAppeal) {
        // Use the expert UK Traffic Law Assistant for general queries
        botResponse = UKTrafficLawAssistant.generateResponse(userInput, {
          appealData,
          messages,
          isCreatingAppeal
        })
      } else {
        // Handle appeal creation steps
        switch (appealStep) {
          case "ticket":
            const ticketNumber = userInput.replace(/[^A-Z0-9]/g, '').toUpperCase()
            const selectedTicketType = TICKET_TYPES[appealData.ticketType || 'pcn']
            const isValid = validateTicketNumberForType(ticketNumber, selectedTicketType.id)
            
            if (isValid) {
              setAppealData(prev => ({ 
                ...prev, 
                ticketNumber
              }))
              setAppealStep("vehicle_registration")
              
              const guidance = getAppealGuidance(selectedTicketType)
              botResponse = `✅ **Ticket Number Confirmed: ${ticketNumber}**\n\n🎯 **Ticket Type: ${selectedTicketType.name}**\n📋 **Category:** ${selectedTicketType.category.charAt(0).toUpperCase() + selectedTicketType.category.slice(1)} penalty\n⚖️ **Appeal Route:** ${guidance.appealRoute}\n📅 **Time Limit:** ${guidance.timeLimit}\n💷 **Typical Range:** £${selectedTicketType.fineRange.min}-£${selectedTicketType.fineRange.max}\n\n🚗 **Next Step:** I need your vehicle registration number (e.g., AB12 CDE)`
            } else {
              botResponse = `❌ **Invalid ${selectedTicketType.name} Format**\n\n🔍 **Expected format for ${selectedTicketType.name}:**\n${selectedTicketType.description}\n\n📝 **Examples:**\n${selectedTicketType.examples.map(ex => `• ${ex}`).join('\n')}\n\n🔢 **Please check your penalty notice and enter the correct ticket number**`
            }
            break

          case "vehicle_registration":
            const vehicleReg = userInput.replace(/\s+/g, '').toUpperCase()
            if (vehicleReg.length >= 5) {
              setAppealData(prev => ({ ...prev, vehicleRegistration: vehicleReg }))
              setAppealStep("amount")
              botResponse = `Great! Vehicle registration ${vehicleReg} recorded.\n\nWhat is the fine amount? Please provide the amount in pounds (e.g., £60.00 or just 60).`
            } else {
              botResponse = "Please provide a valid vehicle registration number (e.g., AB12 CDE, AB12CDE)."
            }
            break

          case "amount":
            const amountMatch = userInput.match(/(\d+(?:\.\d{2})?)/)
            if (amountMatch) {
              const amount = parseFloat(amountMatch[1])
              setAppealData(prev => ({ ...prev, fineAmount: amount }))
              setAppealStep("issue_date")
              
              const discountedAmount = amount * 0.5
              const totalSavings = amount
              
              botResponse = `💰 **Perfect! Fine Amount: £${amount.toFixed(2)}**\n\n📊 **Your Potential Savings:**\n• Early payment discount: £${discountedAmount.toFixed(2)} (you still pay £${discountedAmount.toFixed(2)})\n• **Successful appeal: £${totalSavings.toFixed(2)} (you pay nothing!)** ⭐\n\n⏰ **Next: When did this happen?**\nI need the issue date from your penalty notice.\n\n📅 **Please provide the date the fine was issued:**\n• Format: DD/MM/YYYY (e.g., 15/03/2024)`
            } else {
              botResponse = "💷 **I need the fine amount to calculate your potential savings!**\n\nPlease tell me the amount from your penalty notice (e.g., \"60\" or \"£60.00\")."
            }
            break

          case "issue_date":
            const issueDateMatch = userInput.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/)
            if (issueDateMatch) {
              const [, day, month, year] = issueDateMatch
              const issueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              setAppealData(prev => ({ ...prev, issueDate }))
              setAppealStep("due_date")
              botResponse = `Thank you! Issue date recorded as ${day}/${month}/${year}.\n\nWhat is the payment due date? Please provide the date in DD/MM/YYYY format.`
            } else {
              botResponse = "Please provide the issue date in DD/MM/YYYY format (e.g., 15/03/2024)."
            }
            break

          case "due_date":
            const dueDateMatch = userInput.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/)
            if (dueDateMatch) {
              const [, day, month, year] = dueDateMatch
              const dueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              setAppealData(prev => ({ ...prev, dueDate }))
              setAppealStep("location")
              botResponse = `Due date recorded as ${day}/${month}/${year}.\n\nWhere did this incident occur? Please provide the location (e.g., "High Street Car Park, Birmingham").`
            } else {
              botResponse = "Please provide the due date in DD/MM/YYYY format (e.g., 28/03/2024)."
            }
            break

          case "location":
            if (userInput.length >= 5) {
              setAppealData(prev => ({ ...prev, location: userInput }))
              setAppealStep("reason")
              botResponse = `📍 **Location Recorded: ${userInput}**\n\n🎯 **Now for the crucial part - your appeal reason!**\n\nChoose the reason that best matches your situation:\n\n**1️⃣ Invalid signage** 🚫\n**2️⃣ Permit displayed** 🎫\n**3️⃣ Medical emergency** 🏥\n**4️⃣ Vehicle breakdown** 🔧\n**5️⃣ Loading/unloading** 📦\n**6️⃣ Payment system error** 💳\n**7️⃣ Other reason** 📝\n\n**Type 1-7 or describe your specific situation!**`
            } else {
              botResponse = "Please provide a more specific location (e.g., \"High Street, Birmingham\" or \"Tesco Car Park, Manchester\")."
            }
            break

          case "reason":
            let reason = ""
            if (userInput === "1") reason = "Invalid or unclear signage"
            else if (userInput === "2") reason = "Valid permit displayed"
            else if (userInput === "3") reason = "Medical emergency"
            else if (userInput === "4") reason = "Vehicle breakdown"
            else if (userInput === "5") reason = "Loading/unloading permitted"
            else if (userInput === "6") reason = "Payment system malfunction"
            else if (userInput === "7" || userInput.toLowerCase().includes("other")) reason = "Other circumstances"
            else if (userInput.length >= 10) reason = userInput
            else {
              botResponse = "Please choose a number from 1-7 or provide a detailed reason for your appeal."
              break
            }
            
            setAppealData(prev => ({ ...prev, reason }))
            setAppealStep("description")
            botResponse = `✅ **Appeal Reason: ${reason}**\n\n📝 **Final Step: Your Appeal Description**\n\nYou have two options:\n\n🤖 **1. AI Professional Writer** (Recommended)\n   • Type **"generate"** and I'll craft a legally-optimized description\n   • Uses UK traffic law precedents and winning arguments\n\n✍️ **2. Write It Yourself**\n   • Provide your own detailed description\n   • Include timeline, circumstances, and why the penalty should be cancelled\n\nWhat's your choice? Type **"generate"** for AI help or write your own description!`
            break

          case "description":
            if (userInput.toLowerCase().includes("generate")) {
              const appealCaseData = {
                ticketNumber: appealData.ticketNumber,
                fineAmount: appealData.fineAmount,
                issueDate: appealData.issueDate,
                dueDate: appealData.dueDate,
                location: appealData.location,
                reason: appealData.reason!,
                description: '',
                circumstances: '',
                evidence: []
              }
              const generatedDescription = UKTrafficLawAssistant.generateAppealDescription(appealCaseData)
              setAppealData(prev => ({ ...prev, description: generatedDescription }))
              setAppealStep("complete")
              
              botResponse = `🏆 **AI Professional Appeal Description Generated!**\n\n📋 **Your Customized Appeal:**\n"${generatedDescription.substring(0, 300)}..."\n\n✅ **Appeal Complete!** Your professional appeal has been generated with:\n• Legal precedents and case law\n• Specific circumstances of your case\n• Professional language that appeals panels respect\n• Strategic arguments for maximum success\n\n📄 **Next Steps:**\n1. Review the generated appeal\n2. Submit to the appropriate authority\n3. Keep copies of all correspondence\n\n🎯 **Success Strategy:** This appeal uses proven legal arguments that have helped thousands of drivers successfully challenge their penalties!`
            } else if (userInput.length >= 20) {
              setAppealData(prev => ({ ...prev, description: userInput }))
              setAppealStep("complete")
              botResponse = `✅ **Your Custom Description Recorded!**\n\n📝 **Description:** "${userInput.substring(0, 200)}..."\n\n✅ **Appeal Complete!** Your appeal is ready for submission.\n\n📄 **Next Steps:**\n1. Submit your appeal to the appropriate authority\n2. Keep copies of all correspondence\n3. Follow up if no response within the required timeframe`
            } else {
              botResponse = "Please provide a more detailed description (at least 20 characters) or type 'generate' for AI assistance."
            }
            break

          default:
            botResponse = "I'm not sure how to help with that. Would you like to start a new appeal?"
            resetConversation()
            break
        }
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
