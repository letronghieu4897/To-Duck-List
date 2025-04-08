# Taskily - Chrome Extension Task Manager

Taskily is a lightweight and user-friendly Chrome Extension that helps you manage your tasks directly from your browser. With a clean and intuitive interface, it allows you to create, organize, and track your tasks efficiently.

## Features

- ✨ Clean, modern interface
- 📝 Create and manage tasks with titles and descriptions
- ✅ Mark tasks as complete with visual feedback
- 🗑️ Delete tasks you no longer need
- 🔄 Tasks persist between browser sessions
- 🎨 Visual distinction between completed and pending tasks
- 🖱️ Drag and drop to reorder tasks

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/letronghieu4897/To-Duck-List.git
   cd taskily
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
   - Find Taskily
   - Click the refresh icon

### Project Structure
```
taskily/
├── manifest.json       # Extension configuration
├── popup.html          # Main extension popup
├── js/
│   ├── popup.js        # Main application logic
│   └── background.js   # Background scripts
├── css/
│   └── style.css       # Styling
├── icons/              # Extension icons
```

## Usage

1. Click the Taskily icon in your Chrome toolbar
2. Add a new task:
   - Click the "+" button
   - Enter task title and description
   - Press Enter or click Add

3. Manage tasks:
   - Click the checkbox to mark a task as complete
   - Click the trash icon to delete a task
   - Drag tasks to reorder them
   - Completed tasks show with strikethrough and different styling

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