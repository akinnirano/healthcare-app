# Healthcare API Documentation Website

A beautiful, Climatiq-inspired documentation website for the Healthcare API.

## Features

- 🎨 **Dark Theme** - Modern, professional dark mode design
- 📱 **Responsive** - Works on all devices
- 🔍 **Search** - Quick search functionality
- 📖 **Three-Column Layout** - Navigation, Content, and "On This Page" sidebars
- ⚡ **Fast** - Built with Vite + React
- 🎯 **Tailwind CSS** - Beautiful styling with utility classes

## Design Inspiration

Inspired by the Climatiq API documentation with:
- Teal header with logo, navigation, and search
- Left sidebar with hierarchical navigation
- Main content area with clean typography
- Right sidebar "On This Page" navigation
- Code examples with syntax highlighting
- Error reference guides

## Getting Started

### Installation

```bash
cd docs-website
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:3001` in your browser.

### Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Project Structure

```
docs-website/
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Top navigation bar
│   │   ├── Sidebar.jsx         # Left navigation sidebar
│   │   ├── MainContent.jsx     # Main documentation content
│   │   └── OnThisPage.jsx      # Right "On This Page" sidebar
│   ├── styles/
│   │   └── index.css           # Global styles and Tailwind imports
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # React entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Customization

### Update Content

Edit `src/components/MainContent.jsx` to update the main documentation content.

### Update Navigation

Edit `src/components/Sidebar.jsx` to update the left sidebar navigation items.

### Update Styles

- Edit `tailwind.config.js` for theme customization
- Colors are defined in the `extend` section:
  - `dark-bg`: Main background color
  - `dark-sidebar`: Sidebar background color
  - `dark-content`: Content area background color
  - `teal-accent`: Accent color (header, links, etc.)

### Add New Pages

1. Create a new component in `src/pages/`
2. Add routing in `src/App.jsx`
3. Update navigation in `src/components/Sidebar.jsx`

## Integration with Existing API

The documentation site can be deployed alongside your existing FastAPI application:

1. Build the documentation: `npm run build`
2. Serve the `dist/` folder at a subdomain or path (e.g., `docs.hremsoftconsulting.com`)
3. Link from your main API docs page

## Deployment Options

### Option 1: Serve with Nginx

```nginx
server {
    listen 80;
    server_name docs.hremsoftconsulting.com;

    root /path/to/docs-website/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 2: Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Option 3: Deploy to Netlify

```bash
npm run build
# Drag and drop the dist/ folder to Netlify
```

### Option 4: Serve from FastAPI

Add this to your FastAPI `main.py`:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/docs-site", StaticFiles(directory="docs-website/dist", html=True), name="docs-site")
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon set
- **React Router** - Client-side routing

## License

Proprietary - HREM Soft Consulting

## Support

For questions or issues with the documentation website:
- Email: support@hremsoftconsulting.com
- Website: https://healthcare.hremsoftconsulting.com

