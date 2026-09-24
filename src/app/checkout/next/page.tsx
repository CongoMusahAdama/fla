'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  clearMultiCheckoutQueue,
  getMultiCheckoutSteps,
} from '@/lib/cart-vendors';

function ContinueCheckout() {
  const searchParams = useSearchParams();
  const completedId =
    searchParams.get('reference') ||
    searchParams.get('trxref') ||
    searchParams.get('order_id');
  const [message, setMessage] = useState('Checking the rest of your checkout…');
  const [nextPayment, setNextPayment] = useState<{ vendorName: string; paymentLink: string } | null>(null);

  useEffect(() => {
    const steps = getMultiCheckoutSteps();
    if (!steps?.length) {
      setMessage('This checkout is already finished.');
      return;
    }

    if (!completedId) {
      const first = steps.find((step) => step.paymentLink);
      setMessage(
        first
          ? `You still need to pay ${steps.length} vendors. Continue with ${first.vendorName}.`
          : 'This checkout is already finished.',
      );
      setNextPayment(first ? { vendorName: first.vendorName, paymentLink: first.paymentLink } : null);
      return;
    }

    const currentIndex = steps.findIndex((step) => step.orderId === completedId);
    const next = currentIndex >= 0 ? steps[currentIndex + 1] : undefined;

    if (next?.paymentLink) {
      setMessage(`Payment received. Opening ${next.vendorName} next…`);
      window.location.replace(next.paymentLink);
      return;
    }

    if (currentIndex >= 0) {
      clearMultiCheckoutQueue();
      setMessage('Every vendor in your bag has been paid. Each one gets their own SMS.');
      return;
    }

    const first = steps.find((step) => step.paymentLink);
    setMessage('We could not match that payment. Continue with the next vendor still waiting.');
    setNextPayment(first ? { vendorName: first.vendorName, paymentLink: first.paymentLink } : null);
  }, [completedId]);

  const finished = message.startsWith('Every vendor');

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-lg font-semibold text-slate-900">{message}</p>
        {nextPayment && (
          <button
            type="button"
            onClick={() => window.location.assign(nextPayment.paymentLink)}
            className="inline-flex mt-6 h-11 px-5 items-center rounded-full bg-slate-900 text-white text-sm font-medium"
          >
            Pay {nextPayment.vendorName}
          </button>
        )}
        {finished && (
          <Link
            href="/shop"
            className="inline-flex mt-6 h-11 px-5 items-center rounded-full bg-slate-900 text-white text-sm font-medium"
          >
            Back to shop
          </Link>
        )}
      </div>
    </main>
  );
}

export default function CheckoutNextPage() {
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <ContinueCheckout />
    </Suspense>
  );
}
