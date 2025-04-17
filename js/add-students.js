// Get classroom ID from URL
const urlParams = new URLSearchParams(window.location.search);
const classroomId = urlParams.get('id');

// DOM Elements
const classroomName = document.getElementById('classroomName');
const classroomSubject = document.getElementById('classroomSubject');
const addStudentForm = document.getElementById('addStudentForm');
const studentsList = document.getElementById('studentsList');
const goToSeating = document.getElementById('goToSeating');
const logoutBtn = document.getElementById('logoutBtn');

// Load classroom details and students
async function loadClassroom() {
    try {
        const doc = await db.collection('classrooms').doc(classroomId).get();
        if (!doc.exists) {
            alert('Classroom not found');
            window.location.href = '/dashboard.html';
            return;
        }

        const classroom = doc.data();
        classroomName.textContent = classroom.name;
        classroomSubject.textContent = classroom.subject;
        goToSeating.href = `/seating.html?id=${classroomId}`;

        loadStudents(classroom.students || []);
    } catch (error) {
        console.error('Error loading classroom:', error);
        alert('Failed to load classroom details');
    }
}

// Display students list
function loadStudents(students) {
    studentsList.innerHTML = '';
    
    if (students.length === 0) {
        studentsList.innerHTML = `
            <div class="text-center text-muted p-3">
                No students added yet
            </div>`;
        return;
    }

    students.forEach((student, index) => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
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
                    <h6 class="mb-0">${student.name}</h6>
                    <small class="text-muted">Roll: ${student.rollNumber}</small>
                </div>
            </div>
            <button class="btn btn-outline-danger btn-sm" onclick="removeStudent(${index})">
                <i class="bi bi-trash"></i>
            </button>
        `;
        studentsList.appendChild(item);
    });
}

// Add new student
addStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentName = document.getElementById('studentName').value;
    const rollNumber = document.getElementById('rollNumber').value;
    const photoUrl = document.getElementById('photoUrl').value;

    try {
        const docRef = db.collection('classrooms').doc(classroomId);
        const doc = await docRef.get();
        const classroom = doc.data();
        const students = classroom.students || [];

        // Check for duplicate roll number
        if (students.some(s => s.rollNumber === rollNumber)) {
            alert('A student with this roll number already exists');
            return;
        }

        // Add new student
        students.push({
            name: studentName,
            rollNumber: rollNumber,
            photoUrl: photoUrl || null
        });

        await docRef.update({ students: students });
        addStudentForm.reset();
        loadStudents(students);
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Failed to add student');
    }
});

// Remove student
async function removeStudent(index) {
    if (!confirm('Are you sure you want to remove this student?')) return;

    try {
        const docRef = db.collection('classrooms').doc(classroomId);
        const doc = await docRef.get();
        const classroom = doc.data();
        const students = classroom.students || [];

        students.splice(index, 1);
        await docRef.update({ students: students });
        loadStudents(students);
    } catch (error) {
        console.error('Error removing student:', error);
        alert('Failed to remove student');
    }
}

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