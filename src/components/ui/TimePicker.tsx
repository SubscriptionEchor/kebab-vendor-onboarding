import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  className?: string;
}

const DEFAULT_TIME = '09:00';

export function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(() => {
    const defaultHour = DEFAULT_TIME.split(':')[0];
    if (!value) return defaultHour;
    const [hour = defaultHour] = value.split(':');
    return hour;
  });
  const [selectedMinute, setSelectedMinute] = useState(() => {
    const defaultMinute = DEFAULT_TIME.split(':')[1];
    if (!value) return defaultMinute;
    const [, minute = defaultMinute] = value.split(':');
    return minute;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Validate time format
  const formatTime = (timeStr: string): string => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr) ? timeStr : DEFAULT_TIME;
  };

  // Common business hours presets
  const commonTimes = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00', '00:00'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value) {
      setSelectedHour(DEFAULT_TIME.split(':')[0]);
      setSelectedMinute(DEFAULT_TIME.split(':')[1]);
      return;
    }
    const formattedTime = formatTime(value);
    const [hour, minute] = formattedTime.split(':');
    setSelectedHour(hour);
    setSelectedMinute(minute);
  }, [value]);

  const handleTimeSelect = (time: string) => {
    onChange(formatTime(time));
    setIsOpen(false);
  };

  const handleCustomTimeSelect = () => {
    const formattedHour = selectedHour.padStart(2, '0');
    const formattedMinute = selectedMinute.padStart(2, '0');
    onChange(formatTime(`${formattedHour}:${formattedMinute}`));
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${className}`}
      >
        <Clock className="w-4 h-4 text-gray-400" />
        <span>
          {(() => {
            if (!value) return 'Select time';
            const formattedTime = formatTime(value);
            const [hour, minute] = formattedTime.split(':');
            return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
          })()}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 w-64"
          >
            {/* Common Times */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Common Times</h3>
              <div className="grid grid-cols-3 gap-2">
                {commonTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeSelect(time)}
                    className={`px-2 py-1 text-sm rounded-md transition-colors ${
                      value === time
                        ? 'bg-brand-primary text-brand-secondary'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Time */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Custom Time</h3>
              <div className="flex gap-2 items-center">
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="p-1 rounded-md border border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                >
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="p-1 rounded-md border border-gray-300 focus:border-brand-primary focus:ring-brand-primary"
                >
                  {['00', '15', '30', '45'].map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCustomTimeSelect}
                  className="ml-2 px-3 py-1 text-sm bg-brand-primary text-brand-secondary rounded-md hover:bg-brand-primary/90"
                >
                  Set
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}