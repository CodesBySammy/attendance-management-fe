document.addEventListener('DOMContentLoaded', () => {
  const createEventBtn = document.getElementById('createEvent');
  const postAttendanceBtn = document.getElementById('postAttendance');
  const viewAttendanceBtn = document.getElementById('viewAttendance');
  const downloadAttendanceBtn = document.getElementById('downloadAttendance');
  const studentsTableBody = document.getElementById('studentsTableBody');
  const attendanceTableBody = document.getElementById('attendanceTableBody');
  const eventMessage = document.getElementById('eventMessage');

  // Fetch Students for Attendance
  createEventBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('https://exc-attendance-be.vercel.app/admin/students', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const students = await response.json();

      studentsTableBody.innerHTML = '';
      students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${student.registrationNumber}</td>
          <td>${student.name}</td>
          <td>${student.email}</td>
          <td>
            <select data-student-id="${student._id}">
              <option value="absent">Absent</option>
              <option value="present">Present</option>
            </select>
          </td>
        `;
        studentsTableBody.appendChild(row);
      });
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  });

  // Post Attendance
  postAttendanceBtn.addEventListener('click', async () => {
    const eventName = document.getElementById('eventName').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventStartTime = document.getElementById('eventStartTime').value; // Get the event start time
    const eventEndTime = document.getElementById('eventEndTime').value; // Get the event end time
    const attendance = Array.from(document.querySelectorAll('[data-student-id]')).map(select => ({
      studentId: select.dataset.studentId,
      status: select.value,
    }));

    try {
      const response = await fetch('https://exc-attendance-be.vercel.app/admin/post-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ eventName, eventDate,eventStartTime,eventEndTime, attendance }),
      });

      const data = await response.json();
      eventMessage.textContent = data.message;
    } catch (error) {
      console.error('Error posting attendance:', error);
    }
  });

  // View Attendance
  viewAttendanceBtn.addEventListener('click', async () => {
    const viewEventName = document.getElementById('viewEventName').value;
    const viewEventDate = document.getElementById('viewEventDate').value;
    const viewEventStartTime = document.getElementById('viewEventStartTime').value; // Get the event start time
    const viewEventEndTime = document.getElementById('viewEventEndTime').value; // Get the event end time

    try {
      const response = await fetch(`https://exc-attendance-be.vercel.app/admin/view-attendance?eventName=${viewEventName}&eventDate=${viewEventDate}&eventStartTime=${viewEventStartTime}&eventEndTime=${viewEventEndTime}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      // Clear previous attendance records
      attendanceTableBody.innerHTML = '';

      if (!response.ok) {
        // If the response status is not OK, show an error message
        const data = await response.json();
        eventMessage.textContent = data.message; // Display the message from the server
        return; // Exit the function early
      }

      const attendance = await response.json();

      // Check if attendance records exist
      if (attendance.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4">This event does not exist.</td>`;
        attendanceTableBody.appendChild(row);
      } else {
        attendance.forEach(record => {
          const row = document.createElement('tr');
          
          // Apply red color if the status is 'absent'
          const statusColor = record.status === 'absent' ? 'red' : 'black';

          row.innerHTML = `
            <td>${record.registrationNumber}</td>
            <td>${record.name}</td>
            <td>${record.email}</td>
            <td style="color: ${statusColor};">${record.status}</td>
          `;
          attendanceTableBody.appendChild(row);
        });
         // Display event start time and end time (if needed)
    const eventInfo = document.getElementById('eventInfo');
    eventInfo.textContent = `Event Start Time: ${data.eventStartTime}, Event End Time: ${data.eventEndTime}`; // Show event times
      }
    } catch (error) {
      console.error('Error viewing attendance:', error);
    }
  });

  // Download Attendance as Excel
  downloadAttendanceBtn?.addEventListener('click', async () => {
    const eventName = document.getElementById('viewEventName').value;
    const eventDate = document.getElementById('viewEventDate').value;
    const eventStartTime = document.getElementById('viewEventStartTime').value; // Get the event start time
    const eventEndTime = document.getElementById('viewEventEndTime').value; // Get the event end time

    try {
      const response = await fetch(`https://exc-attendance-be.vercel.app/admin/download-attendance?eventName=${eventName}&eventDate=${eventDate}&eventStartTime=${eventStartTime}&eventEndTime=${eventEndTime}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to download attendance');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${eventName}_${eventDate}_${eventStartTime}_${eventEndTime}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attendance:', error);
    }
  });

  // Logout
  document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
});
