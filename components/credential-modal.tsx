"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, GraduationCap, Award, FileCheck } from "lucide-react"
import { toast } from "sonner"

const CREDENTIAL_TYPES = [
  { value: "degree", label: "Degree", icon: GraduationCap, description: "Bachelor's, Master's, PhD, etc." },
  { value: "certification", label: "Certification", icon: Award, description: "Professional certifications" },
  { value: "license", label: "License", icon: FileCheck, description: "Professional licenses" },
]

interface CredentialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CredentialModal({ open, onOpenChange, onSuccess }: CredentialModalProps) {
  const [type, setType] = useState<string>("")
  const [title, setTitle] = useState("")
  const [institution, setInstitution] = useState("")
  const [fieldOfStudy, setFieldOfStudy] = useState("")
  const [yearObtained, setYearObtained] = useState("")
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setType("")
    setTitle("")
    setInstitution("")
    setFieldOfStudy("")
    setYearObtained("")
  }

  const handleSubmit = async () => {
    if (!type || !title || !institution) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          institution,
          field_of_study: fieldOfStudy || undefined,
          year_obtained: yearObtained ? parseInt(yearObtained) : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to submit credential")
      }

      toast.success("Credential submitted for verification!")
      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to submit credential")
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Credential</DialogTitle>
          <DialogDescription>
            Submit your degrees, certifications, or licenses for verification. Verified credentials boost your reputation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Credential Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select credential type" />
              </SelectTrigger>
              <SelectContent>
                {CREDENTIAL_TYPES.map((credType) => {
                  const Icon = credType.icon
                  return (
                    <SelectItem key={credType.value} value={credType.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <span>{credType.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({credType.description})
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder={
                type === "degree"
                  ? "e.g., Bachelor of Science in Computer Science"
                  : type === "certification"
                  ? "e.g., AWS Solutions Architect"
                  : "e.g., Licensed Professional Engineer"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institution">Institution *</Label>
            <Input
              id="institution"
              placeholder={
                type === "degree"
                  ? "e.g., MIT, Stanford University"
                  : type === "certification"
                  ? "e.g., Amazon Web Services, Google"
                  : "e.g., State Board of Engineering"
              }
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>

          {/* Field of Study (optional) */}
          {type === "degree" && (
            <div className="space-y-2">
              <Label htmlFor="fieldOfStudy">Field of Study</Label>
              <Input
                id="fieldOfStudy"
                placeholder="e.g., Computer Science, Business Administration"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
              />
            </div>
          )}

          {/* Year Obtained */}
          <div className="space-y-2">
            <Label htmlFor="yearObtained">Year Obtained</Label>
            <Select value={yearObtained} onValueChange={setYearObtained}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-medium mb-1">Reputation Boosts:</p>
            <ul className="space-y-0.5">
              <li>Degree: +15 points when verified</li>
              <li>Certification: +10 points when verified</li>
              <li>License: +12 points when verified</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !type || !title || !institution}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Verification"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
