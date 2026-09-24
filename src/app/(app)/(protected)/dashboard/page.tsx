import { HomeHub } from '@/components/dashboard/HomeHub';
import { ExamSetupModal } from '@/components/dashboard/ExamSetupModal';
import { ProductTour } from '@/components/navigation/ProductTour';

export default function Home() {
  return (
    <>
      <ProductTour />
      <HomeHub />
      <ExamSetupModal />
    </>
  );
}
