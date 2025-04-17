// Get classroom ID from URL
const urlParams = new URLSearchParams(window.location.search);
const classroomId = urlParams.get('id');

// DOM Elements
const classroomName = document.getElementById('classroomName');
const classroomSubject = document.getElementById('classroomSubject');
const seatingGrid = document.getElementById('seatingGrid');
const unassignedStudents = document.getElementById('unassignedStudents');
const saveLayoutBtn = document.getElementById('saveLayoutBtn');
const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
const attendanceDate = document.getElementById('attendanceDate');
const logoutBtn = document.getElementById('logoutBtn');

// Set today's date as default
attendanceDate.valueAsDate = new Date();

let classroom = null;
let seatingLayout = null;

// Load classroom details and seating layout
async function loadClassroom() {
    try {
        const doc = await db.collection('classrooms').doc(classroomId).get();
        if (!doc.exists) {
            alert('Classroom not found');
            window.location.href = '/dashboard.html';
            return;
        }

        classroom = doc.data();
        classroomName.textContent = classroom.name;
        classroomSubject.textContent = classroom.subject;

        // Load seating layout if exists
        const layoutDoc = await db.collection('seating_layouts')
            .doc(classroomId)
            .get();

        seatingLayout = layoutDoc.exists ? layoutDoc.data().layout : null;

        initializeGrid();
        loadUnassignedStudents();
    } catch (error) {
        console.error('Error loading classroom:', error);
        alert('Failed to load classroom details');
    }
}

// Initialize seating grid
function initializeGrid() {
    const [rows, cols] = classroom.gridSize.split('x').map(Number);
    seatingGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // Clear existing grid
    seatingGrid.innerHTML = '';

    // Create grid cells
    for (let i = 0; i < rows * cols; i++) {
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.dataset.seatIndex = i;

        // If seating layout exists, populate seats
        if (seatingLayout && seatingLayout[i]) {
            const student = classroom.students.find(s => s.rollNumber === seatingLayout[i]);
            if (student) {
                populateSeat(seat, student);
            }
        }

        seat.addEventListener('click', () => toggleAttendance(seat));
        seatingGrid.appendChild(seat);
    }

    // Initialize draggable
    initializeDraggable();
}

// Populate seat with student info
function populateSeat(seat, student) {
    seat.innerHTML = `
        <div class="student-card">
            ${student.photoUrl ? `
                <img src="${student.photoUrl}" class="rounded-circle mb-2" width="40" height="40" alt="${student.name}">
            ` : `
                <div class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mb-2" 
                     style="width: 40px; height: 40px;">
                    ${student.name.charAt(0)}
                </div>
            `}
            <div class="student-info">
                <strong>${student.name}</strong>
                <small class="d-block text-muted">Roll: ${student.rollNumber}</small>
            </div>
        </div>
    `;
    seat.dataset.studentRoll = student.rollNumber;
    seat.classList.add('occupied');
}

// Load unassigned students
function loadUnassignedStudents() {
    const assignedRolls = Object.values(seatingLayout || {});
    const unassigned = classroom.students.filter(student => 
        !assignedRolls.includes(student.rollNumber)
    );

    unassignedStudents.innerHTML = '';

    if (unassigned.length === 0) {
        unassignedStudents.innerHTML = `
            <div class="text-center text-muted p-3">
                All students are assigned
            </div>`;
        return;
    }

    unassigned.forEach(student => {
        const item = document.createElement('div');
        item.className = 'list-group-item student-item';
        item.dataset.studentRoll = student.rollNumber;
        item.innerHTML = `
            <div class="d-flex align-items-center">
                ${student.photoUrl ? `
                    <img src="${student.photoUrl}" class="rounded-circle me-2" width="40" height="40" alt="${student.name}">
                ` : `
                    <div class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" 
                         style="width: 40px; height: 40px;">
                        ${student.name.charAt(0)}
                    </div>
                `}
                <div>
                    <strong>${student.name}</strong>
                    <small class="d-block text-muted">Roll: ${student.rollNumber}</small>
                </div>
            </div>
        `;
        unassignedStudents.appendChild(item);
    });
}

// Initialize draggable functionality
function initializeDraggable() {
    new Draggable.Draggable(document.querySelectorAll('.student-item, .seat'), {
        draggable: '.student-item, .occupied',
        dropzone: '.seat'
    }).on('drag:start', (evt) => {
        evt.source.classList.add('dragging');
    }).on('drag:stop', (evt) => {
        evt.source.classList.remove('dragging');
    }).on('droppable:dropped', (evt) => {
        const student = classroom.students.find(s => 
            s.rollNumber === evt.dragEvent.source.dataset.studentRoll
        );
        const targetSeat = evt.dropzone;

        // If target seat is occupied, swap students
        if (targetSeat.classList.contains('occupied')) {
            const sourceElement = evt.dragEvent.source;
            const targetStudent = classroom.students.find(s => 
                s.rollNumber === targetSeat.dataset.studentRoll
            );

            if (sourceElement.classList.contains('seat')) {
                populateSeat(sourceElement, targetStudent);
            } else {
                sourceElement.remove();
                const newItem = createUnassignedItem(targetStudent);
                unassignedStudents.appendChild(newItem);
            }
        } else {
            evt.dragEvent.source.remove();
        }

        populateSeat(targetSeat, student);
    });
}

// Create unassigned student item
function createUnassignedItem(student) {
    const item = document.createElement('div');
    item.className = 'list-group-item student-item';
    item.dataset.studentRoll = student.rollNumber;
    item.innerHTML = `
        <div class="d-flex align-items-center">
            ${student.photoUrl ? `
                <img src="${student.photoUrl}" class="rounded-circle me-2" width="40" height="40" alt="${student.name}">
            ` : `
                <div class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" 
                     style="width: 40px; height: 40px;">
                    ${student.name.charAt(0)}
                </div>
            `}
            <div>
                <strong>${student.name}</strong>
                <small class="d-block text-muted">Roll: ${student.rollNumber}</small>
            </div>
        </div>
    `;
    return item;
}

// Toggle attendance status
function toggleAttendance(seat) {
    if (!seat.classList.contains('occupied')) return;

    if (seat.classList.contains('present')) {
        seat.classList.remove('present');
        seat.classList.add('absent');
    } else if (seat.classList.contains('absent')) {
        seat.classList.remove('absent');
    } else {
        seat.classList.add('present');
    }
}

// Save seating layout
saveLayoutBtn.addEventListener('click', async () => {
    try {
        const layout = {};
        const seats = seatingGrid.querySelectorAll('.seat');
        
        seats.forEach(seat => {
            if (seat.dataset.studentRoll) {
                layout[seat.dataset.seatIndex] = seat.dataset.studentRoll;
            }
        });

        await db.collection('seating_layouts').doc(classroomId).set({
            layout: layout,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Seating layout saved successfully');
    } catch (error) {
        console.error('Error saving layout:', error);
        alert('Failed to save seating layout');
    }
});

// Save attendance
saveAttendanceBtn.addEventListener('click', async () => {
    try {
        const date = attendanceDate.value;
        const attendance = {};
        const seats = seatingGrid.querySelectorAll('.seat.occupied');

        seats.forEach(seat => {
            attendance[seat.dataset.studentRoll] = {
                status: seat.classList.contains('present') ? 'present' : 
                        seat.classList.contains('absent') ? 'absent' : 'not_marked',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
        });

        await db.collection('attendance')
            .doc(`${classroomId}_${date}`)
            .set({
                date: date,
                classroomId: classroomId,
                attendance: attendance,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        alert('Attendance saved successfully');
    } catch (error) {
        console.error('Error saving attendance:', error);
        alert('Failed to save attendance');
    }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out');
    }
});

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        if (classroomId) {
            loadClassroom();
        } else {
            window.location.href = '/dashboard.html';
        }
    } else {
        window.location.href = '/login.html';
    }
});