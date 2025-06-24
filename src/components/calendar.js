import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getYear, setMonth, setYear, startOfWeek, endOfWeek } from 'date-fns';

const Calendar = () => {
  // Load currentDate from localStorage if available
  const [currentDate, setCurrentDate] = useState(() => {
    const savedDate = localStorage.getItem('currentDate');
    return savedDate ? new Date(savedDate) : new Date();
  });
  
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    color: '#3b82f6',
    email: '',
    pinned: false
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [searchedDate, setSearchedDate] = useState(null);

  // Save currentDate to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('currentDate', currentDate.toISOString());
  }, [currentDate]);

  // Load events from localStorage when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const storedEvents = localStorage.getItem(`events_${currentUser}`);
      setEvents(storedEvents ? JSON.parse(storedEvents) : []);
    }
  }, [currentUser]);

  // Save events to localStorage when events or currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`events_${currentUser}`, JSON.stringify(events));
    }
  }, [events, currentUser]);

  // Calendar grid calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDate = (date) => {
    return events.filter(event => {
      try {
        const [day, month, year] = event.date.split('-');
        const eventDate = new Date(`${year}-${month}-${day}`);
        return isSameDay(eventDate, date) && event.email === currentUser;
      } catch (e) {
        console.error('Error parsing event date:', e);
        return false;
      }
    });
  };

  const getMyEvents = () => {
    return events
      .filter(event => event.email === currentUser)
      .sort((a, b) => {
        try {
          const [aDay, aMonth, aYear] = a.date.split('-');
          const aDate = new Date(`${aYear}-${aMonth}-${aDay}`);
          
          const [bDay, bMonth, bYear] = b.date.split('-');
          const bDate = new Date(`${bYear}-${bMonth}-${bDay}`);
          
          return aDate - bDate;
        } catch (e) {
          console.error('Error sorting events:', e);
          return 0;
        }
      });
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSearchedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSearchedDate(null);
  };

  const handleMonthChange = (e) => {
    setCurrentDate(setMonth(currentDate, parseInt(e.target.value)));
    setSearchedDate(null);
  };

  const handleYearChange = (e) => {
    setCurrentDate(setYear(currentDate, parseInt(e.target.value)));
    setSearchedDate(null);
  };

  const handleSearchDate = () => {
    if (searchDate) {
      try {
        const parsedDate = new Date(searchDate);
        if (!isNaN(parsedDate.getTime())) {
          setCurrentDate(parsedDate);
          setSelectedDate(parsedDate);
          setSearchedDate(parsedDate);
          setSearchDate('');
        } else {
          alert('Please enter a valid date');
        }
      } catch (e) {
        alert('Please enter a valid date');
      }
    } else {
      setSearchedDate(null);
    }
  };

  const handleDateClick = (day) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setSelectedDate(day);
    setNewEvent(prev => ({
      ...prev,
      date: format(day, 'dd-MM-yyyy'),
      email: currentUser
    }));
    setShowEventModal(true);
  };

  const handleEventClick = (event) => {
    try {
      const [day, month, year] = event.date.split('-');
      const eventDate = new Date(`${year}-${month}-${day}`);
      setCurrentDate(eventDate);
      setSearchedDate(eventDate);
      setShowSidebar(false); // Close sidebar on mobile
    } catch (e) {
      console.error('Error navigating to event date:', e);
    }
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const addEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return;
    setEvents([...events, { ...newEvent, email: currentUser, pinned: false }]);
    setShowEventModal(false);
    setNewEvent({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      color: '#3b82f6',
      email: currentUser,
      pinned: false
    });
  };

  const togglePinEvent = (index) => {
    setEvents(prevEvents => 
      prevEvents.map((event, i) => 
        i === index ? { ...event, pinned: !event.pinned } : event
      )
    );
  };

  const deleteEvent = (index) => {
    setEvents(prevEvents => prevEvents.filter((_, i) => i !== index));
  };

  const checkEventOverlap = (date) => {
    return getEventsForDate(date).length >= 2;
  };

  const generateYears = () => {
    const currentYear = getYear(new Date());
    return Array.from({ length: 51 }, (_, i) => currentYear - 25 + i);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleAuth = () => {
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setCurrentUser(userEmail);
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setEvents([]);
    setShowAuthModal(true);
    setShowProfilePopup(false);
    setShowSidebar(false);
  };

  const getUserName = () => currentUser ? currentUser.split('@')[0] : '';
  const getUserInitial = () => currentUser ? currentUser.charAt(0).toUpperCase() : '';

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {authMode === 'signin' ? 'Need to sign up?' : 'Already have an account?'}
                </button>
                <button
                  onClick={handleAuth}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
                >
                  {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-1 ${showAuthModal ? 'blur-sm' : ''}`}>
        {/* Sidebar */}
        {currentUser && (
          <div
            className={`fixed md:static inset-y-0 left-0 w-64 bg-white z-40 transform ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0 transition-transform duration-300 md:w-80 p-4 overflow-y-auto`}
          >
            <div className="mb-6">
              <div
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
                onClick={() => setShowProfilePopup(!showProfilePopup)}
              >
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {getUserInitial()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-base">{getUserName()}</p>
                  <p className="text-sm text-gray-500 truncate">{currentUser}</p>
                </div>
              </div>
              {showProfilePopup && (
                <div className="absolute top-20 left-4 bg-white rounded-lg shadow-xl p-4 w-56 z-50 border border-gray-100">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">My Events</h3>
              {getMyEvents().length > 0 ? (
                <div className="space-y-3 max-h-[calc(100vh-200px)]Nik overflow-y-auto">
                  {getMyEvents().map((event, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
                      style={{ borderLeftColor: event.color }}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium text-sm text-gray-900 ${event.pinned ? 'font-bold' : ''}`}>
                            {event.pinned && (
                              <svg className="inline w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 3a1 1 0 011-1h4a1 1 0 011 1v1h3a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V3zm2 2v2h2V5H9z" />
                              </svg>
                            )}
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(
                              new Date(event.date.split('-').reverse().join('-')),
                              'MMM d, yyyy'
                            )} • {event.startTime} - {event.endTime}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinEvent(index);
                            }}
                            className="text-sm text-gray-500 hover:text-yellow-500"
                            title={event.pinned ? 'Unpin' : 'Pin'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 3a1 1 0 011-1h4a1 1 0 011 1v1h3a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V3zm2 2v2h2V5H9z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEvent(index);
                            }}
                            className="text-sm text-gray-500 hover:text-red-500"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v10a2 2 0 002 2h8a2 2 0 002-2V6h1a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 4a1 1 0 011-1h2a1 1 0 011 1v8a1 1 0 01-1 1H9a1 1 0 01-1-1V6z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No events scheduled</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
          {/* Mobile Menu Button */}
          {currentUser && (
            <button
              className="md:hidden fixed top-4 right-4 z-50 p-3 bg-white rounded-full shadow-md"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSidebar ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 md:p-6 bg-white shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4 sm:mb-0">CALENDAR</h1>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
              <button
                onClick={handleSearchDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
              >
                Go
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg m-4 md:m-6 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 bg-blue-600 text-white">
              <button
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-blue-700 transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <select
                  value={getYear(currentDate)}
                  onChange={handleYearChange}
                  className="bg-blue-600 text-white border-none rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-300"
                >
                  {generateYears().map(year => (
                    <option key={year} value={year} className="bg-white text-gray-900">
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={currentDate.getMonth()}
                  onChange={handleMonthChange}
                  className="bg-blue-600 text-white border-none rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-300"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index} className="bg-white text-gray-900">
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-blue-700 transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-gray-100 py-3 text-center font-semibold text-gray-600 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 h-[calc(100%-80px)]">
              {allDays.map((day, i) => {
                const dayEvents = getEventsForDate(day);
                const hasOverlap = checkEventOverlap(day);
                const isCurrentDay = isSameDay(day, new Date());
                const isSearchedDate = searchedDate && isSameDay(day, searchedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);

                return (
                  <div
                    key={i}
                    onClick={() => handleDateClick(day)}
                    className={`flex flex-col h-full p-2 bg-white hover:bg-gray-50 cursor-pointer transition-all ${
                      isCurrentDay ? 'bg-blue-50' : ''
                    } ${isSearchedDate ? 'ring-2 ring-blue-500' : ''} ${
                      !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                        isCurrentDay ? 'bg-blue-600 text-white' : ''
                      } ${isSearchedDate ? 'bg-green-500 text-white' : ''} ${
                        !isCurrentMonth ? 'text-gray-400' : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="mt-2 space-y-1 flex-1 overflow-y-auto text-xs">
                      {dayEvents.map((event, index) => (
                        <div
                          key={index}
                          className="p-1 rounded truncate flex items-center justify-between"
                          style={{
                            backgroundColor: `${event.color}20`,
                            borderLeft: `3px solid ${event.color}`,
                            opacity: isCurrentMonth ? 1 : 0.5
                          }}
                        >
                          <span className={event.pinned ? 'font-bold' : ''}>
                            {event.pinned && (
                              <svg className="inline w-3 h-3 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 3a1 1 0 011-1h4a1 1 0 011 1v1h3a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V3zm2 2v2h2V5H9z" />
                              </svg>
                            )}
                            {event.title}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinEvent(events.findIndex(e => e === event));
                              }}
                              className="text-gray-500 hover:text-yellow-500"
                              title={event.pinned ? 'Unpin' : 'Pin'}
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 3a1 1 0 011-1h4a1 1 0 011 1v1h3a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V3zm2 2v2h2V5H9z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEvent(events.findIndex(e => e === event));
                              }}
                              className="text-gray-500 hover:text-red-500"
                              title="Delete"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6 2a1 1 0 00-1 1v1H3a1 1 0 000 2h1v10a2 2 0 002 2h8a2 2 0 002-2V6h1a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 4a1 1 0 011-1h2a1 1 0 011 1v8a1 1 0 01-1 1H9a1 1 0 01-1-1V6z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      {hasOverlap && (
                        <div className={`font-medium ${isCurrentMonth ? 'text-red-500' : 'text-red-300'}`}>
                          Overlapping events
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedDate ? `Add Event - ${format(selectedDate, 'MMM d, yyyy')}` : 'Add Event'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleEventChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  placeholder="Event title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newEvent.date ? format(new Date(newEvent.date.split('-').reverse().join('-')), 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? format(new Date(e.target.value), 'dd-MM-yyyy') : '';
                    setNewEvent(prev => ({ ...prev, date }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={newEvent.startTime}
                    onChange={handleEventChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={newEvent.endTime}
                    onChange={handleEventChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="color"
                  name="color"
                  value={newEvent.color}
                  onChange={handleEventChange}
                  className="h-10 w-10 cursor-pointer rounded"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setNewEvent({
                      title: '',
                      date: '',
                      startTime: '',
                      endTime: '',
                      color: '#3b82f6',
                      email: currentUser,
                      pinned: false
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;