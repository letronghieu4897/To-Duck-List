// DOM Elements
const taskList = document.getElementById('taskList');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskFormModal = document.getElementById('taskFormModal');
const closeFormBtn = document.getElementById('closeFormBtn');
const taskForm = document.getElementById('taskForm');
const formTitle = document.getElementById('formTitle');
const taskIdInput = document.getElementById('taskId');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const creationDateContainer = document.getElementById('creationDateContainer');
const creationDate = document.getElementById('creationDate');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

// Store drag information
let draggedItem = null;
let draggedIndex = null;

// Sample data (replace with actual storage)
let tasks = [];

// Initialize application
function init() {
  // Load tasks from Chrome storage
  chrome.storage.sync.get(['tasks'], function(result) {
    if (result.tasks) {
      tasks = result.tasks;
      sortTasksByCompletion();
      renderTasks();
      updateBadge(); // Update badge with initial count
    } else {
      // Add some sample tasks if none exist
      tasks = [
        {
          id: 1,
          title: 'Start Work',
          description: 'Begin daily tasks',
          time: '09:30',
          completed: false,
          createdAt: new Date().toISOString(),
          comments: [],
          order: 0
        },
        {
          id: 2,
          title: 'Visit Consumer',
          description: 'Schedule meeting with client',
          time: '14:30',
          completed: false,
          createdAt: new Date().toISOString(),
          comments: [],
          order: 1
        },
        {
          id: 3,
          title: 'Status Checking',
          description: 'Review project progress',
          time: '16:30',
          completed: false,
          createdAt: new Date().toISOString(),
          comments: [],
          order: 2
        },
        {
          id: 4,
          title: 'Finish Work',
          description: 'Complete daily tasks',
          time: '18:30',
          completed: false,
          createdAt: new Date().toISOString(),
          comments: [],
          order: 3
        },
        {
          id: 5,
          title: 'Morning',
          description: 'Morning routine tasks',
          time: '08:30',
          completed: true,
          createdAt: new Date().toISOString(),
          comments: [],
          order: 4
        }
      ];
      sortTasksByCompletion();
      saveTasks();
      renderTasks();
    }
  });

  // Add event listeners
  addTaskBtn.addEventListener('click', openAddTaskModal);
  closeFormBtn.addEventListener('click', closeFormModal);
  taskForm.addEventListener('submit', handleSaveTask);
  
  // Add event delegation for task list interactions
  taskList.addEventListener('click', handleTaskListClick);
}

// Sort tasks - incomplete first, completed at the bottom
function sortTasksByCompletion() {
  // First sort by order
  tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Then separate completed from incomplete
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Combine them back with completed at the bottom
  tasks = [...incompleteTasks, ...completedTasks];
  
  // Update order based on new positions
  tasks.forEach((task, index) => {
    task.order = index;
  });
}

// Save tasks to Chrome storage
function saveTasks() {
  chrome.storage.sync.set({ tasks: tasks }, function() {
    // Update badge with count of incomplete tasks
    updateBadge();
  });
}

// Update the extension badge with count of incomplete tasks
function updateBadge() {
  const incompleteTasks = tasks.filter(task => !task.completed);
  const count = incompleteTasks.length;
  
  // Set badge text to the count (empty string if zero)
  chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "" });
  
  // Set badge background color (blue for our theme)
  chrome.action.setBadgeBackgroundColor({ color: '#f4a02c' });
}

// Render tasks to the UI
function renderTasks() {
  taskList.innerHTML = '';

  // Check if we have any completed tasks
  const hasCompletedTasks = tasks.some(task => task.completed);
  
  if (tasks.length === 0) {
    // Show empty state message
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <i class="fas fa-clipboard-list"></i>
      <p>No tasks yet</p>
      <p>Click the + button to add a new task</p>
    `;
    taskList.appendChild(emptyState);
    return;
  }
  
  // First, render incomplete tasks
  const incompleteTasks = tasks.filter(task => !task.completed);
  renderTaskItems(incompleteTasks);
  
  // Add separator if we have both incomplete and completed tasks
  if (hasCompletedTasks && incompleteTasks.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'task-separator';
    taskList.appendChild(separator);
  }
  
  // Then render completed tasks
  const completedTasks = tasks.filter(task => task.completed);
  renderTaskItems(completedTasks);
}

// Helper function to render task items
function renderTaskItems(tasksArray) {
  tasksArray.forEach((task, index) => {
    const taskItem = document.createElement('li');
    taskItem.className = task.completed ? 'task-item completed' : 'task-item';
    taskItem.dataset.id = task.id;
    taskItem.dataset.index = index;
    
    // Add drag and drop attributes
    taskItem.setAttribute('draggable', 'true');
    
    // Add drag event listeners
    taskItem.addEventListener('dragstart', handleDragStart);
    taskItem.addEventListener('dragenter', handleDragEnter);
    taskItem.addEventListener('dragover', handleDragOver);
    taskItem.addEventListener('dragleave', handleDragLeave);
    taskItem.addEventListener('drop', handleDrop);
    taskItem.addEventListener('dragend', handleDragEnd);
    
    // Add drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    
    const taskCheck = document.createElement('div');
    taskCheck.className = `task-check ${task.completed ? 'completed' : ''}`;
    taskCheck.dataset.id = task.id;
    if (task.completed) {
      taskCheck.innerHTML = '<i class="fas fa-check"></i>';
    }
    
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    const taskTitle = document.createElement('div');
    taskTitle.className = 'task-title';
    taskTitle.textContent = task.title;
    
    const taskDescription = document.createElement('div');
    taskDescription.className = 'task-description';
    taskDescription.textContent = task.description || 'No description';
    
    taskContent.appendChild(taskTitle);
    taskContent.appendChild(taskDescription);
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.dataset.id = task.id;
    deleteBtn.title = 'Delete task';
    
    taskItem.appendChild(dragHandle);
    taskItem.appendChild(taskCheck);
    taskItem.appendChild(taskContent);
    taskItem.appendChild(deleteBtn);
    
    taskList.appendChild(taskItem);
  });
}

// Drag and drop handlers
function handleDragStart(e) {
  // Don't allow dragging completed tasks
  const taskId = parseInt(e.target.dataset.id);
  const task = tasks.find(t => t.id === taskId);
  if (task && task.completed) {
    e.preventDefault();
    return;
  }

  draggedItem = e.target;
  draggedIndex = parseInt(e.target.dataset.index);
  
  // Add dragging class
  setTimeout(() => {
    e.target.classList.add('dragging');
  }, 0);
  
  // Set data for drag
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function handleDragEnter(e) {
  e.preventDefault();
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  // Only add drag-over class if we're not dragging over a completed task
  const taskElement = e.target.closest('.task-item');
  if (taskElement) {
    const taskId = parseInt(taskElement.dataset.id);
    const task = tasks.find(t => t.id === taskId);
    
    // Don't allow dropping on completed tasks
    if (task && !task.completed) {
      taskElement.classList.add('drag-over');
    }
  }
}

function handleDragLeave(e) {
  e.target.closest('.task-item')?.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  
  // Find the drop target
  const dropTarget = e.target.closest('.task-item');
  if (!dropTarget) return;
  
  // Get the target task and make sure it's not completed
  const targetTaskId = parseInt(dropTarget.dataset.id);
  const targetTask = tasks.find(t => t.id === targetTaskId);
  if (targetTask && targetTask.completed) return;
  
  // Remove drag-over class
  dropTarget.classList.remove('drag-over');
  
  // Get dropped task ID and target ID
  const draggedTaskId = parseInt(draggedItem.dataset.id);
  
  // Get indices
  const targetIndex = parseInt(dropTarget.dataset.index);
  
  if (draggedIndex !== targetIndex) {
    // Reorder tasks array
    const [movedTask] = tasks.splice(draggedIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);
    
    // Update order properties
    tasks.forEach((task, index) => {
      task.order = index;
    });
    
    // Save and render
    saveTasks();
    renderTasks();
  }
}

function handleDragEnd(e) {
  // Remove dragging class
  e.target.classList.remove('dragging');
  
  // Remove any leftover drag-over classes
  document.querySelectorAll('.task-item').forEach(item => {
    item.classList.remove('drag-over');
  });
  
  // Reset dragged item
  draggedItem = null;
  draggedIndex = null;
}

// Handle clicks on the task list
function handleTaskListClick(event) {
  const taskId = parseInt(event.target.closest('li, .task-check, .delete-btn')?.dataset.id);
  if (!taskId) return;
  
  // Check if the click was on the checkbox area
  if (event.target.closest('.task-check')) {
    toggleTaskCompletion(taskId);
  } else if (event.target.closest('.delete-btn')) {
    // If click was on the delete button
    deleteTask(taskId);
  } else if (!event.target.closest('.drag-handle') && event.target.closest('.task-item')) {
    // If click was on the task item (but not the drag handle, checkbox or delete button), open edit form
    openEditTaskModal(taskId);
  }
}

// Toggle task completion status
function toggleTaskCompletion(taskId) {
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    
    // Sort tasks with completed ones at the bottom
    sortTasksByCompletion();
    
    saveTasks();
    renderTasks();
    
    // Show notification if task is completed
    if (tasks[taskIndex].completed) {
      showToast(`Task "${tasks[taskIndex].title}" completed!`, 'success', 'fa-check-circle');
    }
  }
}

// Open add task modal
function openAddTaskModal() {
  formTitle.textContent = 'Add New Task';
  taskIdInput.value = '';
  titleInput.value = '';
  descriptionInput.value = '';
  creationDateContainer.style.display = 'none';
  taskFormModal.style.display = 'block';
}

// Open edit task modal
function openEditTaskModal(taskId) {
  const task = tasks.find(task => task.id === taskId);
  
  if (task) {
    formTitle.textContent = 'Edit Task';
    taskIdInput.value = taskId;
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    
    // Format creation date like in the reference image (HH:MM:SS D/M/YYYY)
    const dateObj = new Date(task.createdAt);
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    const formattedDate = `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    creationDate.textContent = formattedDate;
    creationDateContainer.style.display = 'block';
    
    // Show the modal
    taskFormModal.style.display = 'block';
  }
}

// Close task form modal
function closeFormModal() {
  taskFormModal.style.display = 'none';
}

// Handle save task form submission
function handleSaveTask(event) {
  event.preventDefault();
  
  const taskId = taskIdInput.value ? parseInt(taskIdInput.value) : null;
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  
  if (!title) return;
  
  if (taskId) {
    // Update existing task
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].title = title;
      tasks[taskIndex].description = description;
      // Show notification for task update
      showToast(`Task "${title}" updated!`, 'info', 'fa-edit');
    }
  } else {
    // Create new task
    const newId = tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) + 1 : 1;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newTask = {
      id: newId,
      title: title,
      description: description,
      time: time,
      completed: false,
      createdAt: now.toISOString(),
      comments: [],
      order: 0 // New tasks at the top
    };
    
    // Increment order for existing tasks
    tasks.forEach(task => {
      task.order = (task.order || 0) + 1;
    });
    
    tasks.unshift(newTask);
    sortTasksByCompletion();
    
    // Show notification for new task
    showToast(`Task "${title}" added!`, 'info', 'fa-plus-circle');
  }
  
  saveTasks();
  renderTasks();
  closeFormModal();
}

// Delete task
function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const taskTitle = tasks[taskIndex].title;
      tasks.splice(taskIndex, 1);
      // Update order properties after deletion
      tasks.forEach((task, index) => {
        task.order = index;
      });
      saveTasks();
      renderTasks();
      // Show notification for task deletion
      showToast(`Task "${taskTitle}" deleted!`, 'danger', 'fa-trash');
    }
  }
}

// Show toast notification
function showToast(message, type = 'success', icon = 'fa-check-circle', duration = 3000) {
  // Set the message
  toastMessage.textContent = message;
  
  // Set the icon
  toastIcon.className = `fas ${icon}`;
  
  // Remove all type classes
  toast.classList.remove('success', 'danger', 'info');
  
  // Add the type class
  toast.classList.add(type);
  
  // Show the toast
  toast.classList.add('show');
  
  // Hide after duration
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init); 