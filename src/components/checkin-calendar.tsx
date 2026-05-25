"use client";

type CheckInCalendarProps = {
  checkIns: Array<{
    id: string;
    checkInDate: Date;
    points: number;
    continuousDays: number;
  }>;
};

export function CheckInCalendar({ checkIns }: CheckInCalendarProps) {
  const today = new Date();
  const daysToShow = 30;
  const days: Array<{ date: Date; hasCheckIn: boolean; points: number }> = [];

  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const checkIn = checkIns.find((c) => {
      const checkInDate = new Date(c.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === date.getTime();
    });

    days.push({
      date,
      hasCheckIn: !!checkIn,
      points: checkIn?.points ?? 0
    });
  }

  return (
    <div className="checkin-calendar">
      <h3>签到日历（最近30天）</h3>
      <div className="calendar-grid">
        {days.map((day, index) => {
          const isToday = day.date.toDateString() === today.toDateString();
          return (
            <div
              key={index}
              className={`calendar-day ${day.hasCheckIn ? "checked" : ""} ${isToday ? "today" : ""}`}
              title={`${day.date.getMonth() + 1}/${day.date.getDate()}${day.hasCheckIn ? ` +${day.points}分` : ""}`}
            >
              <span className="day-number">{day.date.getDate()}</span>
            </div>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span className="legend-item">
          <span className="legend-dot checked"></span>
          已签到
        </span>
        <span className="legend-item">
          <span className="legend-dot"></span>
          未签到
        </span>
      </div>
    </div>
  );
}
