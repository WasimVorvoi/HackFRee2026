"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GraduationCap, Award, FileCheck, Clock, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Credential {
  id: string
  type: "degree" | "certification" | "license"
  title: string
  institution: string
  field_of_study?: string
  year_obtained?: number
  verification_status: "pending" | "verified" | "rejected"
  reputation_boost?: number
}

const credentialIcons = {
  degree: GraduationCap,
  certification: Award,
  license: FileCheck,
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
}

const statusIcons = {
  pending: Clock,
  verified: CheckCircle2,
  rejected: XCircle,
}

interface CredentialBadgeProps {
  credential: Credential
  showStatus?: boolean
  size?: "sm" | "md"
}

export function CredentialBadge({ credential, showStatus = true, size = "md" }: CredentialBadgeProps) {
  const Icon = credentialIcons[credential.type]
  const StatusIcon = statusIcons[credential.verification_status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 cursor-default transition-colors",
              credential.verification_status === "verified" && "border-emerald-300 bg-emerald-50",
              credential.verification_status === "pending" && "border-yellow-300 bg-yellow-50",
              credential.verification_status === "rejected" && "border-red-300 bg-red-50 line-through",
              size === "sm" ? "text-xs py-0.5 px-2" : "text-sm py-1 px-2.5"
            )}
          >
            <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            <span className="truncate max-w-[150px]">{credential.title}</span>
            {showStatus && (
              <StatusIcon
                className={cn(
                  size === "sm" ? "h-3 w-3" : "h-4 w-4",
                  credential.verification_status === "verified" && "text-emerald-600",
                  credential.verification_status === "pending" && "text-yellow-600",
                  credential.verification_status === "rejected" && "text-red-600"
                )}
              />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{credential.title}</p>
            <p className="text-xs text-muted-foreground">{credential.institution}</p>
            {credential.field_of_study && (
              <p className="text-xs text-muted-foreground">{credential.field_of_study}</p>
            )}
            {credential.year_obtained && (
              <p className="text-xs text-muted-foreground">Obtained: {credential.year_obtained}</p>
            )}
            <div className="flex items-center gap-1 text-xs pt-1">
              <StatusIcon
                className={cn(
                  "h-3 w-3",
                  credential.verification_status === "verified" && "text-emerald-600",
                  credential.verification_status === "pending" && "text-yellow-600",
                  credential.verification_status === "rejected" && "text-red-600"
                )}
              />
              <span className="capitalize">{credential.verification_status}</span>
              {credential.verification_status === "verified" && credential.reputation_boost && (
                <span className="text-emerald-600 ml-1">+{credential.reputation_boost} rep</span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface CredentialListProps {
  credentials: Credential[]
  showStatus?: boolean
  maxVisible?: number
  size?: "sm" | "md"
}

export function CredentialList({ credentials, showStatus = true, maxVisible = 3, size = "md" }: CredentialListProps) {
  const verifiedCredentials = credentials.filter((c) => c.verification_status === "verified")
  const visibleCredentials = verifiedCredentials.slice(0, maxVisible)
  const remainingCount = verifiedCredentials.length - maxVisible

  if (verifiedCredentials.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleCredentials.map((credential) => (
        <CredentialBadge
          key={credential.id}
          credential={credential}
          showStatus={showStatus}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className={size === "sm" ? "text-xs" : "text-sm"}>
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}
