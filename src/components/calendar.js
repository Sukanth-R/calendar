import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getYear, setMonth, setYear, startOfWeek, endOfWeek, isAfter, isBefore } from 'date-fns';

const Calendar = () => {
  // Color options for events
  const colorOptions = [
    { name: 'Green', value: '#10b981', gradient: 'from-green-400 to-teal-600' },
    { name: 'Purple', value: '#8b5cf6', gradient: 'from-purple-400 to-purple-600' },
    { name: 'Pink', value: '#ec4899', gradient: 'from-pink-400 to-pink-600' },
    { name: 'Orange', value: '#f97316', gradient: 'from-orange-400 to-orange-600' },
    { name: 'Teal', value: '#14b8a6', gradient: 'from-teal-400 to-teal-600' },
    { name: 'Yellow', value: '#eab308', gradient: 'from-yellow-400 to-yellow-600' }
  ];

  // State for current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load currentDate from localStorage
  const [currentDate, setCurrentDate] = useState(() => {
    const savedDate = localStorage.getItem('currentDate');
    return savedDate ? new Date(savedDate) : new Date();
  });
  
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventsDisplayModal, setShowEventsDisplayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    color: colorOptions[0].value,
    gradient: colorOptions[0].gradient,
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
  const [eventFilter, setEventFilter] = useState('all');

  // Save currentDate to localStorage
  useEffect(() => {
    localStorage.setItem('currentDate', currentDate.toISOString());
  }, [currentDate]);

  // Load events from localStorage
  useEffect(() => {
    if (currentUser) {
      const storedEvents = localStorage.getItem(`events_${currentUser}`);
      setEvents(storedEvents ? JSON.parse(storedEvents) : []);
    }
  }, [currentUser]);

  // Save events to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`events_${currentUser}`, JSON.stringify(events));
    }
  }, [events, currentUser]);

  // Calendar grid calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = () => endOfWeek(monthEnd, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd() });

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
      .filter(event => {
        try {
          const [day, month, year] = event.date.split('-');
          const eventDate = new Date(`${year}-${month}-${day} ${event.startTime}`);
          const now = currentTime;
          if (eventFilter === 'upcoming') {
            return isAfter(eventDate, now) || isSameDay(eventDate, now);
          } else if (eventFilter === 'completed') {
            return isBefore(eventDate, now) && !isSameDay(eventDate, now);
          }
          return true; // 'all'
        } catch (e) {
          console.error('Error filtering event:', e);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const [aDay, aMonth, aYear] = a.date.split('-');
          const aDate = new Date(`${aYear}-${aMonth}-${aDay} ${a.startTime}`);
          
          const [bDay, bMonth, bYear] = b.date.split('-');
          const bDate = new Date(`${bYear}-${bMonth}-${bDay} ${b.startTime}`);
          
          return aDate - bDate;
        } catch (e) {
          console.error('Error sorting events:', e);
          return 0;
        }
      });
  };

  const getNextEvent = () => {
    const now = currentTime;
    const upcomingEvents = events
      .filter(event => event.email === currentUser)
      .map(event => {
        try {
          const [day, month, year] = event.date.split('-');
          const eventDate = new Date(`${year}-${month}-${day} ${event.startTime}`);
          return { ...event, eventDate };
        } catch (e) {
          console.error('Error parsing event date:', e);
          return null;
        }
      })
      .filter(event => event && isAfter(event.eventDate, now))
      .sort((a, b) => a.eventDate - b.eventDate);
    
    return upcomingEvents[0] || null;
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
        const [year, month, day] = searchDate.split('-'); // yyyy-mm-dd from date picker
        const parsedDate = new Date(year, month - 1, day);
        if (isNaN(parsedDate.getTime())) {
          alert('Please select a valid date');
          return;
        }
        setCurrentDate(parsedDate);
        setSelectedDate(parsedDate);
        setSearchedDate(parsedDate);
        setSearchDate('');
      } catch (e) {
        alert('Error parsing date');
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
    setShowEventsDisplayModal(true);
  };

  const handleEventClick = (event) => {
    try {
      const [day, month, year] = event.date.split('-');
      const date = new Date(year, month - 1, day);
      setCurrentDate(date);
      setSearchedDate(date);
      setShowSidebar(false);
    } catch (e) {
      console.error('Error navigating date:', e);
    }
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (colorObj) => {
    setNewEvent(prev => ({ 
      ...prev, 
      color: colorObj.value,
      gradient: colorObj.gradient
    }));
  };

  const addEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return;
    
    const formattedDate = newEvent.date || format(selectedDate, 'dd-MM-yyyy');
    
    setEvents([...events, { 
      ...newEvent, 
      date: formattedDate,
      email: currentUser, 
      pinned: false 
    }]);
    
    setShowEventModal(false);
    setNewEvent({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      color: colorOptions[0].value,
      gradient: colorOptions[0].gradient,
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
    setEvents(prevEvents => prevEvents.filter((event, i) => i !== index));
  };

  const checkEventOverlap = (date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length < 2) return false;
    return dayEvents.length >= 2;
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
    <div className="w-screen min-h-screen flex flex-col bg-gray-100">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-sm text-green-600 hover:underline"
                >
                  {authMode === 'signin' ? 'Need to sign up?' : 'Already have an account?'}
                </button>
                <button
                  onClick={handleAuth}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all text-sm shadow-md"
                >
                  {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex flex-1 ${showAuthModal ? 'blur-sm' : ''} overflow-hidden`}>
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
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">My Events</h3>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="bg-gray-100 border-none rounded-lg px-2 py-1 text-sm text-gray-700 focus:ring-2 focus:ring-green-500 cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {getMyEvents().length > 0 ? (
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {getMyEvents().map((event, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 bg-gradient-to-r ${event.gradient.replace('from', 'from-opacity-20').replace('to', 'to-opacity-20')} hover:opacity-90 transition-all cursor-pointer`}
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
                              togglePinEvent(events.findIndex(e => e === event));
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
                              deleteEvent(events.findIndex(e => e === event));
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
              className="md:hidden fixed top-4 right-4 z-50 p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-full shadow-md text-white"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSidebar ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 md:p-6 bg-white shadow-sm">
            <div className="flex flex-col w-full">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-700 bg-clip-text text-transparent">
                  CALENDAR
                </h1>
                <div className="text-sm md:text-base font-medium text-gray-600">
                  {format(currentTime, 'HH:mm:ss')} {format(currentTime, 'z')}
                </div>
              </div>
              <marquee className="mt-2 text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                {getNextEvent() ? (
                  `Next Event: ${getNextEvent().title} on ${format(new Date(getNextEvent().date.split('-').reverse().join('-')), 'MMM d, yyyy')} at ${getNextEvent().startTime}`
                ) : (
                  'No upcoming events'
                )}
              </marquee>
            </div>
            <div className="flex items-top space-x-3 mt-4 sm:mt-0">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
              />
              <button
                onClick={handleSearchDate}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all text-sm shadow-md"
              >
                Go
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg m-4 md:m-6 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-teal-700 text-white">
              <button
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-green-700/30 transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <select
                    value={getYear(currentDate)}
                    onChange={handleYearChange}
                    className="appearance-none bg-gradient-to-r from-green-600 to-teal-700 text-white border-none rounded-lg px-4 py-2 text-base font-medium focus:ring-2 focus:ring-green-300 shadow-md hover:bg-green-700/80 transition-all cursor-pointer pr-8"
                  >
                    {generateYears().map(year => (
                      <option key={year} value={year} className="bg-white text-gray-900">
                        {year}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="relative">
                  <select
                    value={currentDate.getMonth()}
                    onChange={handleMonthChange}
                    className="appearance-none bg-gradient-to-r from-green-600 to-teal-700 text-white border-none rounded-lg px-4 py-2 text-base font-medium focus:ring-2 focus:ring-green-300 shadow-md hover:bg-green-700/80 transition-all cursor-pointer pr-8"
                  >
                    {months.map((month, index) => (
                      <option key={month} value={index} className="bg-white text-gray-900">
                        {month}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-green-700/30 transition-all"
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
<div className="grid grid-cols-7 grid-rows-6 gap-px bg-gray-200" style={{ height: 'calc(100% - 80px)' }}>
  {allDays.map((day, i) => {
    const dayEvents = getEventsForDate(day);
    const isCurrentDay = isSameDay(day, new Date());
    const isSearchedDate = searchedDate && isSameDay(day, searchedDate);
    const isCurrentMonth = isSameMonth(day, currentDate);

    return (
      <div
        key={i}
        onClick={() => handleDateClick(day)}
        className={`flex flex-col h-full p-1 bg-white hover:bg-gray-50 cursor-pointer transition-all ${
          isCurrentDay ? 'bg-green-50' : ''
        } ${isSearchedDate ? 'ring-2 ring-green-500' : ''} ${
          !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
        }`}
        style={{ minHeight: 0, height: '100%' }}
      >
        <div
          className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${
            isCurrentDay ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md' : ''
          } ${isSearchedDate ? 'bg-gradient-to-r from-teal-500 to-green-600 text-white shadow-md' : ''} ${
            !isCurrentMonth ? 'text-gray-400' : ''
          }`}
        >
          {format(day, 'd')}
        </div>
        {/* Fixed height for event list, so all cells are equal */}
        <div className="flex flex-col flex-shrink-0" style={{ height: '38px', overflow: 'hidden' }}>
          {dayEvents.slice(0, 3).map((event, index) => (
            <div
              key={index}
              className={`p-0.5 rounded truncate flex items-center justify-between bg-gradient-to-r ${event.gradient.replace('from', 'from-opacity-20').replace('to', 'to-opacity-20')}`}
              style={{
                borderLeft: `2px solid ${event.color}`,
                fontSize: '10px',
                lineHeight: '12px',
                marginBottom: '1px',
                opacity: isCurrentMonth ? 1 : 0.5
              }}
            >
              <span className={event.pinned ? 'font-bold' : ''}>
                {event.pinned && (
                  <svg className="inline w-2 h-2 mr-0.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 011-1h4a1 1 0 011 1v1h3a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V3zm2 2v2h2V5H9z" />
                  </svg>
                )}
                {event.title}
              </span>
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-[10px] text-gray-500 font-medium">
              +{dayEvents.length - 3} more
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

      {/* Events Display Modal */}
      {showEventsDisplayModal && selectedDate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Events on {format(selectedDate, 'MMM d, yyyy')}
            </h3>
            <div className="space-y-4">
              {getEventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {getEventsForDate(selectedDate).map((event, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 bg-gradient-to-r ${event.gradient.replace('from', 'from-opacity-20').replace('to', 'to-opacity-20')}`}
                      style={{ borderLeftColor: event.color }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium text-sm ${event.pinned ? 'font-bold' : ''}`}>
                            {event.pinned && (
                              <svg className="inline w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 3a1 1 0 011-1h4a1 1 0 011 1v1h3a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V3zm2 2v2h2V5H9z" />
                            </svg>
                            )}
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.startTime} - {event.endTime}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => togglePinEvent(events.findIndex(e => e === event))}
                            className="text-sm text-gray-500 hover:text-yellow-500"
                            title={event.pinned ? 'Unpin' : 'Pin'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 3a1 1 0 011-1h4a1 1 0 011 1v1h3a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V3zm2 2v2h2V5H9z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteEvent(events.findIndex(e => e === event))}
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
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => {
                    setNewEvent({
                      title: '',
                      date: format(selectedDate, 'dd-MM-yyyy'),
                      startTime: '',
                      endTime: '',
                      color: colorOptions[0].value,
                      gradient: colorOptions[0].gradient,
                      email: currentUser,
                      pinned: false
                    });
                    setShowEventsDisplayModal(false);
                    setShowEventModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all text-sm shadow-md"
                >
                  Add Event
                </button>
                <button
                  onClick={() => setShowEventsDisplayModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                  placeholder="Event title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="text"
                  name="date"
                  value={newEvent.date || format(selectedDate, 'dd-MM-yyyy')}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                  placeholder="dd-mm-yyyy"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex space-x-2">
                  {colorOptions.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorChange(color)}
                      className={`h-8 w-8 rounded-full ${newEvent.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
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
                      color: colorOptions[0].value,
                      gradient: colorOptions[0].gradient,
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
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all text-sm shadow-md"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-white text-center py-3 text-sm text-gray-900 shadow-inner mt-auto">
        Developed by <a href="https://sukanth-r.github.io/my-portfolio" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Sukanth R</a> &middot; &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Calendar;