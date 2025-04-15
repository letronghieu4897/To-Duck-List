const taskList = document.getElementById('taskList');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskFormModal = document.getElementById('taskFormModal');
const closeFormBtn = document.getElementById('closeFormBtn');
const taskForm = document.getElementById('taskForm');
const formTitle = document.getElementById('formTitle');
const taskIdInput = document.getElementById('taskId');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const deadlineInput = document.getElementById('deadline');
const creationDateContainer = document.getElementById('creationDateContainer');
const creationDate = document.getElementById('creationDate');
const completionDateContainer = document.getElementById('completionDateContainer');
const completionDate = document.getElementById('completionDate');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

let draggedItem = null;
let draggedIndex = null;

let tasks = [];

function init() {
  chrome.storage.sync.get(['tasks'], function(result) {
    if (result.tasks) {
      tasks = result.tasks;
      sortTasksByCompletion();
      renderTasks();
      updateBadge(); // Update badge with initial count
    } else {
      tasks = [
        {
          id: 1,
          title: 'Start Work',
          description: 'Begin daily tasks',
          time: '09:30',
          completed: false,
          createdAt: new Date().toISOString(),
          deadline: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // 1 day left (urgent - red)
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
          deadline: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(), // 2 hours ago (overdue - red)
          comments: [],
          order: 1
        },
        {
          id: 3,
          title: 'Status Checking',
          description: 'Review project progress (no deadline)',
          time: '16:30',
          completed: false,
          createdAt: new Date().toISOString(),
          // No deadline set (will show as green)
          comments: [],
          order: 2
        },
        {
          id: 4,
          title: 'Urgent Meeting',
          description: 'Prepare for urgent meeting (due today)',
          time: '10:30',
          completed: false,
          createdAt: new Date().toISOString(),
          deadline: new Date(new Date().setHours(new Date().getHours() + 3)).toISOString(), // 3 hours left
          comments: [],
          order: 3
        },
        {
          id: 5,
          title: 'Finish Work',
          description: 'Complete daily tasks',
          time: '18:30',
          completed: false,
          createdAt: new Date().toISOString(),
          deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(), // 14 days left (normal - blue)
          comments: [],
          order: 4
        }
      ];
      sortTasksByCompletion();
      saveTasks();
      renderTasks();
    }
  });

  addTaskBtn.addEventListener('click', openAddTaskModal);
  closeFormBtn.addEventListener('click', closeFormModal);
  
  document.getElementById('saveTaskBtn').addEventListener('click', handleSaveTask);
  
  taskList.addEventListener('click', handleTaskListClick);
}

function sortTasksByCompletion() {
  // First sort by order
  tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Then separate completed from incomplete
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Sort incomplete tasks by deadline (if exists)
  incompleteTasks.sort((a, b) => {
    // If both have deadlines, sort by deadline (earlier first)
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    // If only a has deadline, a comes first
    if (a.deadline) return -1;
    // If only b has deadline, b comes first
    if (b.deadline) return 1;
    // If neither has deadline, keep original order
    return 0;
  });
  
  // Combine them back with completed at the bottom
  tasks = [...incompleteTasks, ...completedTasks];
  
  // Update order based on new positions
  tasks.forEach((task, index) => {
    task.order = index;
  });
}

function saveTasks() {
  chrome.storage.sync.set({ tasks: tasks }, function() {
    updateBadge();
  });
}

function updateBadge() {
  const incompleteTasks = tasks.filter(task => !task.completed);
  const count = incompleteTasks.length;
  
  chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "" });
  
  chrome.action.setBadgeBackgroundColor({ color: '#f4a02c' });
}

function renderTasks() {
  taskList.innerHTML = '';

  const hasCompletedTasks = tasks.some(task => task.completed);
  
  if (tasks.length === 0) {
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
  
  const incompleteTasks = tasks.filter(task => !task.completed);
  renderTaskItems(incompleteTasks);
  
  if (hasCompletedTasks && incompleteTasks.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'task-separator';
    taskList.appendChild(separator);
  }
  
  const completedTasks = tasks.filter(task => task.completed);
  renderTaskItems(completedTasks);
}

function renderTaskItems(tasksArray) {
  tasksArray.forEach((task, index) => {
    // Check task deadline status
    let isOverdue = false;
    let daysRemaining = null;
    let hoursRemaining = null;
    let deadlineClass = '';
    
    if (task.deadline && !task.completed) {
      const deadlineDate = new Date(task.deadline);
      const currentDate = new Date();
      const isOverdue = deadlineDate < currentDate;
      
      // Set to beginning of day for accurate day calculation
      const currentDateDay = new Date(currentDate);
      currentDateDay.setHours(0, 0, 0, 0);
      const deadlineDateDay = new Date(deadlineDate);
      deadlineDateDay.setHours(0, 0, 0, 0);
      
      // Calculate days remaining
      const timeDiffDays = deadlineDateDay.getTime() - currentDateDay.getTime();
      daysRemaining = Math.ceil(timeDiffDays / (1000 * 3600 * 24));
      
      // Calculate hours remaining for tasks due today
      if (daysRemaining <= 0 && !isOverdue) {
        const timeDiffHours = deadlineDate.getTime() - currentDate.getTime();
        hoursRemaining = Math.ceil(timeDiffHours / (1000 * 3600));
      }
      
      if (isOverdue) {
        deadlineClass = 'overdue';
      } else if (daysRemaining <= 1) {
        deadlineClass = 'urgent';
      } else if (daysRemaining <= 7) {
        deadlineClass = 'warning';
      } else {
        deadlineClass = 'normal';
      }
    } else if (!task.completed) {
      // No deadline set and not completed
      deadlineClass = 'no-deadline';
    }

    const taskItem = document.createElement('li');
    taskItem.className = task.completed ? 'task-item completed' : 
                        `task-item ${deadlineClass}`;
    taskItem.dataset.id = task.id;
    taskItem.dataset.index = index;
    
    taskItem.setAttribute('draggable', 'true');
    
    taskItem.addEventListener('dragstart', handleDragStart);
    taskItem.addEventListener('dragenter', handleDragEnter);
    taskItem.addEventListener('dragover', handleDragOver);
    taskItem.addEventListener('dragleave', handleDragLeave);
    taskItem.addEventListener('drop', handleDrop);
    taskItem.addEventListener('dragend', handleDragEnd);
    
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
    
    const taskDates = document.createElement('div');
    taskDates.className = 'task-dates';
    
    // Add deadline if it exists
    if (task.deadline) {
      const deadlineObj = new Date(task.deadline);
      const now = new Date();
      const isOverdue = !task.completed && deadlineObj < now;
      
      const formattedDeadline = formatDateShort(deadlineObj);
      const deadlineElement = document.createElement('div');
      deadlineElement.className = `task-date deadline ${isOverdue ? 'overdue' : ''}`;
      
      // Add time remaining info if not completed and not overdue
      let deadlineText = formattedDeadline;
      if (!task.completed && !isOverdue) {
        if (hoursRemaining !== null && hoursRemaining <= 24) {
          // Show hours remaining when less than a day is left
          const hourText = hoursRemaining === 1 ? 'hour' : 'hours';
          deadlineText += ` <span class="hours-remaining">${hoursRemaining} ${hourText} left</span>`;
        } else if (daysRemaining !== null) {
          // Otherwise show days remaining
          const dayText = daysRemaining === 1 ? 'day' : 'days';
          
          // Apply different styles based on urgency
          let daysClass = 'days-remaining';
          if (daysRemaining > 7) {
            daysClass += ' normal';
          }
          
          deadlineText += ` <span class="${daysClass}">${daysRemaining} ${dayText} left</span>`;
        }
      }
      
      deadlineElement.innerHTML = `<i class="fas fa-clock"></i> ${deadlineText}`;
      taskDates.appendChild(deadlineElement);
    }
    
    const createdDateObj = new Date(task.createdAt);
    const formattedCreationDate = formatDateShort(createdDateObj);
    const createdElement = document.createElement('div');
    createdElement.className = 'task-date created';
    createdElement.innerHTML = `<i class="fas fa-calendar-plus"></i> ${formattedCreationDate}`;
    taskDates.appendChild(createdElement);
    
    if (task.completed && task.completedAt) {
      const completedDateObj = new Date(task.completedAt);
      const formattedCompletionDate = formatDateShort(completedDateObj);
      const completedElement = document.createElement('div');
      completedElement.className = 'task-date completed';
      completedElement.innerHTML = `<i class="fas fa-calendar-check"></i> ${formattedCompletionDate}`;
      taskDates.appendChild(completedElement);
    }
    
    taskContent.appendChild(taskTitle);
    taskContent.appendChild(taskDescription);
    taskContent.appendChild(taskDates);
    
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

function formatDateShort(dateObj) {
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month} ${hours}:${minutes}`;
}

function handleDragStart(e) {
  const taskId = parseInt(e.target.dataset.id);
  const task = tasks.find(t => t.id === taskId);
  if (task && task.completed) {
    e.preventDefault();
    return;
  }

  draggedItem = e.target;
  draggedIndex = parseInt(e.target.dataset.index);
  
  setTimeout(() => {
    e.target.classList.add('dragging');
  }, 0);
  
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function handleDragEnter(e) {
  e.preventDefault();
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const taskElement = e.target.closest('.task-item');
  if (taskElement) {
    const taskId = parseInt(taskElement.dataset.id);
    const task = tasks.find(t => t.id === taskId);
    
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
  
  const dropTarget = e.target.closest('.task-item');
  if (!dropTarget) return;
  
  const targetTaskId = parseInt(dropTarget.dataset.id);
  const targetTask = tasks.find(t => t.id === targetTaskId);
  if (targetTask && targetTask.completed) return;
  
  dropTarget.classList.remove('drag-over');
  
  const draggedTaskId = parseInt(draggedItem.dataset.id);
  
  const targetIndex = parseInt(dropTarget.dataset.index);
  
  if (draggedIndex !== targetIndex) {
    const [movedTask] = tasks.splice(draggedIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);
    
    tasks.forEach((task, index) => {
      task.order = index;
    });
    
    saveTasks();
    renderTasks();
  }
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  
  document.querySelectorAll('.task-item').forEach(item => {
    item.classList.remove('drag-over');
  });
  
  draggedItem = null;
  draggedIndex = null;
}

function handleTaskListClick(event) {
  const taskId = parseInt(event.target.closest('li, .task-check, .delete-btn')?.dataset.id);
  if (!taskId) return;
  
  if (event.target.closest('.task-check')) {
    toggleTaskCompletion(taskId);
  } else if (event.target.closest('.delete-btn')) {
    deleteTask(taskId);
  } else if (!event.target.closest('.drag-handle') && event.target.closest('.task-item')) {
    openEditTaskModal(taskId);
  }
}

function toggleTaskCompletion(taskId) {
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    
    if (tasks[taskIndex].completed) {
      tasks[taskIndex].completedAt = new Date().toISOString();
      showToast(`Task "${tasks[taskIndex].title}" completed!`, 'success', 'fa-check-circle');
    } else {
      delete tasks[taskIndex].completedAt;
    }
    
    sortTasksByCompletion();
    
    saveTasks();
    renderTasks();
  }
}

function openAddTaskModal() {
  taskIdInput.value = '';
  titleInput.value = '';
  descriptionInput.value = '';
  deadlineInput.value = '';
  creationDateContainer.style.display = 'none';
  completionDateContainer.style.display = 'none';
  taskFormModal.style.display = 'block';
  
  document.getElementById('saveTaskBtn').textContent = 'Save New Task';
}

function openEditTaskModal(taskId) {
  const task = tasks.find(task => task.id === taskId);
  
  if (task) {
    taskIdInput.value = taskId;
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const localDeadline = new Date(deadlineDate.getTime() - (deadlineDate.getTimezoneOffset() * 60000))
        .toISOString()
        .slice(0, 16);
      deadlineInput.value = localDeadline;
    } else {
      deadlineInput.value = '';
    }
    
    document.getElementById('saveTaskBtn').textContent = 'Update Task';
    
    const dateObj = new Date(task.createdAt);
    const formattedCreationDate = formatDate(dateObj);
    creationDate.textContent = formattedCreationDate;
    creationDateContainer.style.display = 'block';
    
    if (task.completed && task.completedAt) {
      const completionObj = new Date(task.completedAt);
      const formattedCompletionDate = formatDate(completionObj);
      completionDate.textContent = formattedCompletionDate;
      completionDateContainer.style.display = 'block';
    } else {
      completionDateContainer.style.display = 'none';
    }
    
    taskFormModal.style.display = 'block';
  }
}

function closeFormModal() {
  taskFormModal.style.display = 'none';
}

function handleSaveTask(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }
  
  const taskId = taskIdInput.value ? parseInt(taskIdInput.value) : null;
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const deadline = deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null;
  
  if (!title) return;
  
  if (taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].title = title;
      tasks[taskIndex].description = description;
      tasks[taskIndex].deadline = deadline;
      showToast(`Task "${title}" updated!`, 'info', 'fa-edit');
    }
  } else {
    const newId = tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) + 1 : 1;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newTask = {
      id: newId,
      title: title,
      description: description,
      deadline: deadline,
      time: time,
      completed: false,
      createdAt: now.toISOString(),
      comments: [],
      order: 0
    };
    
    tasks.forEach(task => {
      task.order = (task.order || 0) + 1;
    });
    
    tasks.unshift(newTask);
    sortTasksByCompletion();
    
    showToast(`Task "${title}" added!`, 'info', 'fa-plus-circle');
  }
  
  saveTasks();
  renderTasks();
  closeFormModal();
}

function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      const taskTitle = tasks[taskIndex].title;
      tasks.splice(taskIndex, 1);
      tasks.forEach((task, index) => {
        task.order = index;
      });
      saveTasks();
      renderTasks();
      showToast(`Task "${taskTitle}" deleted!`, 'danger', 'fa-trash');
    }
  }
}

function showToast(message, type = 'success', icon = 'fa-check-circle', duration = 3000) {
  toastMessage.textContent = message;
  
  toastIcon.className = `fas ${icon}`;
  
  toast.classList.remove('success', 'danger', 'info');
  
  toast.classList.add(type);
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function formatDate(dateObj) {
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  
  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', init); 

