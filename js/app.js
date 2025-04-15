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
      updateBadge();
    } else {
      tasks = [
        {
          id: 1,
          title: 'Start Work',
          description: 'Begin daily tasks',
          time: '09:30',
          completed: false,
          createdAt: new Date().toISOString(),
          deadline: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
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
          deadline: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
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
          deadline: new Date(new Date().setHours(new Date().getHours() + 3)).toISOString(),
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
          completedAt: new Date().toISOString(),
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
  tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  incompleteTasks.sort((a, b) => {
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });
  
  tasks = [...incompleteTasks, ...completedTasks];
  
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
      <img src="images/no-tasks.png" alt="No tasks" class="no-tasks-image">
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
    let isOverdue = false;
    let daysRemaining = null;
    let hoursRemaining = null;
    let deadlineClass = '';
    let timeRemainingElement = null;
    
    if (task.deadline && !task.completed) {
      const deadlineDate = new Date(task.deadline);
      const currentDate = new Date();
      isOverdue = deadlineDate < currentDate;
      
      const currentDateDay = new Date(currentDate);
      currentDateDay.setHours(0, 0, 0, 0);
      const deadlineDateDay = new Date(deadlineDate);
      deadlineDateDay.setHours(0, 0, 0, 0);
      
      const timeDiffDays = deadlineDateDay.getTime() - currentDateDay.getTime();
      daysRemaining = Math.ceil(timeDiffDays / (1000 * 3600 * 24));
      
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
      
      if (!task.completed) {
        timeRemainingElement = document.createElement('div');
        timeRemainingElement.className = 'time-remaining-indicator';
        
        if (isOverdue) {
          timeRemainingElement.innerHTML = `<span class="overdue">Overdue</span>`;
        } else if (hoursRemaining !== null && hoursRemaining > 0) {
          timeRemainingElement.innerHTML = `<span class="hours-remaining">${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} left</span>`;
        } else if (daysRemaining !== null && !isOverdue) {
          const daysText = daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`;
          const urgencyClass = daysRemaining <= 7 ? 'urgent' : 'normal';
          timeRemainingElement.innerHTML = `<span class="days-remaining ${urgencyClass}">${daysText}</span>`;
        }
      }
    } else if (!task.completed) {
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
    
    if (timeRemainingElement) {
      taskContent.appendChild(timeRemainingElement);
    }
    
    const taskTitle = document.createElement('div');
    taskTitle.className = 'task-title';
    taskTitle.textContent = task.title;
    
    const taskDescription = document.createElement('div');
    taskDescription.className = 'task-description';
    taskDescription.textContent = task.description;
    
    const taskDates = document.createElement('div');
    taskDates.className = 'task-dates';
    
    const createdDate = document.createElement('div');
    createdDate.className = 'task-date created';
    createdDate.innerHTML = `<i class="far fa-calendar-plus"></i> ${formatDateShort(new Date(task.createdAt))}`;
    
    taskDates.appendChild(createdDate);
    
    if (task.completed && task.completedAt) {
      const completedDateEl = document.createElement('div');
      completedDateEl.className = 'task-date completed';
      completedDateEl.innerHTML = `<i class="far fa-calendar-check"></i> ${formatDateShort(new Date(task.completedAt))}`;
      taskDates.appendChild(completedDateEl);
    }
    
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      let deadlineText = `<i class="far fa-calendar-alt"></i> ${formatDateShort(deadlineDate)}`;
      
      const deadlineDateEl = document.createElement('div');
      deadlineDateEl.className = isOverdue ? 'task-date deadline overdue' : 'task-date deadline';
      
      deadlineDateEl.innerHTML = deadlineText;
      taskDates.appendChild(deadlineDateEl);
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = task.id;
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    
    taskContent.appendChild(taskTitle);
    taskContent.appendChild(taskDescription);
    taskContent.appendChild(taskDates);
    
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
  draggedItem = this;
  draggedIndex = parseInt(this.dataset.index);
  
  setTimeout(() => {
    this.classList.add('dragging');
  }, 0);
  
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnter(e) {
  e.preventDefault();
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const targetItem = e.target.closest('.task-item');
  
  if (targetItem && targetItem !== draggedItem) {
    targetItem.classList.add('drag-over');
  }
  
  return false;
}

function handleDragLeave(e) {
  e.target.closest('.task-item')?.classList.remove('drag-over');
}

function handleDrop(e) {
  e.stopPropagation();
  
  const targetItem = e.target.closest('.task-item');
  
  if (!targetItem || targetItem === draggedItem) {
    return false;
  }
  
  const targetIndex = parseInt(targetItem.dataset.index);
  
  const targetTask = tasks.find(task => task.id === parseInt(targetItem.dataset.id));
  const draggedTask = tasks.find(task => task.id === parseInt(draggedItem.dataset.id));
  
  if (targetTask && draggedTask) {
    const tempOrder = targetTask.order;
    targetTask.order = draggedTask.order;
    draggedTask.order = tempOrder;
    
    saveTasks();
    renderTasks();
  }
  
  return false;
}

function handleDragEnd(e) {
  const taskItems = document.querySelectorAll('.task-item');
  taskItems.forEach(item => {
    item.classList.remove('dragging', 'drag-over');
  });
}

function handleTaskListClick(event) {
  if (event.target.closest('.task-check')) {
    const taskId = parseInt(event.target.closest('.task-check').dataset.id);
    toggleTaskCompletion(taskId);
  } else if (event.target.closest('.delete-btn')) {
    const taskId = parseInt(event.target.closest('.delete-btn').dataset.id);
    deleteTask(taskId);
  } else if (event.target.closest('.task-item')) {
    const taskId = parseInt(event.target.closest('.task-item').dataset.id);
    openEditTaskModal(taskId);
  }
}

function toggleTaskCompletion(taskId) {
  const task = tasks.find(task => task.id === taskId);
  
  if (task) {
    task.completed = !task.completed;
    if (task.completed) {
      task.completedAt = new Date().toISOString();
      showToast(`Task "${task.title}" completed!`, 'success', 'fa-check-circle');
    } else {
      task.completedAt = null;
    }
    
    sortTasksByCompletion();
    saveTasks();
    renderTasks();
  }
}

function openAddTaskModal() {
  taskForm.reset();
  taskIdInput.value = '';
  
  creationDateContainer.style.display = 'none';
  completionDateContainer.style.display = 'none';
  
  const datesContainer = document.querySelector('.dates-container');
  datesContainer.classList.remove('single-date');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);
  
  deadlineInput.value = tomorrow.toISOString().slice(0, 16);
  
  taskFormModal.style.display = 'block';
}

function openEditTaskModal(taskId) {
  const task = tasks.find(task => task.id === taskId);
  
  if (task) {
    taskForm.reset();
    
    taskIdInput.value = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description;
    
    if (task.deadline) {
      deadlineInput.value = new Date(task.deadline).toISOString().slice(0, 16);
    } else {
      deadlineInput.value = '';
    }
    
    creationDateContainer.style.display = 'block';
    creationDate.textContent = formatDate(new Date(task.createdAt));
    
    const datesContainer = document.querySelector('.dates-container');
    
    if (task.completed && task.completedAt) {
      completionDateContainer.style.display = 'block';
      completionDate.textContent = formatDate(new Date(task.completedAt));
      datesContainer.classList.remove('single-date');
    } else {
      completionDateContainer.style.display = 'none';
      datesContainer.classList.add('single-date');
    }
    
    taskFormModal.style.display = 'block';
  }
}

function closeFormModal() {
  taskFormModal.style.display = 'none';
}

function handleSaveTask(event) {
  event.preventDefault();
  
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const deadline = deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null;
  
  if (!title) {
    showToast('Please enter a task title', 'danger', 'fa-exclamation-circle');
    return;
  }
  
  const taskId = taskIdInput.value ? parseInt(taskIdInput.value) : null;
  
  if (taskId) {
    const existingTask = tasks.find(task => task.id === taskId);
    
    if (existingTask) {
      existingTask.title = title;
      existingTask.description = description;
      existingTask.deadline = deadline;
      
      showToast(`Task "${title}" updated`, 'info', 'fa-info-circle');
    }
  } else {
    const newTaskId = tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) + 1 : 1;
    
    const newTask = {
      id: newTaskId,
      title,
      description,
      completed: false,
      createdAt: new Date().toISOString(),
      deadline,
      order: tasks.length
    };
    
    tasks.push(newTask);
    showToast(`Task "${title}" added`, 'success', 'fa-check-circle');
  }
  
  sortTasksByCompletion();
  saveTasks();
  renderTasks();
  closeFormModal();
}

function deleteTask(taskId) {
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    const taskTitle = tasks[taskIndex].title;
    tasks.splice(taskIndex, 1);
    
    sortTasksByCompletion();
    saveTasks();
    renderTasks();
    
    showToast(`Task "${taskTitle}" deleted`, 'info', 'fa-trash');
  }
}

function showToast(message, type = 'success', icon = 'fa-check-circle', duration = 3000) {
  toastMessage.textContent = message;
  toastIcon.className = `fas ${icon}`;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, duration);
}

function formatDate(dateObj) {
  return dateObj.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

document.addEventListener('DOMContentLoaded', init); 

