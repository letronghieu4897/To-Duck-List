# To-Duck List - Chrome Extension Task Manager

To-Duck List is a lightweight and user-friendly Chrome Extension that helps you manage your tasks directly from your browser. With a clean and intuitive interface, it allows you to create, organize, and track your tasks efficiently.

## Features

- ✨ Clean, modern interface
- 📝 Create and manage tasks with titles and descriptions
- 📅 Set deadlines for tasks with visual countdown indicators
- 🎨 Color-coded tasks based on deadline urgency
- ⏰ Shows hours remaining for same-day deadlines
- ✅ Mark tasks as complete with visual feedback
- 🗑️ Delete tasks you no longer need
- 🔄 Tasks persist between browser sessions
- 🎯 Tasks automatically sorted by deadline proximity
- 🖱️ Drag and drop to reorder tasks

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/letronghieu4897/To-Duck-List.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the extension directory

## Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development
1. Make your changes to the source files
2. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Find To-Duck-List
   - Click the refresh icon

### Project Structure
```
To-Duck-List/
├── manifest.json       # Extension configuration
├── popup.html          # Main extension popup
├── js/
│   ├── app.js          # Main application logic
├── css/
│   └── style.css       # Styling
├── icons/              # Extension icons
```

## Usage

1. Click the To-Duck-List icon in your Chrome toolbar
2. Add a new task:
   - Click the "+" button
   - Enter task title and description
   - Set a deadline (optional)
   - Click Save

3. Manage tasks:
   - Click the checkbox to mark a task as complete
   - Click the trash icon to delete a task
   - Drag tasks to reorder them
   - Completed tasks show with strikethrough and different styling

4. Deadline Color-Coding:
   - 🔴 **Red**: Overdue tasks or due within 1 day
   - 🟠 **Orange**: Tasks due within 2-7 days
   - 🔵 **Blue**: Tasks due after 7 days
   - 🟢 **Green**: Tasks with no deadline
   - ⚪ **Gray**: Completed tasks

## Storage

Tasks are stored in Chrome's local storage, ensuring your tasks persist between browser sessions. No data is sent to external servers.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons provided by [Material Icons](https://material.io/icons/)
- Color scheme inspired by modern design principles 
