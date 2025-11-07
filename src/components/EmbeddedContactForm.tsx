import { useState } from "react"
import { Button } from "@components/ui/button.tsx"
import { Input } from "@components/ui/input.tsx"
import { Label } from "@components/ui/label.tsx"
import { Textarea } from "@components/ui/textarea.tsx"
import { ChevronRightIcon } from "lucide-react"

export interface EmbeddedContactFormProps {
  usePlaceholders?: boolean
}

export function EmbeddedContactForm({ usePlaceholders = false }: EmbeddedContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Message sent successfully! You will receive a confirmation email shortly.')
        setFormData({ name: "", email: "", message: "" })
      } else {
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      alert('An error occurred. Please try again later.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className={usePlaceholders ? "space-y-3" : "space-y-2"}>
        {!usePlaceholders && (
          <Label htmlFor="embedded-name" className="text-sm font-medium">Name</Label>
        )}
        <Input
          id="embedded-name"
          placeholder={usePlaceholders ? "Name" : undefined}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full"
          required
        />
      </div>
      <div className={usePlaceholders ? "space-y-3" : "space-y-2"}>
        {!usePlaceholders && (
          <Label htmlFor="embedded-email" className="text-sm font-medium">Email</Label>
        )}
        <Input
          id="embedded-email"
          type="email"
          placeholder={usePlaceholders ? "Email" : undefined}
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full"
          required
        />
      </div>
      <div className={usePlaceholders ? "space-y-3" : "space-y-2"}>
        {!usePlaceholders && (
          <Label htmlFor="embedded-message" className="text-sm font-medium">Message</Label>
        )}
        <Textarea
          id="embedded-message"
          placeholder={usePlaceholders ? "Message" : undefined}
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          className="w-full min-h-[100px]"
          required
        />
      </div>
      <Button type="submit" variant="outline" className="w-full flex flex-row justify-center items-center gap-2">
        Get In Touch<ChevronRightIcon className="w-4 h-4" />
      </Button>
    </form>
  )
}
