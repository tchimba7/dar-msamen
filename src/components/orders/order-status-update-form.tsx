"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  getAllowedNextOrderStatuses,
  getOrderStatusLabel,
  type OrderStatus,
} from "@/lib/order-status";
import type { Locale } from "@/lib/i18n";

type OrderStatusUpdateFormProps = {
  locale: Locale;
  orderId: string;
  currentStatus: string;
  action: (formData: FormData) => void | Promise<void>;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
    >
      Confirmer / Mettre a jour
    </button>
  );
}

export function OrderStatusUpdateForm({
  locale,
  orderId,
  currentStatus,
  action,
}: OrderStatusUpdateFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const options = useMemo(() => {
    const list = [currentStatus, ...getAllowedNextOrderStatuses(currentStatus)];
    return Array.from(new Set(list));
  }, [currentStatus]);

  const isUnchanged = selectedStatus === currentStatus;

  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="status"
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value)}
        className="rounded-md border border-amber-300 px-3 py-1.5 text-xs"
      >
        {options.map((statusOption) => (
          <option key={statusOption} value={statusOption}>
            {getOrderStatusLabel(statusOption as OrderStatus, locale)}
          </option>
        ))}
      </select>
      <SubmitButton disabled={isUnchanged} />
    </form>
  );
}
