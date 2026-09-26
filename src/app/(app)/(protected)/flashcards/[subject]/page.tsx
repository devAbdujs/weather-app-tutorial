import React from 'react';
import { getServerSession } from '@/lib/session';
import { FlashcardDeck } from '@/components/flashcards/FlashcardDeck';
import { redirect } from 'next/navigation';

export default async function FlashcardsPage({ params }: { params: { subject: string } }) {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  const subject = decodeURIComponent(params.subject);

  return <FlashcardDeck subject={subject} />;
}
