// src/components/common/CalendarView.tsx
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarView: React.FC = () => {
  const [events] = useState([
    { title: 'Design review', date: '2025-04-21', time: '10AM' },
    { title: 'Sales meeting', date: '2025-04-21', time: '2PM' },
    { title: "Sam's birthday party", date: '2025-04-22', time: '2PM' },
    { title: 'Cinema with friends', date: '2025-04-28', time: '9PM' },
  ]);

  return (
    <div className="w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-6xl mx-auto p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow-md mt-4 sm:mt-2 md:mt-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-2 md:mb-2 gap-2 sm:gap-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700">
          Month view
        </h2>
        <button className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg text-sm sm:text-base md:text-lg">
          Add event
        </button>
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        events={events.map((e) => ({
          title: `${e.title} ${e.time}`,
          date: e.date,
        }))}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth',
        }}
        eventContent={({ event }: { event: any }) => (
          <div className="text-xs sm:text-sm md:text-base p-1">
            {event.title}
          </div>
        )}
      />
    </div>
  );
};

export default CalendarView;