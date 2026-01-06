import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex justify-center p-4'>
      <div className='w-full max-w-lg'>{children}</div>
      <ToastContainer position='bottom-right' theme='dark' />
    </div>
  );
}
