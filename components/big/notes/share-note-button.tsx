'use client';

import { useState } from 'react';
import { Share2, Link2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ShareNoteButtonProps {
  noteId: number;
  noteTitle: string;
  initialShareToken?: string | null;
  apiKey: string;
  isEncrypted?: boolean;
  variant?: 'icon' | 'button';
  className?: string;
  onShareTokenChange?: (token: string | null) => void;
}

export default function ShareNoteButton({
  noteId,
  noteTitle,
  initialShareToken,
  apiKey,
  isEncrypted = false,
  variant = 'icon',
  className = ''
}: ShareNoteButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl =
    shareToken && typeof window !== 'undefined' ? `${window.location.origin}/shared/note/${shareToken}` : '';

  const handleGenerateToken = async () => {
    if (isEncrypted) {
      toast.error('Encrypted notes cannot be shared');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/note/share', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ noteId, action: 'generate' })
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareToken(data.shareToken);
      toast.success('Share link generated!');
    } catch (error) {
      console.error('Error generating share token:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveToken = async () => {
    setIsRemoving(true);
    try {
      const response = await fetch('/api/note/share', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ noteId, action: 'remove' })
      });

      if (!response.ok) {
        throw new Error('Failed to remove share link');
      }

      setShareToken(null);
      setIsDialogOpen(false);
      toast.success('Share link removed');
    } catch (error) {
      console.error('Error removing share token:', error);
      toast.error('Failed to remove share link');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleOpenDialog = () => {
    if (isEncrypted) {
      toast.error('Encrypted notes cannot be shared');
      return;
    }
    setIsDialogOpen(true);
  };

  return (
    <>
      {variant === 'icon' ? (
        <div title={isEncrypted ? 'Encrypted notes cannot be shared' : 'Share note'}>
          <Share2
            className={`w-4 h-4 cursor-pointer ${isEncrypted ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            onClick={handleOpenDialog}
          />
        </div>
      ) : (
        <Button variant="outline" size="icon" onClick={handleOpenDialog} disabled={isEncrypted} className={className}>
          <Share2 className="w-4 h-4" />
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent maxHeight={shareToken ? "max-h-75" : "max-h-70"} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Note</DialogTitle>
            <DialogDescription>
              {shareToken ? 'Anyone with this link can view this note.' : `Create a shareable link for "${noteTitle}"`}
            </DialogDescription>
          </DialogHeader>

          {shareToken ? (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button size="icon" variant="outline" onClick={handleCopyLink} title="Copy to clipboard">
                    {isCopied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">Link is active and public</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a public link that anyone can use to view this note. You can remove the link at any time.
              </p>
            </div>
          )}

          <DialogFooter className="sm:justify-start flex-col md:flex-row">
            {shareToken ? (
              <Button variant="destructive" size="sm" onClick={handleRemoveToken} disabled={isRemoving}>
                <X className="w-4 h-4 mr-2" />
                Remove Link
              </Button>
            ) : (
              <Button onClick={handleGenerateToken} disabled={isGenerating} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Share Link'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
