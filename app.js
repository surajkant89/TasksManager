document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('taskForm');
    const incompleteTasksContainer = document.getElementById('incompleteTasksContainer');
    const completedTasksContainer = document.getElementById('completedTasksContainer');
    const totalTasksElement = document.getElementById('totalTasks');
    const completedTasksElement = document.getElementById('completedTasks');
    const incompleteTasksElement = document.getElementById('incompleteTasks');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const installBtn = document.getElementById('installBtn');
    const themeToggle = document.getElementById('themeToggle');
    const editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    const saveTaskChangesBtn = document.getElementById('saveTaskChanges');
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    const userNameElement = document.getElementById('userName');
    const userPurposeElement = document.getElementById('userPurpose');
    const saveProfileButton = document.getElementById('saveProfile');
    const editProfileBtn = document.getElementById('editProfileBtn');

    // Initialize tasks array
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Set default due date to today
    document.getElementById('taskDueDate').valueAsDate = new Date();

    // Initialize the app
    function init() {
        renderTasks();
        updateStats();
        checkInstallPrompt();
        loadThemePreference();
        checkUserProfile();
    }

    // Load theme preference from localStorage
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.add(savedTheme + '-mode');
        updateThemeToggle(savedTheme);
    }

    // Update theme toggle button
    function updateThemeToggle(theme) {
        if (theme === 'dark') {
            themeToggle.innerHTML = '<i class="bi bi-sun"></i> Light Mode';
        } else {
            themeToggle.innerHTML = '<i class="bi bi-moon"></i> Dark Mode';
        }
    }

    // Toggle theme
    themeToggle.addEventListener('click', function() {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
            updateThemeToggle('light');
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            updateThemeToggle('dark');
        }
    });

    // Add new task
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const title = document.getElementById('taskTitle').value;
        const category = document.getElementById('taskCategory').value;
        const description = document.getElementById('taskDescription').value;
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;

        const newTask = {
            id: Date.now(),
            title,
            category,
            description,
            priority,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        taskForm.reset();
        document.getElementById('taskDueDate').valueAsDate = new Date();
    });

    // Render all tasks
    function renderTasks() {
        incompleteTasksContainer.innerHTML = '';
        completedTasksContainer.innerHTML = '';

        if (tasks.length === 0) {
            incompleteTasksContainer.innerHTML = '<p class="text-muted">No tasks found. Add a new task above.</p>';
            return;
        }

        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            if (task.completed) {
                completedTasksContainer.appendChild(taskElement);
            } else {
                incompleteTasksContainer.appendChild(taskElement);
            }
        });
    }

    // Create task card element
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `col-12 task-card ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;

        const priorityBadgeClass = {
            'high': 'bg-danger',
            'medium': 'bg-warning text-dark',
            'low': 'bg-success'
        }[task.priority];

        const categoryBadgeClass = {
            'work': 'bg-primary',
            'personal': 'bg-info text-dark',
            'shopping': 'bg-purple',
            'other': 'bg-secondary'
        }[task.category];

        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';

        taskElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="task-title">${task.title}</div>
                    <span class="badge ${categoryBadgeClass} mb-2">${task.category}</span>
                    <span class="badge ${priorityBadgeClass} mb-2">${task.priority}</span>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-due-date"><i class="bi bi-calendar"></i> ${dueDate}</div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${task.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                    <button class="btn btn-sm ${task.completed ? 'btn-success' : 'btn-outline-secondary'} toggle-btn" data-id="${task.id}">
                        <i class="bi ${task.completed ? 'bi-check-circle-fill' : 'bi-circle'}"></i>
                    </button>
                </div>
            </div>
        `;

        return taskElement;
    }

    // Event delegation for task actions
    document.addEventListener('click', function(e) {
        // Delete task
        if (e.target.classList.contains('delete-btn') || e.target.parentElement.classList.contains('delete-btn')) {
            const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.parentElement;
            const taskId = parseInt(btn.dataset.id);
            deleteTask(taskId);
        }

        // Toggle task completion
        if (e.target.classList.contains('toggle-btn') || e.target.parentElement.classList.contains('toggle-btn')) {
            const btn = e.target.classList.contains('toggle-btn') ? e.target : e.target.parentElement;
            const taskId = parseInt(btn.dataset.id);
            toggleTaskCompletion(taskId);
        }

        // Edit task
        if (e.target.classList.contains('edit-btn') || e.target.parentElement.classList.contains('edit-btn')) {
            const btn = e.target.classList.contains('edit-btn') ? e.target : e.target.parentElement;
            const taskId = parseInt(btn.dataset.id);
            openEditModal(taskId);
        }
    });

    // Delete task
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats();
    }

    // Toggle task completion
    function toggleTaskCompletion(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        renderTasks();
        updateStats();
    }

    // Open edit modal
    function openEditModal(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskCategory').value = task.category;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskDueDate').value = task.dueDate;

        editTaskModal.show();
    }

    // Save task changes
    saveTaskChangesBtn.addEventListener('click', function() {
        const taskId = parseInt(document.getElementById('editTaskId').value);
        const title = document.getElementById('editTaskTitle').value;
        const category = document.getElementById('editTaskCategory').value;
        const description = document.getElementById('editTaskDescription').value;
        const priority = document.getElementById('editTaskPriority').value;
        const dueDate = document.getElementById('editTaskDueDate').value;

        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return { 
                    ...task, 
                    title, 
                    category, 
                    description, 
                    priority, 
                    dueDate 
                };
            }
            return task;
        });

        saveTasks();
        renderTasks();
        editTaskModal.hide();
    });

    // Clear completed tasks
    clearCompletedBtn.addEventListener('click', function() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
    });

    // Update statistics
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const incomplete = total - completed;

        totalTasksElement.textContent = total;
        completedTasksElement.textContent = completed;
        incompleteTasksElement.textContent = incomplete;
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // PWA Installation
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the default mini-infobar from appearing
        e.preventDefault();
        // Save the event for later use
        deferredPrompt = e;

        // Show the install button
        const installAppBtn = document.getElementById('installAppBtn');
        installAppBtn.classList.remove('d-none');

        // Handle the install button click
        installAppBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user's response
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                // Clear the deferred prompt
                deferredPrompt = null;

                // Hide the install button after installation
                installAppBtn.classList.add('d-none');
            }
        });
    });

    // Optional: Hide the install button after the app is installed
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        const installAppBtn = document.getElementById('installAppBtn');
        installAppBtn.classList.add('d-none');
    });

    function checkInstallPrompt() {
        window.addEventListener('appinstalled', () => {
            installBtn.classList.add('d-none');
            deferredPrompt = null;
        });
    }

    // Check if profile exists in localStorage
    function checkUserProfile() {
        const profile = JSON.parse(localStorage.getItem('userProfile'));
        if (!profile) {
            // Show the profile modal if no profile is set
            profileModal.show();
        } else {
            // Display the profile in the header
            displayProfile(profile);
        }
    }

    // Open profile modal for editing
    editProfileBtn.addEventListener('click', () => {
        const profile = JSON.parse(localStorage.getItem('userProfile'));
        if (profile) {
            userNameElement.value = profile.name;
            userPurposeElement.value = profile.purpose;
        }
        profileModal.show();
    });

    // Save profile on button click
    saveProfileButton.addEventListener('click', () => {
        const userName = userNameElement.value.trim();
        const userPurpose = userPurposeElement.value;

        if (userName && userPurpose) {
            const userProfile = { name: userName, purpose: userPurpose };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            displayProfile(userProfile);
            profileModal.hide();
        } else {
            alert('Please fill out all fields.');
        }
    });

    // Function to display the profile in the header
    function displayProfile(profile) {
        const existingProfileInfo = document.querySelector('.profile-info');
        if (existingProfileInfo) {
            existingProfileInfo.remove();
        }

        const header = document.querySelector('header');
        const profileInfo = document.createElement('div');
        profileInfo.className = 'profile-info text-end';
        profileInfo.innerHTML = `
            <p class="m-0"><strong>Name:</strong> ${profile.name}</p>
            <p class="m-0"><strong>Purpose:</strong> ${profile.purpose}</p>
        `;
        header.appendChild(profileInfo);
    }

    // Initialize the app
    init();
});