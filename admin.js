document.addEventListener('DOMContentLoaded', () => {
  const createEventBtn = document.getElementById('createEvent');
  const postAttendanceBtn = document.getElementById('postAttendance');
  const viewAttendanceBtn = document.getElementById('viewAttendance');
  const downloadAttendanceBtn = document.getElementById('downloadAttendance');
  const studentsTableBody = document.getElementById('studentsTableBody');
  const attendanceTableBody = document.getElementById('attendanceTableBody');
  const eventMessage = document.getElementById('eventMessage');
  const viewEventSummaryBtn = document.getElementById('viewEventSummary'); 
  const eventSummaryTableBody = document.getElementById('eventSummaryTableBody'); 

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

viewAttendanceBtn.addEventListener('click', async () => {
    const viewEventName = document.getElementById('viewEventName').value;
    const viewEventDate = document.getElementById('viewEventDate').value;
    const viewEventStartTime = document.getElementById('viewEventStartTime').value;
    const viewEventEndTime = document.getElementById('viewEventEndTime').value;

    try {
      const response = await fetch(`https://exc-attendance-be.vercel.app/admin/view-attendance?eventName=${viewEventName}&eventDate=${viewEventDate}&eventStartTime=${viewEventStartTime}&eventEndTime=${viewEventEndTime}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      // Clear previous attendance records
      attendanceTableBody.innerHTML = '';

      if (!response.ok) {
        const data = await response.json();
        eventMessage.textContent = data.message;
        return;
      }

      const attendance = await response.json();

      // Check if attendance records exist
      if (attendance.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">This event does not exist.</td>`;
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
            <td>
              <button class="edit-attendance" 
                      data-student-id="${record._id}"
                      data-name="${record.name}"
                      data-registration="${record.registrationNumber}"
                      data-event-name="${viewEventName}"
                      data-event-date="${viewEventDate}"
                      data-event-start-time="${viewEventStartTime}"
                      data-event-end-time="${viewEventEndTime}">
                Edit
              </button>
            </td>
          `;
          attendanceTableBody.appendChild(row);
        });

        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-attendance').forEach(button => {
          button.addEventListener('click', () => {
            const studentId = button.getAttribute('data-student-id');
            const name = button.getAttribute('data-name');
            const registrationNumber = button.getAttribute('data-registration');
            const eventName = button.getAttribute('data-event-name');
            const eventDate = button.getAttribute('data-event-date');
            const eventStartTime = button.getAttribute('data-event-start-time');
            const eventEndTime = button.getAttribute('data-event-end-time');

            // Populate edit modal
            document.getElementById('editStudentId').value = studentId;
            document.getElementById('editStudentName').value = name;
            document.getElementById('editStudentRegistration').value = registrationNumber;
            document.getElementById('editEventName').value = eventName;
            document.getElementById('editEventDate').value = eventDate;
            document.getElementById('editEventStartTime').value = eventStartTime;
            document.getElementById('editEventEndTime').value = eventEndTime;

            // Show edit modal
            document.getElementById('editAttendanceModal').style.display = 'block';
            document.getElementById('modalBackground').style.display = 'flex';
          });
        });
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

  document.getElementById('searchStudent').addEventListener('input', function () {
    const filter = this.value.toUpperCase();
    const table = document.getElementById('studentsTableBody');
    const rows = table.getElementsByTagName('tr');
  
    Array.from(rows).forEach(row => {
      const regNumberCell = row.getElementsByTagName('td')[0]; // Assuming registration number is in the first column
      if (regNumberCell) {
        const txtValue = regNumberCell.textContent || regNumberCell.innerText;
        row.style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? '' : 'none';
      }
    });
  });
  
  document.getElementById('searchStudent1').addEventListener('input', function () {
    const filter = this.value.toUpperCase();
    const table = document.getElementById('attendanceTableBody');
    const rows = table.getElementsByTagName('tr');
  
    Array.from(rows).forEach(row => {
      const regNumberCell = row.getElementsByTagName('td')[0]; // Assuming registration number is in the first column
      if (regNumberCell) {
        const txtValue = regNumberCell.textContent || regNumberCell.innerText;
        row.style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? '' : 'none';
      }
    });
  });

   // View Event Summary
   viewEventSummaryBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('https://exc-attendance-be.vercel.app/admin/event-summary', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) {
        const data = await response.json();
        eventMessage.textContent = data.message || 'Error fetching event summary';
        return;
      }

      const summaries = await response.json();

      // Clear previous summaries
      eventSummaryTableBody.innerHTML = '';

      summaries.forEach(summary => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${summary.eventName}</td>
    <td>${summary.eventDate}</td>
    <td>${summary.eventStartTime}</td>
    <td>${summary.eventEndTime}</td>
    <td>${summary.presentCount}</td>
    <td>${summary.absentCount}</td>
    <td>
      <button class="delete-event" style="background-color: red; color: white;">Delete</button>
    </td>
  `;
  eventSummaryTableBody.appendChild(row);
});
    } catch (error) {
      console.error('Error fetching event summary:', error);
    }
  });

  // Save Edited Attendance
  document.getElementById('saveEditedAttendance').addEventListener('click', async () => {
    const studentId = document.getElementById('editStudentId').value;
    const eventName = document.getElementById('editEventName').value;
    const eventDate = document.getElementById('editEventDate').value;
    const eventStartTime = document.getElementById('editEventStartTime').value;
    const eventEndTime = document.getElementById('editEventEndTime').value;
    const newStatus = document.getElementById('editAttendanceStatus').value;

    try {
      const response = await fetch('https://exc-attendance-be.vercel.app/admin/edit-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          studentId,
          eventName,
          eventDate,
          eventStartTime,
          eventEndTime,
          newStatus
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Close the edit modal
        document.getElementById('editAttendanceModal').style.display = 'none';
        document.getElementById('modalBackground').style.display = 'none';
        
        // Refresh the attendance view
        document.getElementById('viewAttendance').click();
        
        alert(data.message);
      } else {
        alert('Failed to update attendance: ' + data.message);
      }
    } catch (error) {
      console.error('Error editing attendance:', error);
      alert('An error occurred while editing attendance');
    }
  });

  // Add this inside the existing DOMContentLoaded event listener in admin.js

// Delete Event Functionality
eventSummaryTableBody.addEventListener('click', async (event) => {
  if (event.target.classList.contains('delete-event')) {
    const row = event.target.closest('tr');
    const eventName = row.querySelector('td:first-child').textContent;
    const eventDate = row.querySelector('td:nth-child(2)').textContent;
    const eventStartTime = row.querySelector('td:nth-child(3)').textContent;
    const eventEndTime = row.querySelector('td:nth-child(4)').textContent;

    const confirmDelete = confirm(`Are you sure you want to delete the event: ${eventName} on ${eventDate}?`);
    
    if (confirmDelete) {
      try {
        const response = await fetch('https://exc-attendance-be.vercel.app/admin/delete-event', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ 
            eventName, 
            eventDate, 
            eventStartTime, 
            eventEndTime 
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Remove the row from the table
          row.remove();
          alert('Event deleted successfully');
        } else {
          alert('Failed to delete event: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('An error occurred while deleting the event');
      }
    }
  }
});

    document.querySelectorAll('.open-modal').forEach(button => {
        button.addEventListener('click', () => {
          // Hide all modals before showing the clicked one
          document.querySelectorAll('.modal-content').forEach(modal => modal.style.display = 'none');
          
          // Show only the modal linked with the clicked button
          const modalId = button.getAttribute('data-modal');
          document.getElementById(modalId).style.display = 'block';
          
          // Show the modal background
          document.getElementById('modalBackground').style.display = 'flex';
        });
      });
      
      // Close modals when the close button is clicked
      document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
          document.querySelectorAll('.modal-content').forEach(modal => modal.style.display = 'none');
          document.getElementById('modalBackground').style.display = 'none';
        });
      });
      
      // Close modal if the background is clicked
      document.getElementById('modalBackground').addEventListener('click', (event) => {
        if (event.target === document.getElementById('modalBackground')) {
          document.querySelectorAll('.modal-content').forEach(modal => modal.style.display = 'none');
          document.getElementById('modalBackground').style.display = 'none';
        }
      });

  // Logout
  document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
});
