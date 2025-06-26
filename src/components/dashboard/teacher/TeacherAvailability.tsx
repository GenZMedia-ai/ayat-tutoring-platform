
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useTeacherAvailability } from '@/hooks/useTeacherAvailability';
import { useServerDate } from '@/hooks/useServerDate';
import { Trash2, Lock } from 'lucide-react';

const TeacherAvailability: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { timeSlots, loading, toggleAvailability } = useTeacherAvailability(selectedDate);
  const { isDateToday, loading: dateLoading } = useServerDate();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  const isSelectedDateToday = isDateToday(selectedDate);

  const renderTimeSlotButton = (slot: { time: string; isAvailable: boolean; isBooked: boolean }) => {
    const isDisabled = loading || dateLoading;

    if (slot.isBooked) {
      return (
        <Button
          key={slot.time}
          size="sm"
          disabled
          className="bg-black text-white hover:bg-black cursor-not-allowed relative"
        >
          <Lock className={`w-3 h-3 text-red-500 absolute top-1 ${isRTL ? 'left-1' : 'right-1'}`} />
          {slot.time}
        </Button>
      );
    }

    if (slot.isAvailable) {
      return (
        <Button
          key={slot.time}
          size="sm"
          className="ayat-button-primary relative group"
          onClick={() => toggleAvailability(slot.time)}
          disabled={isDisabled}
        >
          <Trash2 className={`w-3 h-3 absolute top-1 ${isRTL ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity`} />
          {slot.time}
        </Button>
      );
    }

    return (
      <Button
        key={slot.time}
        size="sm"
        variant="outline"
        onClick={() => toggleAvailability(slot.time)}
        disabled={isDisabled}
      >
        {slot.time}
      </Button>
    );
  };

  return (
    <Card className="dashboard-card">
      <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
        <CardTitle>{t('availability.title')}</CardTitle>
        <CardDescription>
          {t('availability.description')}
          {isSelectedDateToday && (
            <span className="block text-green-600 font-medium mt-1">
              {t('availability.todayUnlocked')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className={`rounded-md border ${isRTL ? 'rtl' : ''}`}
              disabled={(date) => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return date < yesterday;
              }}
            />
            {isSelectedDateToday && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className={`text-sm text-green-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <strong>{t('availability.todayNote')}</strong>
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h4 className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('availability.timeSlotsFor')} {selectedDate?.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
            </h4>
            {loading || dateLoading ? (
              <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('availability.loading')}
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('availability.displayNote')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map(renderTimeSlotButton)}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('availability.legend')}
                  </h5>
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-4 h-4 bg-primary rounded"></div>
                      <span>{t('availability.available')}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                      <span>{t('availability.notAvailable')}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-4 h-4 bg-black rounded relative">
                        <Lock className={`w-2 h-2 text-red-500 absolute top-0.5 ${isRTL ? 'left-0.5' : 'right-0.5'}`} />
                      </div>
                      <span>{t('availability.booked')}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherAvailability;
