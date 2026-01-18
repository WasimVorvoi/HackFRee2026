"use client"

import { Suspense, useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { Send, Search } from "lucide-react"
import { BoxLoader } from "@/components/box-loader"
import { useMinLoading } from "@/hooks/use-min-loading"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

type Message = {
  id: string
  opportunity_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    full_name: string
  }
  receiver?: {
    id: string
    full_name: string
  }
}

type Contact = {
  id: string
  full_name: string
  email: string
  opportunity_id?: string
}

function MessagesContent() {
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get("user")
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(targetUserId || null)
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const showLoader = useMinLoading(loading)

  useEffect(() => {
    if (user) {
      fetchContacts()
      if (selectedUserId) {
        fetchMessages(selectedUserId)
      }
    }
  }, [user, selectedUserId])

  // Poll for new messages (replaces real-time subscription)
  useEffect(() => {
    if (!user || !selectedUserId || !selectedOpportunityId) return

    const interval = setInterval(() => {
      fetchMessages(selectedUserId)
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [user, selectedUserId, selectedOpportunityId])

  const fetchContacts = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/messages/contacts")
      const data = await response.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error("Error fetching contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return

    try {
      let oppId = selectedOpportunityId

      if (!oppId) {
        // Try to find any opportunity where both users are involved
        const allOppsResponse = await fetch("/api/opportunities")
        const allOpps = await allOppsResponse.json()
        
        // Find opportunity where user is organizer and other user is participant, or vice versa
        for (const opp of allOpps) {
          if (opp.organizer_id === user.id || opp.organizer_id === otherUserId) {
            const partResponse = await fetch(`/api/opportunities/${opp.id}/participants`)
            const partData = await partResponse.json()
            const participants = partData.participants || []
            const hasBoth = 
              (opp.organizer_id === user.id && participants.some((p: any) => p.user_id === otherUserId)) ||
              (opp.organizer_id === otherUserId && participants.some((p: any) => p.user_id === user.id))
            
            if (hasBoth) {
              oppId = opp.id
              break
            }
          }
        }
      }

      if (!oppId) {
        setMessages([])
        return
      }

      setSelectedOpportunityId(oppId)

      const response = await fetch(`/api/messages?opportunityId=${oppId}&otherUserId=${otherUserId}`)
      const data = await response.json()
      setMessages(data.messages || [])

      // Mark messages as read
      try {
        await fetch("/api/messages/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opportunityId: oppId }),
        })
      } catch {
        // Ignore errors marking as read
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !user || !selectedOpportunityId) return

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunity_id: selectedOpportunityId,
          receiver_id: selectedUserId,
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || "Failed to send message")
      }

      setNewMessage("")
      fetchMessages(selectedUserId)
    } catch (error: any) {
      toast.error(error.message || "Failed to send message")
    }
  }

  const filteredContacts = contacts.filter((contact) =>
    contact.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedContact = contacts.find((c) => c.id === selectedUserId)

  if (showLoader) {
    return (
      <div className="max-w-6xl mx-auto">
        <BoxLoader />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Messages</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Contacts</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No contacts yet. Join an opportunity to start messaging.
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedUserId(contact.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted ${
                      selectedUserId === contact.id ? "bg-muted" : ""
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{contact.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-sm truncate">{contact.full_name}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          {selectedContact ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{selectedContact.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedContact.full_name}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-6 space-y-4 min-h-[400px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-4 ${
                          message.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_id === user?.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>

              <div className="p-6 border-t">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    rows={3}
                    className="resize-none text-base"
                    disabled={!selectedOpportunityId}
                  />
                  <Button onClick={handleSendMessage} size="icon" disabled={!selectedOpportunityId}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!selectedOpportunityId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You need to be part of the same opportunity to message this person.
                  </p>
                )}
              </div>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <p className="text-muted-foreground">Select a contact to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <Suspense fallback={<BoxLoader />}>
          <MessagesContent />
        </Suspense>
      </main>
    </div>
  )
}
