import { Suspense } from 'react';
import { HomeHub } from '@/components/dashboard/HomeHub';
import { ProductTour } from '@/components/navigation/ProductTour';

export default function Home() {
  return (
    <>
      <ProductTour />
      <Suspense fallback={null}>
        <HomeHub />
      </Suspense>
    </>
  );
}
