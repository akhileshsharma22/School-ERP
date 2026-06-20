import { useState, useMemo } from "react";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";

// Standard mock data for timetables across classes
const TIMETABLE_DATA = {
  "Class 5": {
    A: [
      { day: "Monday", period: 1, time: "08:30 AM - 09:30 AM", subject: "Mathematics", teacher: "Suresh Kumar", room: "Room 101" },
      { day: "Monday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Science", teacher: "Ritu Sharma", room: "Room 101" },
      { day: "Monday", period: 3, time: "11:00 AM - 12:00 PM", subject: "English", teacher: "Pooja Gupta", room: "Room 101" },
      { day: "Monday", period: 4, time: "12:00 PM - 01:00 PM", subject: "Social Studies", teacher: "Anil Joshi", room: "Room 101" },
      { day: "Monday", period: 5, time: "01:45 PM - 02:45 PM", subject: "Hindi", teacher: "Kamlesh Devi", room: "Room 101" },
      { day: "Monday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Art & Craft", teacher: "Neha Sen", room: "Art Studio" },

      { day: "Tuesday", period: 1, time: "08:30 AM - 09:30 AM", subject: "Science", teacher: "Ritu Sharma", room: "Room 101" },
      { day: "Tuesday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Mathematics", teacher: "Suresh Kumar", room: "Room 101" },
      { day: "Tuesday", period: 3, time: "11:00 AM - 12:00 PM", subject: "English", teacher: "Pooja Gupta", room: "Room 101" },
      { day: "Tuesday", period: 4, time: "12:00 PM - 01:00 PM", subject: "Computer Science", teacher: "Rajesh Malhotra", room: "Computer Lab" },
      { day: "Tuesday", period: 5, time: "01:45 PM - 02:45 PM", subject: "Physical Education", teacher: "Sandeep Singh", room: "Playground" },
      { day: "Tuesday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Library", teacher: "Meena Kumari", room: "Library Hall" },

      { day: "Wednesday", period: 1, time: "08:30 AM - 09:30 AM", subject: "Mathematics", teacher: "Suresh Kumar", room: "Room 101" },
      { day: "Wednesday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Science", teacher: "Ritu Sharma", room: "Room 101" },
      { day: "Wednesday", period: 3, time: "11:00 AM - 12:00 PM", subject: "English", teacher: "Pooja Gupta", room: "Room 101" },
      { day: "Wednesday", period: 4, time: "12:00 PM - 01:00 PM", subject: "Social Studies", teacher: "Anil Joshi", room: "Room 101" },
      { day: "Wednesday", period: 5, time: "01:45 PM - 02:45 PM", subject: "Hindi", teacher: "Kamlesh Devi", room: "Room 101" },
      { day: "Wednesday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Music", teacher: "Vijay Verma", room: "Music Room" },

      { day: "Thursday", period: 1, time: "08:30 AM - 09:30 AM", subject: "Science", teacher: "Ritu Sharma", room: "Room 101" },
      { day: "Thursday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Mathematics", teacher: "Suresh Kumar", room: "Room 101" },
      { day: "Thursday", period: 3, time: "11:00 AM - 12:00 PM", subject: "English", teacher: "Pooja Gupta", room: "Room 101" },
      { day: "Thursday", period: 4, time: "12:00 PM - 01:00 PM", subject: "Computer Science", teacher: "Rajesh Malhotra", room: "Computer Lab" },
      { day: "Thursday", period: 5, time: "01:45 PM - 02:45 PM", subject: "Social Studies", teacher: "Anil Joshi", room: "Room 101" },
      { day: "Thursday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Art & Craft", teacher: "Neha Sen", room: "Art Studio" },

      { day: "Friday", period: 1, time: "08:30 AM - 09:30 AM", subject: "Mathematics", teacher: "Suresh Kumar", room: "Room 101" },
      { day: "Friday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Science", teacher: "Ritu Sharma", room: "Room 101" },
      { day: "Friday", period: 3, time: "11:00 AM - 12:00 PM", subject: "English", teacher: "Pooja Gupta", room: "Room 101" },
      { day: "Friday", period: 4, time: "12:00 PM - 01:00 PM", subject: "Social Studies", teacher: "Anil Joshi", room: "Room 101" },
      { day: "Friday", period: 5, time: "01:45 PM - 02:45 PM", subject: "Hindi", teacher: "Kamlesh Devi", room: "Room 101" },
      { day: "Friday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Physical Education", teacher: "Sandeep Singh", room: "Playground" },
    ],
  },
};

const DEFAULT_TIMETABLE = [
  { day: "Monday", period: 1, time: "08:30 AM - 09:30 AM", subject: "English Literature", teacher: "Miss Watson", room: "Room A2" },
  { day: "Monday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Algebra & Logic", teacher: "Dr. Dave", room: "Lab Room" },
  { day: "Monday", period: 3, time: "11:00 AM - 12:00 PM", subject: "Physics (Theory)", teacher: "Prof. Einstein", room: "Science Wing" },
  { day: "Monday", period: 4, time: "12:00 PM - 01:00 PM", subject: "History of World", teacher: "Mr. Churchill", room: "Room B4" },
  { day: "Monday", period: 5, time: "01:45 PM - 02:45 PM", subject: "Biology Practical", teacher: "Dr. Darwin", room: "Bio Lab" },
  { day: "Monday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Physical Education", teacher: "Coach Carter", room: "Gymnasium" },
  
  { day: "Tuesday", period: 1, time: "08:30 AM - 09:30 AM", subject: "Chemistry Core", teacher: "Prof. Boyle", room: "Chemistry Lab" },
  { day: "Tuesday", period: 2, time: "09:30 AM - 10:30 AM", subject: "English Literature", teacher: "Miss Watson", room: "Room A2" },
  { day: "Tuesday", period: 3, time: "11:00 AM - 12:00 PM", subject: "Algebra & Logic", teacher: "Dr. Dave", room: "Lab Room" },
  { day: "Tuesday", period: 4, time: "12:00 PM - 01:00 PM", subject: "Computer Programming", teacher: "Prof. Lovelace", room: "IT Lab" },
  { day: "Tuesday", period: 5, time: "01:45 PM - 02:45 PM", subject: "French Language", teacher: "Madame Curie", room: "Room C1" },
  { day: "Tuesday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Self Study Hour", teacher: "Librarian", room: "Library" },
  
  { day: "Wednesday", period: 1, time: "08:30 AM - 09:30 AM", subject: "Algebra & Logic", teacher: "Dr. Dave", room: "Lab Room" },
  { day: "Wednesday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Physics (Theory)", teacher: "Prof. Einstein", room: "Science Wing" },
  { day: "Wednesday", period: 3, time: "11:00 AM - 12:00 PM", subject: "English Literature", teacher: "Miss Watson", room: "Room A2" },
  { day: "Wednesday", period: 4, time: "12:00 PM - 01:00 PM", subject: "History of World", teacher: "Mr. Churchill", room: "Room B4" },
  { day: "Wednesday", period: 5, time: "01:45 PM - 02:45 PM", subject: "French Language", teacher: "Madame Curie", room: "Room C1" },
  { day: "Wednesday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Creative Writing", teacher: "Miss Watson", room: "Room A2" },

  { day: "Thursday", period: 1, time: "08:30 AM - 09:30 AM", subject: "Chemistry Core", teacher: "Prof. Boyle", room: "Chemistry Lab" },
  { day: "Thursday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Algebra & Logic", teacher: "Dr. Dave", room: "Lab Room" },
  { day: "Thursday", period: 3, time: "11:00 AM - 12:00 PM", subject: "Physics (Theory)", teacher: "Prof. Einstein", room: "Science Wing" },
  { day: "Thursday", period: 4, time: "12:00 PM - 01:00 PM", subject: "Computer Programming", teacher: "Prof. Lovelace", room: "IT Lab" },
  { day: "Thursday", period: 5, time: "01:45 PM - 02:45 PM", subject: "History of World", teacher: "Mr. Churchill", room: "Room B4" },
  { day: "Thursday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Art & Design", teacher: "Mr. DaVinci", room: "Art Studio" },

  { day: "Friday", period: 1, time: "08:30 AM - 09:30 AM", subject: "English Literature", teacher: "Miss Watson", room: "Room A2" },
  { day: "Friday", period: 2, time: "09:30 AM - 10:30 AM", subject: "Chemistry Core", teacher: "Prof. Boyle", room: "Chemistry Lab" },
  { day: "Friday", period: 3, time: "11:00 AM - 12:00 PM", subject: "Algebra & Logic", teacher: "Dr. Dave", room: "Lab Room" },
  { day: "Friday", period: 4, time: "12:00 PM - 01:00 PM", subject: "History of World", teacher: "Mr. Churchill", room: "Room B4" },
  { day: "Friday", period: 5, time: "01:45 PM - 02:45 PM", subject: "Biology Practical", teacher: "Dr. Darwin", room: "Bio Lab" },
  { day: "Friday", period: 6, time: "02:45 PM - 03:45 PM", subject: "Physical Education", teacher: "Coach Carter", room: "Gymnasium" },
];

const TimetablePage = () => {
  const [selectedClass, setSelectedClass] = useState("Class 5");
  const [selectedSection, setSelectedSection] = useState("A");

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5, 6];

  const currentTimetable = useMemo(() => {
    return TIMETABLE_DATA[selectedClass]?.[selectedSection] || DEFAULT_TIMETABLE;
  }, [selectedClass, selectedSection]);

  // Group timetable data by day and period for quick O(1) lookup in table rendering
  const scheduleMap = useMemo(() => {
    const map = {};
    currentTimetable.forEach(item => {
      map[`${item.day}-${item.period}`] = item;
    });
    return map;
  }, [currentTimetable]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Header Section */}
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Academics</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Class Timetable Schedule</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage and review the weekly calendar schedules, teachers, and classroom allocations.
            </p>
          </div>
        </header>

        {/* Filter Toolbar */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex flex-col min-w-[150px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Class Selection</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-xs outline-none bg-white font-medium text-slate-700 focus:border-slate-400"
            >
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </select>
          </div>

          <div className="flex flex-col min-w-[150px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-xs outline-none bg-white font-medium text-slate-700 focus:border-slate-400"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <div className="self-end pb-1 ml-auto">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              Academic Year: 2026-2027 (Current)
            </span>
          </div>
        </section>

        {/* Timetable Weekly Matrix */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-32 border-r border-slate-200">
                    Day / Period
                  </th>
                  {periods.map(num => {
                    const match = currentTimetable.find(item => item.period === num);
                    const timeRange = match ? match.time : `Period ${num}`;
                    return (
                      <th key={num} className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                        <div className="flex flex-col gap-0.5">
                          <span>Period {num}</span>
                          <span className="text-[10px] text-slate-400 font-medium normal-case flex items-center gap-1">
                            <Clock size={10} />
                            {timeRange}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {daysOfWeek.map(day => (
                  <tr key={day} className="hover:bg-slate-50/20">
                    <td className="px-5 py-6 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/40">
                      {day}
                    </td>
                    {periods.map(period => {
                      const item = scheduleMap[`${day}-${period}`];
                      return (
                        <td key={period} className="px-4 py-6 align-top min-w-[150px]">
                          {item ? (
                            <div className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2 hover:border-slate-350 hover:shadow transition duration-200">
                              <p className="font-extrabold text-slate-950 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                                {item.subject}
                              </p>
                              
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                  <User size={10} className="text-slate-400 shrink-0" />
                                  {item.teacher}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                  <MapPin size={10} className="text-slate-300 shrink-0" />
                                  {item.room}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full min-h-[90px] rounded-xl border border-dashed border-slate-200 flex items-center justify-center bg-slate-50/20 text-slate-400 text-[10px] font-medium italic">
                              No Session
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TimetablePage;
