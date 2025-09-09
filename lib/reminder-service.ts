/**
 * Vehicle Reminder Service
 * Handles tax and MOT reminder creation, management, and notifications
 */

import { PrismaClient } from '@prisma/client'
import { ResendEmailService, ReminderEmailData } from './resend-email-service'

const prisma = new PrismaClient()

// Define types locally until Prisma generates them
type ReminderType = 'MOT_TEST' | 'VEHICLE_TAX' | 'INSURANCE' | 'SERVICE' | 'FINE_PAYMENT' | 'APPEAL_DEADLINE' | 'OTHER'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type SuggestionType = 'MOT_EXPIRING' | 'TAX_EXPIRING' | 'MOT_OVERDUE' | 'TAX_OVERDUE' | 'INSURANCE_DUE' | 'SERVICE_DUE' | 'APPEAL_OPPORTUNITY'
type NotificationMethod = 'EMAIL' | 'SYSTEM' | 'SMS' | 'PUSH'

// Types for service methods
interface CreateReminderData {
  userId: string
  vehicleReg: string
  reminderType: ReminderType
  title: string
  description?: string
  dueDate: Date
  notifyDays?: number
  make?: string
  model?: string
  year?: number
  isRecurring?: boolean
  recurringInterval?: number
}

interface VehicleData {
  registration: string
  make?: string
  model?: string
  year?: number
  dvlaData?: {
    taxStatus?: string
    taxDueDate?: string
    motStatus?: string
    motExpiryDate?: string
    yearOfManufacture?: number
  }
  motTests?: Array<{
    expiryDate: string
    testResult: string
  }>
}

interface SuggestionData {
  userId: string
  vehicleReg: string
  type: SuggestionType
  title: string
  message: string
  priority: Priority
  dvlaData?: any
  dvsaData?: any
}

export class ReminderService {
  /**
   * Create a new reminder
   */
  static async createReminder(data: CreateReminderData) {
    try {
      const reminder = await prisma.vehicleReminder.create({
        data: {
          userId: data.userId,
          vehicleReg: data.vehicleReg.toUpperCase().replace(/\s+/g, ''),
          reminderType: data.reminderType,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          notifyDays: data.notifyDays !== undefined ? data.notifyDays : 30,
          make: data.make,
          model: data.model,
          year: data.year,
          isRecurring: data.isRecurring || false,
          recurringInterval: data.recurringInterval
        }
      })

      // Create notification schedules
      await this.scheduleNotifications(reminder.id, data.dueDate, data.notifyDays !== undefined ? data.notifyDays : 30)

      return reminder
    } catch (error) {
      console.error('Error creating reminder:', error)
      throw new Error('Failed to create reminder')
    }
  }

  /**
   * Get user's active reminders
   */
  static async getUserReminders(userId: string) {
    try {
      return await prisma.vehicleReminder.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          notifications: {
            where: { status: 'PENDING' },
            orderBy: { notifyDate: 'asc' }
          }
        },
        orderBy: { dueDate: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching user reminders:', error)
      throw new Error('Failed to fetch reminders')
    }
  }

  /**
   * Get reminders due soon (for dashboard alerts)
   */
  static async getRemindersDueSoon(userId: string, days: number = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() + days)

      return await prisma.vehicleReminder.findMany({
        where: {
          userId,
          isActive: true,
          dueDate: {
            lte: cutoffDate
          }
        },
        orderBy: { dueDate: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching reminders due soon:', error)
      throw new Error('Failed to fetch upcoming reminders')
    }
  }

  /**
   * Analyze vehicle data and create smart suggestions
   */
  static async analyzeAndSuggestReminders(userId: string, vehicleData: VehicleData) {
    const suggestions: SuggestionData[] = []
    const now = new Date()

    try {
      // Analyze MOT expiry from DVLA data
      if (vehicleData.dvlaData?.motExpiryDate) {
        const motExpiry = new Date(vehicleData.dvlaData.motExpiryDate)
        const daysUntilExpiry = Math.ceil((motExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24))

        if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
          suggestions.push({
            userId,
            vehicleReg: vehicleData.registration,
            type: 'MOT_EXPIRING',
            title: 'MOT Test Due Soon',
            message: `Your MOT expires on ${motExpiry.toLocaleDateString()}. Set up a reminder to book your test.`,
            priority: daysUntilExpiry <= 30 ? 'HIGH' : 'MEDIUM',
            dvlaData: vehicleData.dvlaData
          })
        } else if (daysUntilExpiry <= 0) {
          suggestions.push({
            userId,
            vehicleReg: vehicleData.registration,
            type: 'MOT_OVERDUE',
            title: 'MOT Test Overdue',
            message: `Your MOT expired on ${motExpiry.toLocaleDateString()}. This vehicle is not road legal.`,
            priority: 'URGENT',
            dvlaData: vehicleData.dvlaData
          })
        }
      }

      // Analyze tax expiry from DVLA data
      if (vehicleData.dvlaData?.taxDueDate && vehicleData.dvlaData?.taxStatus === 'Taxed') {
        const taxExpiry = new Date(vehicleData.dvlaData.taxDueDate)
        const daysUntilExpiry = Math.ceil((taxExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24))

        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          suggestions.push({
            userId,
            vehicleReg: vehicleData.registration,
            type: 'TAX_EXPIRING',
            title: 'Vehicle Tax Due Soon',
            message: `Your vehicle tax expires on ${taxExpiry.toLocaleDateString()}. Renew online to avoid penalties.`,
            priority: daysUntilExpiry <= 14 ? 'HIGH' : 'MEDIUM',
            dvlaData: vehicleData.dvlaData
          })
        } else if (daysUntilExpiry <= 0) {
          suggestions.push({
            userId,
            vehicleReg: vehicleData.registration,
            type: 'TAX_OVERDUE',
            title: 'Vehicle Tax Overdue',
            message: `Your vehicle tax expired on ${taxExpiry.toLocaleDateString()}. Renew immediately to avoid fines.`,
            priority: 'URGENT',
            dvlaData: vehicleData.dvlaData
          })
        }
      }

      // Handle untaxed vehicles
      if (vehicleData.dvlaData?.taxStatus === 'Untaxed') {
        suggestions.push({
          userId,
          vehicleReg: vehicleData.registration,
          type: 'TAX_OVERDUE',
          title: 'Vehicle Not Taxed',
          message: 'Your vehicle is not currently taxed. This vehicle is not road legal.',
          priority: 'URGENT',
          dvlaData: vehicleData.dvlaData
        })
      }

      // Save suggestions to database
      for (const suggestion of suggestions) {
        await this.createSuggestion(suggestion)
      }

      return suggestions
    } catch (error) {
      console.error('Error analyzing vehicle data for suggestions:', error)
      throw new Error('Failed to analyze vehicle data')
    }
  }

  /**
   * Create a suggestion
   */
  static async createSuggestion(data: SuggestionData) {
    try {
      // Check if similar suggestion already exists and is not dismissed
      const existingSuggestion = await prisma.vehicleSuggestion.findFirst({
        where: {
          userId: data.userId,
          vehicleReg: data.vehicleReg,
          suggestionType: data.type,
          isDismissed: false,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last 7 days
          }
        }
      })

      if (existingSuggestion) {
        return existingSuggestion // Don't create duplicate
      }

      return await prisma.vehicleSuggestion.create({
        data: {
          userId: data.userId,
          vehicleReg: data.vehicleReg.toUpperCase().replace(/\s+/g, ''),
          suggestionType: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority,
          dvlaData: data.dvlaData,
          dvsaData: data.dvsaData
        }
      })
    } catch (error) {
      console.error('Error creating suggestion:', error)
      throw new Error('Failed to create suggestion')
    }
  }

  /**
   * Get user's active suggestions
   */
  static async getUserSuggestions(userId: string) {
    try {
      return await prisma.vehicleSuggestion.findMany({
        where: {
          userId,
          isDismissed: false
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    } catch (error) {
      console.error('Error fetching user suggestions:', error)
      throw new Error('Failed to fetch suggestions')
    }
  }

  /**
   * Accept a suggestion and create a reminder
   */
  static async acceptSuggestion(suggestionId: string) {
    try {
      const suggestion = await prisma.vehicleSuggestion.findUnique({
        where: { id: suggestionId }
      })

      if (!suggestion) {
        throw new Error('Suggestion not found')
      }

      // Create reminder based on suggestion
      let reminderData: CreateReminderData
      const dvlaData = suggestion.dvlaData as any

      if (suggestion.suggestionType === 'MOT_EXPIRING' || suggestion.suggestionType === 'MOT_OVERDUE') {
        const motExpiry = dvlaData?.motExpiryDate ? new Date(dvlaData.motExpiryDate) : new Date()
        if (suggestion.suggestionType === 'MOT_OVERDUE') {
          // If overdue, set reminder for next month
          motExpiry.setMonth(motExpiry.getMonth() + 1)
        }

        reminderData = {
          userId: suggestion.userId,
          vehicleReg: suggestion.vehicleReg,
          reminderType: 'MOT_TEST',
          title: 'MOT Test Booking',
          description: 'Book and complete MOT test',
          dueDate: motExpiry,
          notifyDays: 30,
          isRecurring: true,
          recurringInterval: 365
        }
      } else if (suggestion.suggestionType === 'TAX_EXPIRING' || suggestion.suggestionType === 'TAX_OVERDUE') {
        const taxExpiry = dvlaData?.taxDueDate ? new Date(dvlaData.taxDueDate) : new Date()
        if (suggestion.suggestionType === 'TAX_OVERDUE') {
          // If overdue, set reminder for next month
          taxExpiry.setMonth(taxExpiry.getMonth() + 1)
        }

        reminderData = {
          userId: suggestion.userId,
          vehicleReg: suggestion.vehicleReg,
          reminderType: 'VEHICLE_TAX',
          title: 'Vehicle Tax Renewal',
          description: 'Renew vehicle tax online',
          dueDate: taxExpiry,
          notifyDays: 14,
          isRecurring: true,
          recurringInterval: 365
        }
      } else {
        throw new Error('Unsupported suggestion type')
      }

      const reminder = await this.createReminder(reminderData)

      // Mark suggestion as accepted
      await prisma.vehicleSuggestion.update({
        where: { id: suggestionId },
        data: {
          isAccepted: true,
          acceptedAt: new Date(),
          createdReminderId: reminder.id
        }
      })

      return reminder
    } catch (error) {
      console.error('Error accepting suggestion:', error)
      throw new Error('Failed to accept suggestion')
    }
  }

  /**
   * Dismiss a suggestion
   */
  static async dismissSuggestion(suggestionId: string) {
    try {
      return await prisma.vehicleSuggestion.update({
        where: { id: suggestionId },
        data: {
          isDismissed: true,
          dismissedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error dismissing suggestion:', error)
      throw new Error('Failed to dismiss suggestion')
    }
  }

  /**
   * Schedule notification for a reminder
   */
  private static async scheduleNotifications(reminderId: string, dueDate: Date, notifyDays: number) {
    try {
      const notifications = []

      // Create notification schedule (multiple notifications leading up to due date)
      const notificationDays = [notifyDays, 14, 7, 1].filter(days => days <= notifyDays)

      for (const days of notificationDays) {
        const notifyDate = new Date(dueDate)
        notifyDate.setDate(notifyDate.getDate() - days)

        // Only schedule future notifications
        if (notifyDate > new Date()) {
          notifications.push({
            reminderId,
            notifyDate,
            method: 'EMAIL' as NotificationMethod,
            subject: `Reminder: Due in ${days} day${days === 1 ? '' : 's'}`,
            message: `Your reminder is due in ${days} day${days === 1 ? '' : 's'}.`
          })
        }
      }

      if (notifications.length > 0) {
        await prisma.vehicleReminderNotification.createMany({
          data: notifications
        })
      }

      return notifications
    } catch (error) {
      console.error('Error scheduling notifications:', error)
      throw new Error('Failed to schedule notifications')
    }
  }

  /**
   * Get pending notifications that need to be sent
   */
  static async getPendingNotifications() {
    try {
      const now = new Date()
      return await prisma.vehicleReminderNotification.findMany({
        where: {
          status: 'PENDING',
          notifyDate: { lte: now }
        },
        include: {
          reminder: {
            include: {
              user: true
            }
          }
        },
        orderBy: { notifyDate: 'asc' }
      })
    } catch (error) {
      console.error('Error fetching pending notifications:', error)
      throw new Error('Failed to fetch pending notifications')
    }
  }

  /**
   * Mark notification as sent
   */
  static async markNotificationSent(notificationId: string, success: boolean, error?: string) {
    try {
      return await prisma.vehicleReminderNotification.update({
        where: { id: notificationId },
        data: {
          status: success ? 'SENT' : 'FAILED',
          sentAt: new Date(),
          emailSent: success,
          emailError: error
        }
      })
    } catch (error) {
      console.error('Error marking notification as sent:', error)
      throw new Error('Failed to update notification status')
    }
  }

  /**
   * Process and send pending notifications using Resend
   */
  static async processNotifications() {
    try {
      const notifications = await this.getPendingNotifications()
      console.log(`Processing ${notifications.length} pending notifications`)
      
      const results = []
      
      for (const notification of notifications) {
        try {
          // Only process MOT and Tax reminders via email
          if (notification.reminder.reminderType === 'MOT_TEST' || 
              notification.reminder.reminderType === 'VEHICLE_TAX') {
            
            // Get user email
            if (!notification.reminder.user?.email) {
              console.error(`No email found for user ${notification.reminder.userId}`)
              await this.markNotificationSent(notification.id, false, 'No email address found')
              continue
            }

            // Calculate days until due
            const dueDate = new Date(notification.reminder.dueDate)
            const today = new Date()
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            // Prepare email data
            const emailData: ReminderEmailData = {
              to: notification.reminder.user.email,
              userName: notification.reminder.user.name || undefined,
              vehicleReg: notification.reminder.vehicleReg,
              make: notification.reminder.make || undefined,
              model: notification.reminder.model || undefined,
              year: notification.reminder.year || undefined,
              dueDate: dueDate,
              reminderType: notification.reminder.reminderType as 'MOT_TEST' | 'VEHICLE_TAX',
              daysUntilDue: daysUntilDue
            }

            // Send email
            const emailSent = await ResendEmailService.sendReminderEmail(emailData)
            
            if (emailSent) {
              await this.markNotificationSent(notification.id, true)
              console.log(`✅ Sent ${notification.reminder.reminderType} reminder to ${notification.reminder.user.email} for vehicle ${notification.reminder.vehicleReg}`)
              results.push({ id: notification.id, success: true, type: notification.reminder.reminderType })
            } else {
              await this.markNotificationSent(notification.id, false, 'Email sending failed')
              console.log(`❌ Failed to send ${notification.reminder.reminderType} reminder to ${notification.reminder.user.email} for vehicle ${notification.reminder.vehicleReg}`)
              results.push({ id: notification.id, success: false, type: notification.reminder.reminderType, error: 'Email sending failed' })
            }
            
          } else {
            // Mark non-email reminders as sent (for now)
            await this.markNotificationSent(notification.id, true)
            console.log(`⚠️ Skipped ${notification.reminder.reminderType} reminder (not configured for email)`)
            results.push({ id: notification.id, success: true, type: notification.reminder.reminderType, skipped: true })
          }
          
        } catch (error) {
          console.error(`Error processing notification ${notification.id}:`, error)
          await this.markNotificationSent(notification.id, false, error instanceof Error ? error.message : 'Unknown error')
          results.push({ id: notification.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
      
      return {
        processed: notifications.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
      
    } catch (error) {
      console.error('Error processing notifications:', error)
      throw new Error('Failed to process notifications')
    }
  }

  /**
   * Delete a reminder
   */
  static async deleteReminder(reminderId: string, userId: string) {
    try {
      // Verify ownership
      const reminder = await prisma.vehicleReminder.findFirst({
        where: { id: reminderId, userId }
      })

      if (!reminder) {
        throw new Error('Reminder not found or unauthorized')
      }

      // Delete reminder and associated notifications
      await prisma.vehicleReminder.delete({
        where: { id: reminderId }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      throw new Error('Failed to delete reminder')
    }
  }

  /**
   * Update reminder
   */
  static async updateReminder(reminderId: string, userId: string, updates: Partial<CreateReminderData>) {
    try {
      // Verify ownership
      const reminder = await prisma.vehicleReminder.findFirst({
        where: { id: reminderId, userId }
      })

      if (!reminder) {
        throw new Error('Reminder not found or unauthorized')
      }

      const updatedReminder = await prisma.vehicleReminder.update({
        where: { id: reminderId },
        data: {
          ...updates,
          vehicleReg: updates.vehicleReg ? updates.vehicleReg.toUpperCase().replace(/\s+/g, '') : undefined,
          updatedAt: new Date()
        }
      })

      // If due date changed, reschedule notifications
      if (updates.dueDate) {
        // Delete existing pending notifications
        await prisma.vehicleReminderNotification.deleteMany({
          where: {
            reminderId,
            status: 'PENDING'
          }
        })

        // Create new notifications
        await this.scheduleNotifications(reminderId, updates.dueDate, updates.notifyDays || reminder.notifyDays)
      }

      return updatedReminder
    } catch (error) {
      console.error('Error updating reminder:', error)
      throw new Error('Failed to update reminder')
    }
  }

  /**
   * Complete a reminder (mark as done)
   */
  static async completeReminder(reminderId: string, userId: string) {
    try {
      const reminder = await prisma.vehicleReminder.findFirst({
        where: { id: reminderId, userId }
      })

      if (!reminder) {
        throw new Error('Reminder not found or unauthorized')
      }

      const updatedReminder = await prisma.vehicleReminder.update({
        where: { id: reminderId },
        data: {
          isCompleted: true,
          completedAt: new Date()
        }
      })

      // If it's a recurring reminder, create the next one
      if (reminder.isRecurring && reminder.recurringInterval) {
        const nextDueDate = new Date(reminder.dueDate)
        nextDueDate.setDate(nextDueDate.getDate() + reminder.recurringInterval)

        await this.createReminder({
          userId: reminder.userId,
          vehicleReg: reminder.vehicleReg,
          reminderType: reminder.reminderType,
          title: reminder.title,
          description: reminder.description || undefined,
          dueDate: nextDueDate,
          notifyDays: reminder.notifyDays,
          make: reminder.make || undefined,
          model: reminder.model || undefined,
          year: reminder.year || undefined,
          isRecurring: true,
          recurringInterval: reminder.recurringInterval
        })
      }

      return updatedReminder
    } catch (error) {
      console.error('Error completing reminder:', error)
      throw new Error('Failed to complete reminder')
    }
  }

  /**
   * Create reminder from vehicle lookup data
   */
  static async createReminderFromVehicleData(userId: string, vehicleData: VehicleData, reminderType: 'MOT' | 'TAX') {
    try {
      let dueDate: Date
      let title: string
      let description: string
      let notifyDays = 30

      if (reminderType === 'MOT') {
        if (vehicleData.dvlaData?.motExpiryDate) {
          dueDate = new Date(vehicleData.dvlaData.motExpiryDate)
        } else if (vehicleData.motTests?.[0]?.expiryDate) {
          dueDate = new Date(vehicleData.motTests[0].expiryDate)
        } else {
          throw new Error('No MOT expiry date found in vehicle data')
        }
        title = `MOT Test - ${vehicleData.registration}`
        description = 'Book and complete MOT test'
      } else {
        if (!vehicleData.dvlaData?.taxDueDate) {
          throw new Error('No tax due date found in vehicle data')
        }
        dueDate = new Date(vehicleData.dvlaData.taxDueDate)
        title = `Vehicle Tax - ${vehicleData.registration}`
        description = 'Renew vehicle tax online'
        notifyDays = 14
      }

      return await this.createReminder({
        userId,
        vehicleReg: vehicleData.registration,
        reminderType: reminderType === 'MOT' ? 'MOT_TEST' : 'VEHICLE_TAX',
        title,
        description,
        dueDate,
        notifyDays,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year || vehicleData.dvlaData?.yearOfManufacture,
        isRecurring: true,
        recurringInterval: 365
      })
    } catch (error) {
      console.error('Error creating reminder from vehicle data:', error)
      throw new Error('Failed to create reminder from vehicle data')
    }
  }
}
