import { TimePicker } from '../../../../../components/ui/TimePicker';

interface OpeningHoursProps {
  schedule: Record<string, { isOpen: boolean; startTime: string; endTime: string }>;
  updateSchedule: (day: string, field: string, value: string | boolean) => void;
}

export function OpeningHours({ schedule, updateSchedule }: OpeningHoursProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Opening Hours
      </h2>
      <div className="space-y-4">
        {(Object.keys(schedule) as Array<keyof typeof schedule>).map((day) => (
          <div
            key={day}
            className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="w-28 font-medium capitalize">{day}</div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={schedule[day].isOpen}
                onChange={(e) =>
                  updateSchedule(day, "isOpen", e.target.checked)
                }
                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm">Open</span>
            </label>
            {schedule[day].isOpen && (
              <>
                <div className="flex items-center gap-2">
                  <TimePicker
                    value={schedule[day].startTime}
                    onChange={(time) =>
                      updateSchedule(day, "startTime", time)
                    }
                  />
                  <span>to</span>
                  <TimePicker
                    value={schedule[day].endTime}
                    onChange={(time) => updateSchedule(day, "endTime", time)}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}