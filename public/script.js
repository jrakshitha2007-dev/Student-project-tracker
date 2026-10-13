// Select the HTML elements
const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const message = document.querySelector('#message');

// Store projects in memory
const projects = [];

// Generate a unique ID for each project
function generateProjectId() {
    return crypto.randomUUID();
}

// Display all projects on the webpage
function renderProjects() {
    // Clear the existing list to prevent duplicates
    projectList.replaceChildren();

    // Display each project
    projects.forEach(project => {
        const listItem = document.createElement('li');

        const projectName = document.createElement('h3');
        projectName.textContent = project.name;

        const projectStatus = document.createElement('p');
        projectStatus.textContent = `Status: ${project.status}`;

        listItem.appendChild(projectName);
        listItem.appendChild(projectStatus);

        projectList.appendChild(listItem);
    });

    // Show or hide the empty-state message
    if (emptyState) {
        emptyState.hidden = projects.length > 0;
    }
}

// Handle form submission
form.addEventListener('submit', event => {
    // Prevent the browser's default form submission
    event.preventDefault();

    // Read and trim the project name
    const name = nameInput.value.trim();

    // Read the selected status
    const status = statusInput.value;

    // Reject an empty project name
    if (name === '') {
        message.textContent = 'Please enter a project name.';
        nameInput.focus();
        return;
    }

    // Create a new project object
    const project = {
        id: generateProjectId(),
        name: name,
        status: status
    };

    // Add the project to the array
    projects.push(project);

    // Update the displayed list
    renderProjects();

    // Clear the form for the next project
    form.reset();

    // Display a status message
    message.textContent = 'Project added successfully.';
});