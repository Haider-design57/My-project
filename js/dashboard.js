// DOM Elements
const classroomsList = document.getElementById('classroomsList');
const createClassForm = document.getElementById('createClassForm');
const teacherName = document.getElementById('teacherName');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize Bootstrap Modal
const createClassModal = new bootstrap.Modal(document.getElementById('createClassModal'));

// Load teacher's classrooms
async function loadClassrooms() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const snapshot = await db.collection('classrooms')
            .where('teacherId', '==', user.uid)
            .get();

        classroomsList.innerHTML = '';
        
        if (snapshot.empty) {
            classroomsList.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">No classrooms created yet. Create your first classroom!</p>
                </div>`;
            return;
        }

        snapshot.forEach(doc => {
            const classroom = doc.data();
            const card = createClassroomCard(doc.id, classroom);
            classroomsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading classrooms:', error);
        alert('Failed to load classrooms');
    }
}

// Create classroom card element
function createClassroomCard(id, classroom) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
        <div class="card class-card h-100">
            <div class="card-body">
                <h5 class="card-title">${classroom.name}</h5>
                <p class="card-text">${classroom.subject}</p>
                <p class="card-text">
                    <small class="text-muted">Grid: ${classroom.gridSize}</small>
                </p>
            </div>
            <div class="card-footer bg-transparent border-top-0">
                <a href="/seating.html?id=${id}" class="btn btn-primary btn-sm">
                    <i class="bi bi-grid-3x3-gap me-1"></i>Seating Layout
                </a>
                <a href="/add-students.html?id=${id}" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-person-plus me-1"></i>Add Students
                </a>
            </div>
        </div>
    `;
    return col;
}

// Create new classroom
createClassForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const className = document.getElementById('className').value;
    const subject = document.getElementById('subject').value;
    const gridSize = document.getElementById('gridSize').value;

    try {
        const classroomRef = await db.collection('classrooms').add({
            name: className,
            subject: subject,
            gridSize: gridSize,
            teacherId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            students: []
        });

        createClassModal.hide();
        createClassForm.reset();
        loadClassrooms();
    } catch (error) {
        console.error('Error creating classroom:', error);
        alert('Failed to create classroom');
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

// Update teacher name in navbar
function updateTeacherName() {
    const user = auth.currentUser;
    if (user && user.displayName) {
        teacherName.textContent = `Welcome, ${user.displayName}`;
    }
}

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        updateTeacherName();
        loadClassrooms();
    } else {
        window.location.href = '/login.html';
    }
});