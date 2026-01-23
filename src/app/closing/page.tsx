import ClosingContent from './_components/ClosingContent';

export const dynamic = 'force-dynamic';

export default function ClosingPage() {
  return (
    <div className="px-12 py-8 animate-slide-in-left">
      <ClosingContent />
    </div>
  );
}
