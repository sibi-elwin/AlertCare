"use client";

import { useState } from "react";
import { MessageSquare, Send, X, FileText, MessageCircle, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doctorDashboardAPI } from "@/lib/api-client";

export function SendMessageDialog({ patient, doctorId, open, onClose, onSuccess }) {
  const [messageType, setMessageType] = useState('guidance'); // 'guidance', 'prescription', 'comment'
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      // Map message type to priority if needed
      let finalPriority = priority;
      if (messageType === 'prescription') {
        finalPriority = 'high'; // Prescriptions are typically high priority
      }
      
      const response = await doctorDashboardAPI.sendGuidance(
        doctorId,
        patient.id,
        message.trim(),
        finalPriority
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to send message');
      }
      
      // Reset form
      setMessage('');
      setMessageType('guidance');
      setPriority('normal');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.message || 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Send Guidance to Patient
          </DialogTitle>
          <DialogDescription>
            Send a prescription, guidance, or comment to {patient?.name || 'patient'}. 
            They will see it in their dashboard notifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="messageType">Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger id="messageType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guidance">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Guidance
                  </div>
                </SelectItem>
                <SelectItem value="prescription">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Prescription
                  </div>
                </SelectItem>
                <SelectItem value="comment">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Comment
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              {messageType === 'prescription' ? 'Prescription Details' : 
               messageType === 'comment' ? 'Comment' : 
               'Guidance Message'}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                messageType === 'prescription' 
                  ? 'Enter prescription details, dosage, instructions...' :
                messageType === 'comment'
                  ? 'Enter your comment or note...'
                  : 'Enter guidance or instructions for the patient...'
              }
              rows={6}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {sending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
