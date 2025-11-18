import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function AccordionDemo() {
  return (
    <Accordion
      type='single'
      collapsible
      className='w-full'
      //   defaultValue='item-1'
    >
      <AccordionItem value='item-1'>
        <AccordionTrigger>알림</AccordionTrigger>
        <AccordionContent className='flex flex-col gap-4 text-balance'>
          <p>You have 3 new notifications.</p>
          <p>Your order #1234 has been shipped.</p>
          <p>Your password was changed successfully.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='item-2'>
        <AccordionTrigger>재고</AccordionTrigger>
        <AccordionContent className='flex flex-col gap-4 text-balance'>
          {/* <p></p>  재고몇개만 밑에 예제로 3개만 써줘 */}
          <p>Tomatoes: 50 units</p>
          <p>Cheese: 20 units</p>
          <p>Lettuce: 35 units</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value='item-3'>
        <AccordionTrigger>Return Policy</AccordionTrigger>
        <AccordionContent className='flex flex-col gap-4 text-balance'>
          <p>
            We stand behind our products with a comprehensive 30-day return
            policy. If you&apos;re not completely satisfied, simply return the
            item in its original condition.
          </p>
          <p>
            Our hassle-free return process includes free return shipping and
            full refunds processed within 48 hours of receiving the returned
            item.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
