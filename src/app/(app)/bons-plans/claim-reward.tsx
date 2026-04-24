"use client";

import { Check, Wallet } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import { claimRewardAction } from "@/features/referrals/actions";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClaimRewardDialogProps {
  rewardId: string;
}

export function ClaimRewardDialog({ rewardId }: ClaimRewardDialogProps) {
  const [open, setOpen] = useState(false);
  const action = claimRewardAction.bind(null, rewardId);
  const [state, formAction, pending] = useActionState(action, { ok: false });

  if (state.ok && open) {
    toast.success(state.message ?? "Demande envoyée");
    setTimeout(() => setOpen(false), 800);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wallet className="h-4 w-4" /> Récupérer mes gains
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Récupérer vos gains</DialogTitle>
          <DialogDescription>
            Indiquez votre IBAN pour recevoir votre virement sous 5 jours
            ouvrés.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              name="iban"
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              required
            />
          </div>
          {state.message && !state.ok ? (
            <p role="alert" className="text-xs text-danger">
              {state.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              <Check className="h-4 w-4" />{" "}
              {pending ? "Envoi…" : "Valider la demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
