import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';

export default function CalendarComponent() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  console.log(date);

  return (
    <Calendar
      mode='single'
      selected={date}
      onSelect={setDate}
      className='rounded-lg border ml-12'
    />
  );
}
