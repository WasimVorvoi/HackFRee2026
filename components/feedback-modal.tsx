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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const FEEDBACK_TAGS = [
  { key: "helpful", label: "Helpful" },
  { key: "organized", label: "Well Organized" },
  { key: "punctual", label: "Punctual" },
  { key: "friendly", label: "Friendly" },
  { key: "knowledgeable", label: "Knowledgeable" },
  { key: "inspiring", label: "Inspiring" },
]

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunityId: string
  organizerId: string
  userId: string
  opportunityTitle: string
}

export function FeedbackModal({
  open,
  onOpenChange,
  opportunityId,
  organizerId,
  userId,
  opportunityTitle,
}: FeedbackModalProps) {
  const [attended, setAttended] = useState(true)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          from_user_id: userId,
          to_user_id: organizerId,
          rating,
          feedback_tags: selectedTags,
          attended,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to submit feedback")
      }

      toast.success("Thank you for your feedback!")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your experience?</DialogTitle>
          <DialogDescription>
            Share feedback about "{opportunityTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Attendance Confirmation */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="attended"
              checked={attended}
              onCheckedChange={(checked) => setAttended(checked === true)}
            />
            <Label htmlFor="attended" className="cursor-pointer">
              I attended this opportunity
            </Label>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rate your experience</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoveredRating || rating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Feedback Tags */}
          <div className="space-y-2">
            <Label>What did you like? (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TAGS.map((tag) => (
                <Badge
                  key={tag.key}
                  variant={selectedTags.includes(tag.key) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedTags.includes(tag.key)
                      ? ""
                      : "hover:bg-primary/10"
                  )}
                  onClick={() => toggleTag(tag.key)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
