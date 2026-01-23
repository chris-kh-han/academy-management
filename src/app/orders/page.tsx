import OrdersContent from './_components/OrdersContent';

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
  return (
    <div className="px-12 py-8 animate-slide-in-left">
      <OrdersContent />
    </div>
  );
}
