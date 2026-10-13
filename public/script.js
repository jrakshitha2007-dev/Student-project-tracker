// Select the HTML elements
const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const message = document.querySelector('#message');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');

// localStorage key
const STORAGE_KEY = 'workshop-projects-v1';

// Store projects in memory
let projects = [];

// Track which project is being edited
let editingId = null;

// Track whether browser storage is available
let storageAvailable = true;

// Generate a unique ID for each new project
function generateProjectId() {
    return crypto.randomUUID();
}

// Check whether a project record has the required structure
function isValidProject(project) {
    return (
        project !== null &&
        typeof project === 'object' &&
        !Array.isArray(project) &&
        typeof project.id === 'string' &&
        project.id.trim() !== '' &&
        typeof project.name === 'string' &&
        project.name.trim() !== '' &&
        typeof project.status === 'string' &&
        ['Planned', 'In Progress', 'Completed'].includes(project.status)
    );
}

// Check whether the stored value is a valid project array
function isValidProjectArray(data) {
    if (!Array.isArray(data)) {
        return false;
    }

    const ids = new Set();

    for (const project of data) {
        if (!isValidProject(project)) {
            return false;
        }

        // Project IDs must be unique
        if (ids.has(project.id)) {
            return false;
        }

        ids.add(project.id);
    }

    return true;
}

// Load projects from localStorage
function loadProjects() {
    let savedData;

    try {
        savedData = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        storageAvailable = false;

        message.textContent =
            'Browser storage is unavailable. Changes cannot be saved.';

        return;
    }

    // No saved data means the tracker starts empty
    if (savedData === null) {
        projects = [];
        return;
    }

    let parsedData;

    try {
        // Convert stored text back into a JavaScript value
        parsedData = JSON.parse(savedData);
    } catch (error) {
        // Do not overwrite malformed stored data
        storageAvailable = false;

        message.textContent =
            'Saved project data is invalid JSON. Existing stored data was not changed.';

        return;
    }

    // Validate the parsed value before using it
    if (!isValidProjectArray(parsedData)) {
        storageAvailable = false;

        message.textContent =
            'Saved project data has an invalid structure. Existing stored data was not changed.';

        return;
    }

    projects = parsedData;
}

// Save the current projects array to localStorage
function saveProjects() {
    if (!storageAvailable) {
        message.textContent =
            'Changes could not be saved because browser storage is unavailable or its saved data is invalid.';
        return false;
    }

    try {
        // Convert the array into text for storage
        const savedData = JSON.stringify(projects);

        localStorage.setItem(STORAGE_KEY, savedData);

        return true;
    } catch (error) {
        message.textContent =
            'Changes could not be saved to browser storage.';

        return false;
    }
}

// Reset the form to Add mode
function resetForm() {
    form.reset();

    editingId = null;

    saveButton.textContent = 'Save Project';
    cancelButton.hidden = true;
}

// Display all projects on the webpage
function renderProjects() {
    // Clear the existing list to prevent duplicates
    projectList.replaceChildren();

    // Display every project
    projects.forEach(project => {
        const listItem = document.createElement('li');

        // Project name
        const projectName = document.createElement('h3');
        projectName.textContent = project.name;

        // Project status
        const projectStatus = document.createElement('p');
        projectStatus.textContent = `Status: ${project.status}`;

        // Container for project actions
        const actions = document.createElement('div');
        actions.className = 'card-actions';

        // Edit button
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Edit';

        // Select this project for editing
        editButton.addEventListener('click', () => {
            const selectedProject = projects.find(
                item => item.id === project.id
            );

            if (!selectedProject) {
                return;
            }

            editingId = selectedProject.id;

            nameInput.value = selectedProject.name;
            statusInput.value = selectedProject.status;

            saveButton.textContent = 'Save changes';
            cancelButton.hidden = false;

            message.textContent = 'Editing project.';
            nameInput.focus();
        });

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';

        // Delete the selected project using its stable ID
        deleteButton.addEventListener('click', () => {
            const selectedProject = projects.find(
                item => item.id === project.id
            );

            if (!selectedProject) {
                return;
            }

            // Ask for confirmation before deleting
            const confirmed = window.confirm(
                `Are you sure you want to delete "${selectedProject.name}"?`
            );

            // Cancel means no changes to the collection or storage
            if (!confirmed) {
                return;
            }

            const projectIndex = projects.findIndex(
                item => item.id === selectedProject.id
            );

            if (projectIndex === -1) {
                return;
            }

            // Remember the current collection before deletion
            const previousProjects = projects.slice();

            // Remove only the selected project
            projects.splice(projectIndex, 1);

            // Save the updated collection
            if (!saveProjects()) {
                // Restore the collection if saving fails
                projects.splice(0, projects.length, ...previousProjects);
                renderProjects();
                return;
            }

            // Reset the form if the deleted project was being edited
            if (editingId === selectedProject.id) {
                resetForm();
            }

            renderProjects();

            message.textContent = 'Project deleted successfully.';
        });

        // Add both buttons to the actions container
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        // Build the project card
        listItem.appendChild(projectName);
        listItem.appendChild(projectStatus);
        listItem.appendChild(actions);

        projectList.appendChild(listItem);
    });

    // Show or hide the empty-state message
    if (emptyState) {
        emptyState.hidden = projects.length > 0;
    }
}

// Handle form submission
// This is the only submit listener.
form.addEventListener('submit', event => {
    event.preventDefault();

    // Read and validate the project name
    const name = nameInput.value.trim();

    if (name === '') {
        message.textContent = 'Please enter a project name.';
        nameInput.focus();
        return;
    }

    // Read the selected status
    const status = statusInput.value;

    if (editingId === null) {
        // Add mode: create a new project
        const project = {
            id: generateProjectId(),
            name: name,
            status: status
        };

        projects.push(project);

        // Save the new collection
        if (!saveProjects()) {
            // Roll back the addition if saving fails
            projects.pop();
            renderProjects();
            return;
        }

        message.textContent = 'Project added successfully.';
    } else {
        // Edit mode: locate the existing project
        const projectToUpdate = projects.find(
            project => project.id === editingId
        );

        if (!projectToUpdate) {
            message.textContent = 'Project not found.';
            resetForm();
            renderProjects();
            return;
        }

        // Preserve the old values in case saving fails
        const oldName = projectToUpdate.name;
        const oldStatus = projectToUpdate.status;

        // Update the existing record without changing its ID
        projectToUpdate.name = name;
        projectToUpdate.status = status;

        // Save the updated collection
        if (!saveProjects()) {
            // Restore the previous values if saving fails
            projectToUpdate.name = oldName;
            projectToUpdate.status = oldStatus;

            renderProjects();
            return;
        }

        message.textContent = 'Project updated successfully.';
    }

    renderProjects();
    resetForm();
});

// Cancel editing without changing stored projects
cancelButton.addEventListener('click', () => {
    if (editingId !== null) {
        message.textContent = 'Editing cancelled.';
    }

    resetForm();
});

// Restore saved projects when the page starts
loadProjects();
renderProjects();