"use client"

import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns"
import { Calendar, Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OrderDateDisplayProps {
  createdAt: string
  updatedAt?: string
  className?: string
  showRelative?: boolean
  showUpdated?: boolean
}

export function OrderDateDisplay({ 
  createdAt, 
  updatedAt, 
  className = "", 
  showRelative = true,
  showUpdated = false 
}: OrderDateDisplayProps) {
  const createdDate = new Date(createdAt)
  const updatedDate = updatedAt ? new Date(updatedAt) : null
  const hasBeenUpdated = updatedDate && updatedDate.getTime() !== createdDate.getTime()

  const getRelativeTime = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE \'at\' HH:mm')
    } else {
      return format(date, 'MMM dd \'at\' HH:mm')
    }
  }

  const getFullDateTime = (date: Date) => {
    return format(date, 'PPP \'at\' p') // e.g., "January 1, 2024 at 2:30 PM"
  }

  return (
    <TooltipProvider>
      <div className={`space-y-1 ${className}`}>
        {/* Created date */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-help">
              <Calendar className="h-3 w-3 mr-1.5" />
              <span className="font-medium">
                {showRelative ? getRelativeTime(createdDate) : format(createdDate, 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Order Created</p>
              <p>{getFullDateTime(createdDate)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(createdDate, { addSuffix: true })}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Updated date (if different and requested) */}
        {showUpdated && hasBeenUpdated && updatedDate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-xs text-gray-500 hover:text-gray-700 cursor-help">
                <Clock className="h-3 w-3 mr-1" />
                <span>Updated {getRelativeTime(updatedDate)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">Last Updated</p>
                <p>{getFullDateTime(updatedDate)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(updatedDate, { addSuffix: true })}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}